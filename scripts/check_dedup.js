const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const leads = await prisma.lead.findMany({ take: 5 });
    console.log(leads.map(l => l.dedupKey));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
