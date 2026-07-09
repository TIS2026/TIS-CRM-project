import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        studentName: { not: null }
      },
      distinct: ['studentName'],
      select: {
        studentName: true
      },
      orderBy: {
        studentName: 'asc'
      }
    });

    return NextResponse.json(
      leads.map(l => l.studentName).filter(s => s && s.trim() !== "")
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
