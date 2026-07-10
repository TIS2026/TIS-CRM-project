const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const oppsCount = await prisma.opportunity.count({
        where: { bucket: 'First NRL then NI(Webinars)' }
    });
    console.log(`Opportunities with bucket First NRL then NI(Webinars): ${oppsCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
