import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    const where: any = {
      status: 'Scheduled'
    };

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const calls = await prisma.call.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        owner: true,
        opportunity: {
          include: {
            lead: true
          }
        }
      },
      take: 20 // show top 20 pending calls
    });

    return NextResponse.json({ calls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
