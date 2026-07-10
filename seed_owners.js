const { PrismaClient } = require('@prisma/client');

let dbUrl = "postgresql://postgres.frbehjgnnmodijzdzhrw:Abinash@4522@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function seed() {
  const owners = [
    { name: 'Admin', role: 'System' },
    { name: 'Hamza', role: 'Agent' },
    { name: 'Zaid', role: 'Agent' },
    { name: 'Avinash', role: 'Agent' },
    { name: 'Komal', role: 'Agent' },
    { name: 'Pratusha', role: 'Agent' },
    { name: 'Shadab', role: 'Agent' },
    { name: 'Shweta', role: 'Agent' },
    { name: 'Nisha', role: 'Agent' }
  ];

  console.log("Seeding owners...");
  let adminId = null;

  for (const owner of owners) {
    let user = await prisma.user.findFirst({ where: { name: owner.name } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: owner.name,
          role: owner.role
        }
      });
      console.log(`Created user: ${user.name}`);
    } else {
      console.log(`User already exists: ${user.name}`);
    }

    if (user.name === 'Admin') adminId = user.id;
  }

  if (adminId) {
    console.log(`Updating all opportunities to be owned by Admin (${adminId})...`);
    const result = await prisma.opportunity.updateMany({
      data: {
        ownerId: adminId
      }
    });
    console.log(`Successfully updated ${result.count} opportunities!`);
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect());
