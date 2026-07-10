import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json({ success: false, error: 'opportunityId is required' }, { status: 400 });
    }

    const calls = await prisma.call.findMany({
      where: { opportunityId },
      orderBy: { scheduledDate: 'desc' },
      include: { owner: true }
    });

    return NextResponse.json(calls);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Auto-create a call
    const call = await prisma.call.create({
      data: {
        opportunityId: data.opportunityId,
        callType: data.callType || 'Sales Call',
        status: data.status || 'Scheduled',
        scheduledDate: new Date(data.scheduledDate),
        ownerId: data.ownerId
      }
    });
    return NextResponse.json({ success: true, call });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
