import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Resend } from 'resend';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow 5 minutes for large DB queries

export async function GET(request: Request) {
  try {
    // Vercel Cron sends a secret header to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Admin Emails
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default' }
    });

    if (!settings || !settings.adminEmails || settings.adminEmails.trim() === '') {
      console.log('Cron skipped: No admin emails configured.');
      return NextResponse.json({ message: 'Skipped - no emails configured' });
    }

    const emailList = settings.adminEmails.split(',').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) {
      return NextResponse.json({ message: 'Skipped - no valid emails configured' });
    }

    // 2. Fetch all CRM Data
    const rawOpps = await prisma.opportunity.findMany({
      include: {
        lead: true,
        owner: true
      }
    });

    const rawCalls = await prisma.call.findMany({
      include: {
        opportunity: {
          include: {
            lead: true
          }
        },
        owner: true
      }
    });

    // 3. Flatten the data for CSV
    const csvDataOpps = rawOpps.map(opp => ({
      'Opportunity ID': opp.id,
      'Created Date': new Date(opp.createdDate).toLocaleDateString(),
      'Stage': opp.stage,
      'Course': opp.courseName || '',
      'Bucket': opp.bucket || '',
      'Lead Source': opp.leadSource,
      'Owner': opp.owner.name,
      'Student Name': opp.lead.studentName || '',
      'Parent Contact': opp.lead.parentContactNumber,
      'Parent Name': opp.lead.parentName || '',
      'Parent Email': opp.lead.parentEmail || '',
      'School': opp.lead.school || '',
      'Grade': opp.lead.studentGrade || '',
      'Remarks': opp.remarks || ''
    }));

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

    // 4. Convert to CSV string
    const csvStringOpps = Papa.unparse(csvDataOpps);
    const base64CsvOpps = Buffer.from(csvStringOpps).toString('base64');

    const csvStringCalls = Papa.unparse(csvDataCalls);
    const base64CsvCalls = Buffer.from(csvStringCalls).toString('base64');

    // 5. Send Email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'CRM Automated Backup <onboarding@resend.dev>',
      to: emailList,
      subject: `Daily CRM Backup - ${new Date().toLocaleDateString()}`,
      text: `Hello,\n\nPlease find attached the daily automated backup of your CRM Database as of ${new Date().toLocaleString()}.\n\nTotal Opportunities Exported: ${csvDataOpps.length}\nTotal Calls Exported: ${csvDataCalls.length}\n\nRegards,\nYour CRM System`,
      attachments: [
        {
          filename: `crm_opportunities_backup_${new Date().toISOString().split('T')[0]}.csv`,
          content: base64CsvOpps
        },
        {
          filename: `crm_calls_backup_${new Date().toISOString().split('T')[0]}.csv`,
          content: base64CsvCalls
        }
      ]
    });

    if (error) {
      throw new Error(`Resend Error: ${error.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup generated and emailed successfully via Resend.',
      records: csvData.length,
      resendId: data?.id
    });

  } catch (error: any) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
