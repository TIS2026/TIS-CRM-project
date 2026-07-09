import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDedupKey } from '@/lib/utils';
import { evaluateLeadType, rollupStudentGrade, determineOpportunityType } from '@/services/leadService';
import { createInitialCall } from '@/services/callService';

export async function POST(request: Request) {
  try {
    const data = await request.json(); // Array of raw row objects
    const exceptions: any[] = [];
    const successes: any[] = [];

    let unassignedUser = await prisma.user.findFirst({ where: { role: 'System' } });
    if (!unassignedUser) {
        unassignedUser = await prisma.user.findFirst();
    }

    for (const row of data) {
      let parentContact = row['Parent Contact Number'];
      const studentContact = row['Student Contact Number'];
      const studentName = row['Student Name'];

      // Fallback: If parent contact is empty, use student contact
      if (!parentContact && studentContact) {
        parentContact = studentContact;
      }
      
      if (!parentContact) {
        exceptions.push({ row, reason: 'Parent Contact and Student Contact are both blank' });
        continue;
      }

      const dedupKey = generateDedupKey(parentContact, studentName);
      
      let lead = await prisma.lead.findUnique({ where: { dedupKey } });

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            studentName: studentName || null,
            studentEmail: row['Student Email ID'] || null,
            studentContactNumber: row['Student Contact Number'] || null,
            parentName: row['Parent Name'] || null,
            parentEmail: row['Parent Email ID'] || null,
            parentContactNumber: parentContact,
            school: row['School'] || null,
            leadType: 'New',
            dedupKey: dedupKey,
            createdSource: 'Bulk Upload'
          }
        });
      }

      const courseName = row['Course Name'];
      const enrollmentDateStr = row['Enrollment Date'];
      let enrollmentDate = enrollmentDateStr ? new Date(enrollmentDateStr) : null;
      if (enrollmentDate && isNaN(enrollmentDate.getTime())) enrollmentDate = null;

      const isDataIncomplete = !courseName || !enrollmentDate;

      let inferredStage = 'New';
      if (enrollmentDate) {
        inferredStage = 'Won';
      } else if (row['Stage'] === 'Lost' || (!enrollmentDate && !courseName)) {
        inferredStage = 'Lost';
      }

      const oppType = await determineOpportunityType(lead.id);

      let ownerId = unassignedUser?.id!;
      if (row['Owner']) {
        const user = await prisma.user.findFirst({ where: { name: row['Owner'] } });
        if (user) ownerId = user.id;
      }

      const bucketName = row['Bucket'] || null;

      // Prevent duplicate opportunities by checking courseName and Bucket
      const duplicateWhere = courseName 
        ? { leadId: lead.id, courseName: courseName, bucket: bucketName }
        : enrollmentDate 
          ? { leadId: lead.id, enrollmentDate: enrollmentDate, bucket: bucketName }
          : { leadId: lead.id, courseName: null, enrollmentDate: null, bucket: bucketName };

      const existingOpp = await prisma.opportunity.findFirst({ where: duplicateWhere });
      if (existingOpp) {
        exceptions.push({ row, reason: 'Skipped: Identical opportunity already exists for this lead' });
        continue;
      }

      const opportunity = await prisma.opportunity.create({
        data: {
          leadId: lead.id,
          courseName: courseName || null,
          enrollmentDate: enrollmentDate,
          enrollmentCenter: row['Enrollment Center'] || null,
          gradeAtEnrollment: row['Grade at Enrollment'] || null,
          ownerId: ownerId,
          stage: inferredStage,
          leadSource: 'Unknown - Historical',
          opportunityType: oppType,
          isDataIncomplete: isDataIncomplete || (!courseName),
          lostReason: inferredStage === 'Lost' ? 'Other (Free Text)' : null,
          bucket: bucketName
        }
      });

      await evaluateLeadType(lead.id);
      await rollupStudentGrade(lead.id);
      
      if (inferredStage !== 'Won' && inferredStage !== 'Lost') {
        await createInitialCall(opportunity.id, ownerId);
      }

      successes.push(opportunity.id);
    }

    return NextResponse.json({ success: true, processed: successes.length, exceptions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
