const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, '..', 'Data Uploads', 'Standardized');

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
        console.log('Created System Admin user:', adminUser.id);
    } else {
        console.log('Found Admin user:', adminUser.id);
    }

    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));

    for (const file of files) {
        console.log(`\nImporting ${file}...`);
        const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
        const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            try {
                // LOGIC: Use student contact where parent contact is empty
                let parentContactNumber = row.parentContactNumber;
                if (!parentContactNumber || parentContactNumber.trim() === '') {
                    parentContactNumber = row.studentContactNumber;
                }
                if (!parentContactNumber || parentContactNumber.trim() === '') {
                    parentContactNumber = '0000000000';
                }
                
                // Create a unique deterministic dedup key based on parent contact and student name
                const dedupStr = `${parentContactNumber}_${row.studentName || ''}`.trim();
                
                let leadType = 'New';
                if (row.leadType && row.leadType.toLowerCase() === 'repeat') leadType = 'Repeat';

                // UPSERT Lead so we don't crash on duplicates
                const lead = await prisma.lead.upsert({
                    where: { dedupKey: dedupStr },
                    update: {}, // Don't override existing lead data
                    create: {
                        studentName: row.studentName,
                        studentEmail: row.studentEmail,
                        studentContactNumber: row.studentContactNumber,
                        parentName: row.parentName,
                        parentEmail: row.parentEmail,
                        parentContactNumber: parentContactNumber,
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
                    }
                });

                let enrollmentDate = null;
                if (row.enrollmentDate) {
                    const parsedDate = new Date(row.enrollmentDate);
                    if (!isNaN(parsedDate)) enrollmentDate = parsedDate;
                }

                // Create Opportunity
                await prisma.opportunity.create({
                    data: {
                        leadId: lead.id,
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
                    }
                });

                successCount++;
                if (successCount % 100 === 0) {
                    console.log(`  ...processed ${successCount} rows in ${file}`);
                }
            } catch (err) {
                console.error(`Error importing row ${i} in ${file}:`, err.message);
                errorCount++;
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
