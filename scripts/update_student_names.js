const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, '..', 'Data Uploads');

async function main() {
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));
    let updatedCount = 0;
    
    // We will build a map of parentContactNumber -> studentName from all CSVs
    const contactToStudent = new Map();
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
        const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data) {
            let parentContact = '';
            let studentContact = '';
            const studentName = row['Student '] || row['Student Name'] || row['studentName'];
            
            for (const [key, val] of Object.entries(row)) {
                const lowerKey = key.trim().toLowerCase();
                if ((lowerKey === 'parent number' || lowerKey === 'parent_contact_number' || lowerKey === 'contact no.') && val) {
                    parentContact = val.replace(/\D/g, '').slice(-10);
                }
                if ((lowerKey === 'student number' || lowerKey === 'student_contact_number') && val) {
                    studentContact = val.replace(/\D/g, '').slice(-10);
                }
            }
            
            if (studentName) {
                const sName = studentName.trim();
                if (parentContact && parentContact !== '0000000000') {
                    contactToStudent.set(parentContact, sName);
                }
                if (studentContact && studentContact !== '0000000000') {
                    contactToStudent.set(studentContact, sName);
                }
            }
        }
    }
    
    console.log(`Found ${contactToStudent.size} unique parent contacts with student names in CSVs.`);
    
    // Now get all leads that have an empty/null studentName OR dedupKey ending in '_' (which means empty student name)
    const leadsToFix = await prisma.lead.findMany({
        where: {
            OR: [
                { studentName: '' },
                { studentName: null }
            ]
        }
    });
    
    console.log(`Found ${leadsToFix.length} leads in DB needing a student name.`);
    
    const batchSize = 100;
    for (let i = 0; i < leadsToFix.length; i += batchSize) {
        const batch = leadsToFix.slice(i, i + batchSize);
        await Promise.all(batch.map(async (lead) => {
            if (!lead.parentContactNumber) return;
            
            const correctStudentName = contactToStudent.get(lead.parentContactNumber);
            if (correctStudentName) {
                const newDedupKey = `${lead.parentContactNumber}_${correctStudentName}`;
                
                try {
                    const existing = await prisma.lead.findUnique({ where: { dedupKey: newDedupKey } });
                    
                    if (!existing) {
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                studentName: correctStudentName,
                                dedupKey: newDedupKey
                            }
                        });
                        updatedCount++;
                    } else {
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                studentName: correctStudentName
                            }
                        });
                        updatedCount++;
                    }
                } catch (e) {
                    console.error('Error on lead', lead.id, e.message);
                }
            }
        }));
        console.log(`Processed ${i + batch.length}/${leadsToFix.length}... updated: ${updatedCount}`);
    }
    
    console.log(`Successfully updated ${updatedCount} leads with student names!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
