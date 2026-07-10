import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const SYSTEM_ADMIN_ID = 'fb4d6bee-5a63-48e7-a4a0-fba67f9941ed';
  const UNASSIGNED_ADMIN_ID = 'f721c7d3-9753-434c-a148-bf3ac229cefb';
  const ADMIN_ID = 'a4971fae-d2d4-4e32-98f8-21de8d3538c3';

  console.log(`Reassigning opportunities from System Admin and Unassigned/Admin to Admin...`);

  const result = await prisma.opportunity.updateMany({
    where: {
      ownerId: {
        in: [SYSTEM_ADMIN_ID, UNASSIGNED_ADMIN_ID]
      }
    },
    data: {
      ownerId: ADMIN_ID,
    },
  });

  console.log(`Update complete! Modified ${result.count} opportunities.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
