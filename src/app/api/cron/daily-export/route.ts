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

    // 3. Flatten the data for CSV
    const csvData = rawOpps.map(opp => ({
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

    // 4. Convert to CSV string
    const csvString = Papa.unparse(csvData);
    const base64Csv = Buffer.from(csvString).toString('base64');

    // 5. Send Email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'CRM Automated Backup <onboarding@resend.dev>',
      to: emailList,
      subject: `Daily CRM Backup - ${new Date().toLocaleDateString()}`,
      text: `Hello,\n\nPlease find attached the daily automated backup of your CRM Database as of ${new Date().toLocaleString()}.\n\nTotal Opportunities Exported: ${csvData.length}\n\nRegards,\nYour CRM System`,
      attachments: [
        {
          filename: `crm_backup_${new Date().toISOString().split('T')[0]}.csv`,
          content: base64Csv
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
