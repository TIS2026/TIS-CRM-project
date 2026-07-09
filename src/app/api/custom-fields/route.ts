import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const fields = await prisma.customFieldDefinition.findMany({
      orderBy: { createdDate: 'asc' }
    });
    return NextResponse.json(fields);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, type } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const newField = await prisma.customFieldDefinition.create({
      data: { name, type: type || 'text' }
    });
    return NextResponse.json({ success: true, field: newField });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Field name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
