import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if the user has any opportunities
    const opportunitiesCount = await prisma.opportunity.count({
      where: { ownerId: id }
    });

    if (opportunitiesCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot remove owner. They have ${opportunitiesCount} opportunity/opportunities assigned to them. Please reassign them first.` },
        { status: 400 }
      );
    }

    // Also check for calls assigned to them
    const callsCount = await prisma.call.count({
      where: { ownerId: id }
    });

    if (callsCount > 0) {
       return NextResponse.json(
        { success: false, error: `Cannot remove owner. They have ${callsCount} calls assigned to them. Please reassign them first.` },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
