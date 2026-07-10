const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const buckets = await prisma.opportunity.findMany({
        where: { bucket: { contains: 'Nurture' } },
        select: { bucket: true },
        distinct: ['bucket']
    });

    console.log(buckets);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
