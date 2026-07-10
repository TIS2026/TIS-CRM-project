const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, '..', 'Data Uploads', 'Standardized');

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

async function main() {
    console.log('Ensuring Admin user exists...');
    let adminUser = await prisma.user.findFirst({
        where: { role: 'Admin' }
    });

    if (!adminUser) {
        adminUser = await prisma.user.create({
            data: {
                name: 'System Admin',
                role: 'Admin'
            }
        });
    }

    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));

    for (const file of files) {
        console.log(`\nImporting ${file}...`);
        const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
        const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
        
        let successCount = 0;
        let errorCount = 0;

        const chunks = chunkArray(parsed.data, 2000); // Larger chunks for createMany

        for (const chunk of chunks) {
            try {
                const leadsToCreate = [];
                const rowData = [];

                // Prepare Leads
                for (const row of chunk) {
                    let pContact = (row.parentContactNumber || '').trim();
                    let sContact = (row.studentContactNumber || '').trim();
                    if (!pContact && sContact) pContact = sContact;
                    if (!sContact && pContact) sContact = pContact;
                    if (!pContact) pContact = '0000000000';
                    if (!sContact) sContact = '0000000000';
                    
                    const dedupStr = `${pContact}_${row.studentName || ''}`.trim();
                    
                    let leadType = 'New';
                    if (row.leadType && row.leadType.toLowerCase() === 'repeat') leadType = 'Repeat';

                    leadsToCreate.push({
                        studentName: row.studentName,
                        studentEmail: row.studentEmail,
                        studentContactNumber: sContact,
                        parentName: row.parentName,
                        parentEmail: row.parentEmail,
                        parentContactNumber: pContact,
                        parent2Name: row.parent2Name,
                        parent2ContactNumber: row.parent2ContactNumber,
                        school: row.school,
                        studentGrade: row.studentGrade,
                        city: row.city,
                        country: row.country,
                        counselorName: row.counselorName,
                        leadType: leadType,
                        createdSource: 'Bulk Upload',
                        dedupKey: dedupStr,
                    });
                    
                    rowData.push({
                        dedupStr,
                        row
                    });
                }

                // 1. Bulk insert leads (skipping duplicates)
                await prisma.lead.createMany({
                    data: leadsToCreate,
                    skipDuplicates: true
                });

                // 2. Fetch the Lead IDs we just created/already existed
                const dedupKeys = rowData.map(r => r.dedupStr);
                const existingLeads = await prisma.lead.findMany({
                    where: { dedupKey: { in: dedupKeys } },
                    select: { id: true, dedupKey: true }
                });

                // Map dedupKey to Lead ID
                const leadIdMap = {};
                for (const l of existingLeads) {
                    leadIdMap[l.dedupKey] = l.id;
                }

                const oppsToCreate = [];

                // Prepare Opportunities
                for (const item of rowData) {
                    const leadId = leadIdMap[item.dedupStr];
                    if (!leadId) {
                        errorCount++;
                        continue;
                    }
                    
                    const row = item.row;
                    let enrollmentDate = null;
                    if (row.enrollmentDate) {
                        const parsedDate = new Date(row.enrollmentDate);
                        if (!isNaN(parsedDate)) enrollmentDate = parsedDate;
                    }

                    oppsToCreate.push({
                        leadId: leadId,
                        ownerId: adminUser.id,
                        courseName: row.courseName,
                        enrollmentDate: enrollmentDate,
                        enrollmentCenter: row.enrollmentCenter,
                        gradeAtEnrollment: row.studentGrade,
                        stage: 'New',
                        leadSource: row.leadSource || 'Bulk Upload',
                        opportunityType: 'New',
                        bucket: row.bucket,
                        remarks: row.remarks,
                        courseCategory: row.courseCategory,
                        courseHours: row.courseHours,
                        currentStatus: row.currentStatus,
                        lastCourse: row.lastCourse,
                        mitEnrolled: row.mitEnrolled,
                        niEnrolled: row.niEnrolled,
                        latestRemarkDate: row.latestRemarkDate,
                        mentorName: row.mentorName,
                    });
                }

                // 3. Bulk insert opportunities
                await prisma.opportunity.createMany({
                    data: oppsToCreate,
                    skipDuplicates: true
                });
                
                successCount += oppsToCreate.length;
                console.log(`  ...processed chunk of ${chunk.length} rows`);
            } catch (err) {
                console.error(`Error in chunk:`, err.message);
                errorCount += chunk.length;
            }
        }
        
        console.log(`Completed ${file}: ${successCount} successful, ${errorCount} failed.`);
    }
}

main()
    .catch(e => {
        console.error('Script failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
