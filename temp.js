const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sources = await prisma.opportunity.groupBy({
    by: ['leadSource'],
    _count: {id: true}
  });
  console.log(sources.sort((a,b) => b._count.id - a._count.id));
}
main().finally(() => prisma.$disconnect());
