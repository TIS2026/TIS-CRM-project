import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: 'System Admin', role: 'Admin' },
      { name: 'Sales Rep A', role: 'Sales Rep' },
      { name: 'Sales Rep B', role: 'Sales Rep' },
      { name: 'Unassigned/Admin', role: 'System' }
    ]
  });
  console.log('Seed users created.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
