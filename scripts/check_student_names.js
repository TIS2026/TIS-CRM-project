const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const oppsCount = await prisma.opportunity.count({
        where: { 
            bucket: 'First NRL then NI(Webinars)',
            lead: {
                OR: [{ studentName: '' }, { studentName: null }]
            }
        }
    });
    console.log(`Leads with empty studentName in NRL bucket: ${oppsCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
