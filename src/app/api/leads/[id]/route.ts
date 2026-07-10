import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        opportunities: {
          orderBy: { createdDate: 'desc' },
          include: { 
            owner: true,
            calls: { orderBy: { scheduledDate: 'desc' }, include: { owner: true } }
          }
        }
      }
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { leadData, opportunitiesData } = await request.json();
    
    // Update lead core data
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        studentName: leadData.studentName,
        studentEmail: leadData.studentEmail,
        studentContactNumber: leadData.studentContactNumber,
        parentName: leadData.parentName,
        parentEmail: leadData.parentEmail,
        parentContactNumber: leadData.parentContactNumber,
        parent2Name: leadData.parent2Name,
        parent2Email: leadData.parent2Email,
        parent2ContactNumber: leadData.parent2ContactNumber,
        school: leadData.school
      }
    });

    // Update opportunities
    if (opportunitiesData && Array.isArray(opportunitiesData)) {
      for (const opp of opportunitiesData) {
        await prisma.opportunity.update({
          where: { id: opp.id },
          data: {
            courseName: opp.courseName,
            stage: opp.stage,
            bucket: opp.bucket,
            remarks: opp.remarks,
            ownerId: opp.ownerId,
            leadSource: opp.leadSource,
            enrollmentDate: opp.enrollmentDate ? new Date(opp.enrollmentDate) : null,
            enrollmentCenter: opp.enrollmentCenter,
            gradeAtEnrollment: opp.gradeAtEnrollment,
            lostReason: opp.lostReason,
            customFields: opp.customFields || {}
          }
        });
      }
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
