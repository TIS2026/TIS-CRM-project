import { NextResponse } from 'next/server';
import { processCallOutcome } from '@/services/callService';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    await processCallOutcome(id, {
      outcome: body.callOutcome,
      disposition: body.disposition,
      scheduledDate: body.nextScheduledDate ? new Date(body.nextScheduledDate) : undefined,
      lostReason: body.lostReason,
      enrollmentDate: body.enrollmentDate ? new Date(body.enrollmentDate) : undefined
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
