import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dummyNames = ['Hamza', 'Zaid', 'Avinash', 'Komal', 'Pratusha', 'Shadab', 'Shweta', 'Nisha'];
  
  // Reassign any remaining opportunities to Admin just in case
  const admin = await prisma.user.findFirst({ where: { name: 'Admin' } });
  if (!admin) {
    console.log('Admin not found!');
    return;
  }

  const dummyUsers = await prisma.user.findMany({
    where: { name: { in: dummyNames } }
  });

  const dummyIds = dummyUsers.map(u => u.id);

  if (dummyIds.length > 0) {
    const updateResult = await prisma.opportunity.updateMany({
      where: { ownerId: { in: dummyIds } },
      data: { ownerId: admin.id }
    });
    console.log(`Reassigned ${updateResult.count} opportunities to Admin.`);

    const deleteResult = await prisma.user.deleteMany({
      where: { id: { in: dummyIds } }
    });
    console.log(`Deleted ${deleteResult.count} dummy users.`);
  } else {
    console.log('No dummy users found to delete.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
