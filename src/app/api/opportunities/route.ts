import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const studentName = searchParams.get('studentName');
  const courseName = searchParams.get('courseName');

  const where: any = {};
  
  if (studentName) {
    where.lead = { studentName: { contains: studentName } };
  }
  if (courseName) {
    where.courseName = { contains: courseName };
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      lead: true,
      owner: true,
    },
    orderBy: { createdDate: 'desc' },
    take: 50,
  });

  return NextResponse.json(opportunities);
}
