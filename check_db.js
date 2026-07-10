const { PrismaClient } = require('@prisma/client');
let dbUrl = "postgresql://postgres.frbehjgnnmodijzdzhrw:Abinash@4522@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function check() {
  const opps = await prisma.opportunity.findMany({ take: 10 });
  console.log(opps.map(o => ({ id: o.id, courseName: o.courseName })));
  
  const withCourse = await prisma.opportunity.count({
      where: { courseName: { not: null } }
  });
  console.log("Total opportunities with course name:", withCourse);
}
check();
