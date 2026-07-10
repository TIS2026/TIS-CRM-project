const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const papaparse = require('papaparse');

const prisma = new PrismaClient();
const uploadDir = path.join(__dirname, '..', 'Data Uploads');

async function main() {
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));
    let updatedCount = 0;
    
    // We will build a map of parentContactNumber -> studentContactNumber from all original CSVs
    const contactToStudentContact = new Map();
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(uploadDir, file), 'utf8');
        const parsed = papaparse.parse(content, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data) {
            let parentContact = '';
            let studentContact = '';
            
            // Look for any header that represents parent contact
            for (const [key, val] of Object.entries(row)) {
                const lowerKey = key.trim().toLowerCase();
                if ((lowerKey === 'parent number' || lowerKey === 'parent_contact_number' || lowerKey === 'contact no.') && val) {
                    parentContact = val.replace(/\D/g, '').slice(-10);
                }
                if ((lowerKey === 'student number' || lowerKey === 'student_contact_number') && val) {
                    studentContact = val.replace(/\D/g, '').slice(-10);
                }
            }
            
            if (parentContact && studentContact && parentContact !== '0000000000' && studentContact !== '0000000000') {
                if (!contactToStudentContact.has(parentContact)) {
                    contactToStudentContact.set(parentContact, studentContact);
                }
            }
        }
    }
    
    console.log(`Found ${contactToStudentContact.size} unique parent contacts with student contacts in CSVs.`);
    
    // Now get all leads that have an empty/null studentContactNumber
    const leadsToFix = await prisma.lead.findMany({
        where: {
            OR: [
                { studentContactNumber: '' },
                { studentContactNumber: null }
            ]
        }
    });
    
    console.log(`Found ${leadsToFix.length} leads in DB needing a student contact.`);
    
    const batchSize = 100;
    for (let i = 0; i < leadsToFix.length; i += batchSize) {
        const batch = leadsToFix.slice(i, i + batchSize);
        await Promise.all(batch.map(async (lead) => {
            if (!lead.parentContactNumber) return;
            
            const correctStudentContact = contactToStudentContact.get(lead.parentContactNumber);
            if (correctStudentContact) {
                try {
                    await prisma.lead.update({
                        where: { id: lead.id },
                        data: {
                            studentContactNumber: correctStudentContact
                        }
                    });
                    updatedCount++;
                } catch (e) {
                    console.error('Error on lead', lead.id, e.message);
                }
            }
        }));
        console.log(`Processed ${i + batch.length}/${leadsToFix.length}... updated: ${updatedCount}`);
    }
    
    console.log(`Successfully updated ${updatedCount} leads with student contact numbers!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
