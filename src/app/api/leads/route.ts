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
