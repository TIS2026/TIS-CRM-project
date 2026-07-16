import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' }
    });
    return NextResponse.json(settings || { adminEmails: '' });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminEmails } = body;

    const settings = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: { adminEmails },
      create: { id: 'default', adminEmails }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
