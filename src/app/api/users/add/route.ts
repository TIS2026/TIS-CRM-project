import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, role } = data;

    if (!name || !role) {
      return NextResponse.json({ success: false, error: 'Name and role are required.' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        role
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
