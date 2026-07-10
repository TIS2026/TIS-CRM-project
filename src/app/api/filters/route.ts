import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buckets = await prisma.opportunity.findMany({
      select: { bucket: true },
      distinct: ['bucket']
    });
    const stages = await prisma.opportunity.findMany({
      select: { stage: true },
      distinct: ['stage']
    });
    const leadSources = await prisma.opportunity.findMany({
      select: { leadSource: true },
      distinct: ['leadSource']
    });

    return NextResponse.json({
      buckets: buckets.map(b => b.bucket).filter(Boolean).sort(),
      stages: stages.map(s => s.stage).filter(Boolean).sort(),
      leadSources: leadSources.map(l => l.leadSource).filter(Boolean).sort()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}
