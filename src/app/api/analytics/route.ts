import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  let oppWhereClause: any = {};
  let callWhereClause: any = {};

  if (startDateStr && endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    // Include the entire end date by setting time to 23:59:59
    endDate.setHours(23, 59, 59, 999);

    oppWhereClause.createdDate = {
      gte: startDate,
      lte: endDate
    };

    callWhereClause.scheduledDate = {
      gte: startDate,
      lte: endDate
    };
  }

  try {
    // 1. Pipeline Breakdown (Opportunities by Stage)
    const pipelineData = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: oppWhereClause,
      _count: { id: true }
    });

    // 2. Call Outcomes
    const callData = await prisma.call.groupBy({
      by: ['callOutcome'],
      where: { ...callWhereClause, status: 'Completed', callOutcome: { not: null } },
      _count: { id: true }
    });

    // 3. Team Performance
    const owners = await prisma.user.findMany({ select: { id: true, name: true } });
    
    const oppsByOwner = await prisma.opportunity.groupBy({
      by: ['ownerId', 'stage'],
      where: oppWhereClause,
      _count: { id: true }
    });

    const callsByOwner = await prisma.call.groupBy({
      by: ['ownerId'],
      where: { ...callWhereClause, status: 'Completed' },
      _count: { id: true }
    });

    // Process team performance into a flat array
    const teamPerformance = owners.map(owner => {
      const ownerOpps = oppsByOwner.filter(o => o.ownerId === owner.id);
      const totalOpps = ownerOpps.reduce((sum, curr) => sum + curr._count.id, 0);
      const wonOpps = ownerOpps.find(o => o.stage === 'Won')?._count.id || 0;
      const totalCalls = callsByOwner.find(c => c.ownerId === owner.id)?._count.id || 0;
      return {
        name: owner.name,
        totalOpps,
        wonOpps,
        winRate: totalOpps > 0 ? ((wonOpps / totalOpps) * 100).toFixed(1) : 0,
        totalCalls
      };
    }).sort((a, b) => b.wonOpps - a.wonOpps);

    // 4. Source & Bucket Effectiveness
    const sourceData = await prisma.opportunity.groupBy({
      by: ['leadSource', 'stage'],
      where: oppWhereClause,
      _count: { id: true }
    });

    const bucketData = await prisma.opportunity.groupBy({
      by: ['bucket', 'stage'],
      where: oppWhereClause,
      _count: { id: true }
    });

    // Helper to process source/bucket into clean arrays
    const processGroupedData = (data: any[], keyName: string) => {
      const uniqueKeys = Array.from(new Set(data.map(d => d[keyName]).filter(Boolean)));
      return uniqueKeys.map(key => {
        const items = data.filter(d => d[keyName] === key);
        const total = items.reduce((sum, curr) => sum + curr._count.id, 0);
        const won = items.find(d => d.stage === 'Won')?._count.id || 0;
        return {
          name: key,
          total,
          won,
          winRate: total > 0 ? ((won / total) * 100).toFixed(1) : 0
        };
      }).sort((a, b) => b.won - a.won);
    };

    return NextResponse.json({
      pipeline: pipelineData.map(p => ({ name: p.stage, value: p._count.id })),
      callOutcomes: callData.map(c => ({ name: c.callOutcome, value: c._count.id })),
      teamPerformance,
      sources: processGroupedData(sourceData, 'leadSource'),
      buckets: processGroupedData(bucketData, 'bucket')
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
