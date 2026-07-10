const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const opps = await prisma.opportunity.count();
  console.log('Total Opportunities:', opps);
  
  const buckets = await prisma.opportunity.findMany({
    select: { bucket: true },
    distinct: ['bucket']
  });
  console.log('Buckets in DB:', buckets.map(b => b.bucket));
}

check().then(() => prisma.$disconnect());
