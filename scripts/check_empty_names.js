const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emptyNames = await prisma.lead.count({
        where: { OR: [{ studentName: '' }, { studentName: null }] }
    });
    console.log(`Leads with empty studentName: ${emptyNames}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
