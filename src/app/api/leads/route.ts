import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDedupKey } from '@/lib/utils';
import { evaluateLeadType, rollupStudentGrade, determineOpportunityType } from '@/services/leadService';
import { createInitialCall } from '@/services/callService';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { studentName, parentContactNumber, studentEmail, parentName, school, courseName, studentGrade, ownerId, leadSource, bucket, remarks, customFields } = data;

    if (!parentContactNumber) {
      return NextResponse.json({ success: false, error: 'Parent Contact Number is mandatory.' }, { status: 400 });
    }

    const dedupKey = generateDedupKey(parentContactNumber, studentName);
    
    let lead = await prisma.lead.findUnique({ where: { dedupKey } });
    let isNewLead = false;

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          studentName: studentName || null,
          studentEmail: studentEmail || null,
          parentName: parentName || null,
          parentContactNumber,
          school: school || null,
          leadType: 'New',
          dedupKey: dedupKey,
          createdSource: 'Manual Entry'
        }
      });
      isNewLead = true;
    }

    const oppType = await determineOpportunityType(lead.id);

    // Assign to a system/unassigned user by default, or whoever is creating it
    let unassignedUser = await prisma.user.findFirst({ where: { role: 'System' } });
    if (!unassignedUser) {
        unassignedUser = await prisma.user.findFirst();
    }

    const finalOwnerId = ownerId || unassignedUser?.id!;

    const opportunity = await prisma.opportunity.create({
      data: {
        leadId: lead.id,
        courseName: courseName || null,
        ownerId: finalOwnerId,
        stage: 'New',
        leadSource: leadSource || 'Manual',
        opportunityType: oppType,
        gradeAtEnrollment: studentGrade || null,
        isDataIncomplete: !courseName,
        bucket: bucket || null,
        remarks: remarks || null,
        customFields: customFields || {}
      }
    });

    await evaluateLeadType(lead.id);
    await rollupStudentGrade(lead.id);
    await createInitialCall(opportunity.id, finalOwnerId);

    return NextResponse.json({ success: true, leadId: lead.id, opportunityId: opportunity.id, isNewLead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const studentName = searchParams.get('studentName');
  const courseName = searchParams.get('courseName');
  const stage = searchParams.get('stage');
  const ownerId = searchParams.get('ownerId');
  const leadSource = searchParams.get('leadSource');
  const bucket = searchParams.get('bucket');
  const sort = searchParams.get('sort'); // 'az' or 'newest'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = {};
  
  if (studentName) {
    where.studentName = { contains: studentName, mode: 'insensitive' };
  }

  if (courseName || stage || ownerId || leadSource || bucket) {
    where.opportunities = { some: {} };
    if (courseName) where.opportunities.some.courseName = { contains: courseName, mode: 'insensitive' };
    if (stage) where.opportunities.some.stage = stage;
    if (ownerId) where.opportunities.some.ownerId = ownerId;
    if (leadSource) where.opportunities.some.leadSource = leadSource;
    if (bucket) where.opportunities.some.bucket = bucket;
  }

  let orderBy: any = { createdDate: 'desc' };
  if (sort === 'az') {
    orderBy = { studentName: 'asc' };
  }

  const skip = (page - 1) * limit;

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          _count: {
            select: { opportunities: true }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.lead.count({ where })
    ]);

    return NextResponse.json({ leads, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
