import { prisma } from '@/lib/db';

export async function rollupStudentGrade(leadId: string): Promise<void> {
  const opportunities = await prisma.opportunity.findMany({
    where: { leadId },
  });

  if (opportunities.length === 0) return;

  let gradeToAssign: string | null = null;

  // 1. Find earliest valid Enrollment Date
  const withEnrollment = opportunities.filter((o) => o.enrollmentDate != null);
  if (withEnrollment.length > 0) {
    withEnrollment.sort((a, b) => a.enrollmentDate!.getTime() - b.enrollmentDate!.getTime());
    gradeToAssign = withEnrollment[0].gradeAtEnrollment;
  } else {
    // 2. Oldest Opportunity by createdDate
    opportunities.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
    gradeToAssign = opportunities[0].gradeAtEnrollment;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { studentGrade: gradeToAssign },
  });
}

export async function evaluateLeadType(leadId: string): Promise<void> {
  const count = await prisma.opportunity.count({ where: { leadId } });
  if (count > 1) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { leadType: 'Repeat' },
    });
  }
}

export async function determineOpportunityType(leadId: string): Promise<string> {
  const count = await prisma.opportunity.count({ where: { leadId } });
  if (count === 0) return 'New';

  const previousOpp = await prisma.opportunity.findFirst({
    where: { leadId },
    orderBy: { createdDate: 'desc' },
  });

  if (!previousOpp) return 'New';

  if (previousOpp.stage === 'Lost') {
    return 'Reactivated-Lost';
  } else {
    return 'Repeat';
  }
}
