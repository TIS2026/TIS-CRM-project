import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDedupKey, normalizePhoneNumber, normalizeName } from '@/lib/utils';

export async function POST(request: Request) {
  const data = await request.json();
  const { text, mode } = data;
  
  if (!text) return NextResponse.json({ matches: [], orphans: [] });

  const rows = text.split('\n').filter((r: string) => r.trim() !== '');
  const matches = [];
  const orphans = [];

  for (const row of rows) {
    const cols = row.split('\t').map((c: string) => c.trim());
    
    let dbMatch = null;
    
    if (mode === 'Parent Contact Number Only') {
      const contact = normalizePhoneNumber(cols[0]);
      const leads = await prisma.lead.findMany({ 
        where: { parentContactNumber: { contains: contact } }, 
        include: { opportunities: { include: { lead: true, owner: true } } } 
      });
      if (leads.length > 0) dbMatch = leads.flatMap(l => l.opportunities);
    } 
    else if (mode === 'Student Name Only') {
      const name = normalizeName(cols[0]);
      const leads = await prisma.lead.findMany({ include: { opportunities: { include: { lead: true, owner: true } } } });
      const matchedLeads = leads.filter(l => normalizeName(l.studentName) === name);
      if (matchedLeads.length > 0) dbMatch = matchedLeads.flatMap(l => l.opportunities);
    }
    else if (mode === 'Student Name + Parent Contact Number (Two Columns)') {
      const name = cols[0];
      const contact = cols[1];
      const dedupKey = generateDedupKey(contact, name);
      const lead = await prisma.lead.findUnique({ where: { dedupKey }, include: { opportunities: { include: { lead: true, owner: true } } } });
      if (lead) dbMatch = lead.opportunities;
    }

    if (dbMatch && dbMatch.length > 0) {
      matches.push(...dbMatch);
    } else {
      orphans.push(row);
    }
  }

  return NextResponse.json({ matches, orphans });
}
