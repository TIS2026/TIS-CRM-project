import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawCalls = await prisma.call.findMany({
      include: {
        opportunity: {
          include: {
            lead: true
          }
        },
        owner: true
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    });

    const csvDataCalls = rawCalls.map(call => ({
      'Call ID': call.id,
      'Opportunity ID': call.opportunityId,
      'Call Type': call.callType,
      'Status': call.status,
      'Scheduled Date': new Date(call.scheduledDate).toLocaleDateString(),
      'Completed Date': call.completedDate ? new Date(call.completedDate).toLocaleDateString() : '',
      'Call Outcome': call.callOutcome || '',
      'Disposition': call.disposition || '',
      'Owner': call.owner.name,
      'Student Name': call.opportunity.lead.studentName || '',
      'Parent Contact': call.opportunity.lead.parentContactNumber,
      'Course': call.opportunity.courseName || '',
      'Stage': call.opportunity.stage
    }));

    const csvStringCalls = Papa.unparse(csvDataCalls);

    return new NextResponse(csvStringCalls, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="crm_calls_export_${new Date().toISOString().split('T')[0]}.csv"`,
      }
    });
  } catch (error: any) {
    console.error('Error generating calls CSV:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
