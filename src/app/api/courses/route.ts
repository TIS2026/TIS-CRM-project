import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const courses = await prisma.opportunity.findMany({
      where: {
        courseName: { not: null }
      },
      distinct: ['courseName'],
      select: {
        courseName: true
      },
      orderBy: {
        courseName: 'asc'
      }
    });

    return NextResponse.json(
      courses.map(c => c.courseName).filter(c => c && c.trim() !== "")
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
