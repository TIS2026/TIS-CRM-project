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
    let adminUser = await prisma.user.findFirst({
        where: { name: 'Admin' }
    });
    if (!adminUser) {
        adminUser = await prisma.user.findFirst();
    }

    const file = 'First Compete then NI (Nurture .csv';
    console.log(`\nImporting ${file}...`);
    const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
    const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
    
    let successCount = 0;
    let errorCount = 0;
    const bucketName = file.replace('.csv', '').trim(); // FIXED: added .trim() to bucket name
    
    // We will do a full sweep and upsert everything in this file, or at least see what's missing.
    // Instead of doing actual upserts blindly, let's just do it with logging.

    const opportunities = parsed.data.map(row => ({
        studentName: row['studentName'] || '',
        parentContact: row['parentContactNumber']?.replace(/\D/g, '').slice(-10) || '0000000000',
        courseName: row['courseName'] || '',
        stage: row['stage'] || 'New',
        leadSource: row['leadSource'] || 'Bulk Upload',
        ownerEmail: row['ownerEmail']
    }));

    console.log(`Parsed ${opportunities.length} rows.`);

    let processed = 0;
    const batchSize = 50;
    
    for (let i = 0; i < opportunities.length; i += batchSize) {
        const batch = opportunities.slice(i, i + batchSize);
        await Promise.all(batch.map(async (opp) => {
            if (!opp.parentContact) {
                errorCount++;
                return;
            }

            const dedupKey = `${opp.parentContact}_${opp.studentName}`;
            
            try {
                let lead = await prisma.lead.findUnique({ where: { dedupKey } });
                if (!lead) {
                    lead = await prisma.lead.create({
                        data: {
                            studentName: opp.studentName,
                            parentContactNumber: opp.parentContact,
                            dedupKey: dedupKey,
                            leadType: 'student',
                            createdSource: 'Bulk Upload'
                        }
                    });
                }

                const existingOpp = await prisma.opportunity.findFirst({
                    where: {
                        leadId: lead.id,
                        courseName: opp.courseName,
                        bucket: bucketName
                    }
                });

                if (!existingOpp) {
                    await prisma.opportunity.create({
                        data: {
                            leadId: lead.id,
                            courseName: opp.courseName,
                            stage: opp.stage,
                            leadSource: opp.leadSource,
                            bucket: bucketName,
                            ownerId: adminUser.id,
                            opportunityType: 'New',
                            isDataIncomplete: !opp.courseName,
                        }
                    });
                    successCount++;
                }
            } catch (e) {
                console.error(`Error on dedupKey ${dedupKey}:`, e.message);
                errorCount++;
            }
        }));
        processed += batch.length;
        console.log(`Processed ${processed}/${opportunities.length}...`);
    }

    console.log(`Successfully added/verified ${successCount} NEW opportunities.`);
    console.log(`Errors/Skipped: ${errorCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
