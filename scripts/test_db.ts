import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const fields = await prisma.customFieldDefinition.findMany();
    console.log(fields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
