import { prisma } from '@/lib/db';

export async function processCallOutcome(
  callId: string,
  data: { outcome: string; disposition?: string; scheduledDate?: Date; lostReason?: string; enrollmentDate?: Date }
) {
  const call = await prisma.call.findUnique({ where: { id: callId }, include: { opportunity: true } });
  if (!call) throw new Error('Call not found');

  if (['No Answer', 'Busy'].includes(data.outcome)) {
    if (!data.scheduledDate) throw new Error('Must schedule a follow-up for non-connected calls');

    await prisma.call.update({
      where: { id: callId },
      data: { status: 'Completed', completedDate: new Date(), callOutcome: data.outcome },
    });

    await prisma.call.create({
      data: {
        opportunityId: call.opportunityId,
        callType: call.callType,
        status: 'Scheduled',
        scheduledDate: data.scheduledDate,
        ownerId: call.ownerId,
      },
    });
    return;
  }

  if (data.outcome === 'Invalid Number') {
    await prisma.call.update({
      where: { id: callId },
      data: { status: 'Completed', completedDate: new Date(), callOutcome: data.outcome },
    });

    await prisma.opportunity.update({
      where: { id: call.opportunityId },
      data: { stage: 'Invalid', lostReason: 'Invalid Number', lostAtStage: call.callType },
    });
    return;
  }

  if (data.outcome === 'Connected') {
    if (!data.disposition) throw new Error('Disposition required for connected calls');

    await prisma.call.update({
      where: { id: callId },
      data: { status: 'Completed', completedDate: new Date(), callOutcome: data.outcome, disposition: data.disposition },
    });

    if (data.disposition === 'Close - Onboarded') {
      if (!data.enrollmentDate) throw new Error('Enrollment Date is required when Onboarded');
      await prisma.opportunity.update({
        where: { id: call.opportunityId },
        data: { stage: 'Won', enrollmentDate: data.enrollmentDate },
      });
      return;
    }

    if (data.disposition === 'Close - Not Interested') {
      if (!data.lostReason) throw new Error('Lost Reason is required when Not Interested');
      await prisma.opportunity.update({
        where: { id: call.opportunityId },
        data: { stage: 'Lost', lostReason: data.lostReason, lostAtStage: call.callType },
      });
      return;
    }

    if (!data.scheduledDate) throw new Error('Scheduled date required for follow-up dispositions');

    let nextCallType = '';
    if (data.disposition === 'Schedule Sales Follow-up') nextCallType = 'Sales Follow-up Call';
    if (data.disposition === 'Schedule Assessment Call') nextCallType = 'Assessment Call';
    if (data.disposition === 'Schedule Assessment Follow-up') nextCallType = 'Assessment Follow-up Call';
    if (data.disposition === 'Schedule Payment Confirmation Call') nextCallType = 'Payment Confirmation Call';
    if (data.disposition === 'Schedule Payment Confirmation Follow-up') nextCallType = 'Payment Confirmation Follow-up Call';

    if (nextCallType) {
      await prisma.call.create({
        data: {
          opportunityId: call.opportunityId,
          callType: nextCallType,
          status: 'Scheduled',
          scheduledDate: data.scheduledDate,
          ownerId: call.ownerId,
        },
      });
    }
  }
}

export async function createInitialCall(opportunityId: string, ownerId: string) {
  await prisma.call.create({
    data: {
      opportunityId,
      callType: 'Sales Call',
      status: 'Scheduled',
      scheduledDate: new Date(),
      ownerId,
    },
  });
}
