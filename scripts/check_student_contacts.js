const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const totalLeads = await prisma.lead.count();
    const emptyStudentContacts = await prisma.lead.count({
        where: { OR: [{ studentContactNumber: '' }, { studentContactNumber: null }] }
    });
    
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Leads missing studentContactNumber: ${emptyStudentContacts}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
