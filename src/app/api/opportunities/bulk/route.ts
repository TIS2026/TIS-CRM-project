import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { opportunityIds, updates } = data;

    if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No opportunities selected.' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided.' }, { status: 400 });
    }

    // Prepare valid fields for update (prevent injecting bad fields)
    const validUpdates: any = {};
    if (updates.stage !== undefined) validUpdates.stage = updates.stage;
    if (updates.ownerId !== undefined) validUpdates.ownerId = updates.ownerId;
    if (updates.courseName !== undefined) validUpdates.courseName = updates.courseName;
    if (updates.bucket !== undefined) validUpdates.bucket = updates.bucket;
    if (updates.remarks !== undefined) validUpdates.remarks = updates.remarks;
    if (updates.customFields !== undefined) validUpdates.customFields = updates.customFields;

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid update fields provided.' }, { status: 400 });
    }

    const result = await prisma.opportunity.updateMany({
      where: {
        id: { in: opportunityIds }
      },
      data: validUpdates
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
