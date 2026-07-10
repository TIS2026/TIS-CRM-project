import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const studentName = searchParams.get('studentName');
  const courseName = searchParams.get('courseName');
  const stage = searchParams.get('stage');
  const ownerId = searchParams.get('ownerId');
  const leadSource = searchParams.get('leadSource');
  const bucket = searchParams.get('bucket');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = {};
  
  if (studentName) {
    where.lead = { studentName: { contains: studentName } };
  }
  if (courseName) {
    where.courseName = { contains: courseName };
  }
  if (stage) where.stage = stage;
  if (ownerId) where.ownerId = ownerId;
  if (leadSource) where.leadSource = leadSource;
  if (bucket) where.bucket = bucket;

  const skip = (page - 1) * limit;

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        lead: true,
        owner: true,
      },
      orderBy: { createdDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.opportunity.count({ where })
  ]);

  return NextResponse.json({ opportunities, total, page, limit });
}
