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

  const chunkSize = 10;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    
    const results = await Promise.all(chunk.map(async (row: string) => {
      let cols = row.split('\t').map((c: string) => c.trim());
      
      // Fallback: If user pasted space-separated data instead of tabs for Two Columns mode
      if (cols.length === 1 && mode === 'Student Name + Parent Contact Number (Two Columns)') {
        const match = row.match(/(.*?)\s+(\d{8,15})$/);
        if (match) {
          cols = [match[1].trim(), match[2].trim()];
        }
      }
      
      let dbMatch = null;
      
      if (mode === 'Parent Contact Number Only') {
        const contact = normalizePhoneNumber(cols[0]);
        if (contact) {
          const leads = await prisma.lead.findMany({ 
            where: { parentContactNumber: { contains: contact } }, 
          });
          if (leads.length > 0) dbMatch = leads;
        }
      } 
      else if (mode === 'Student Name Only') {
        const name = cols[0].trim();
        if (name) {
          const leads = await prisma.lead.findMany({ 
            where: { studentName: { contains: name, mode: 'insensitive' } },
          });
          if (leads.length > 0) dbMatch = leads;
        }
      }
      else if (mode === 'Student Name + Parent Contact Number (Two Columns)') {
        const name = cols[0] ? cols[0].trim() : '';
        const contact = cols[1] ? normalizePhoneNumber(cols[1]) : '';
        
        const whereClause: any = {};
        if (contact) whereClause.parentContactNumber = { contains: contact };
        if (name) whereClause.studentName = { contains: name, mode: 'insensitive' };
        
        if (Object.keys(whereClause).length > 0) {
          const leads = await prisma.lead.findMany({ 
            where: whereClause, 
          });
          if (leads.length > 0) dbMatch = leads;
        }
      }
      return { row, dbMatch };
    }));

    for (const res of results) {
      if (res.dbMatch && res.dbMatch.length > 0) {
        matches.push(...res.dbMatch);
      } else {
        orphans.push(res.row);
      }
    }
  }

  // Deduplicate matches to prevent the same lead from showing multiple times
  // We deduplicate by both lead ID and a normalized dedupKey to handle cases 
  // where the database might have slight variations of the same lead.
  const uniqueMatches = [];
  const seenIds = new Set();
  const seenDedup = new Set();
  for (const m of matches) {
    const dedup = m.dedupKey || generateDedupKey(m.parentContactNumber || '', m.studentName || '');
    if (!seenIds.has(m.id) && !seenDedup.has(dedup)) {
      seenIds.add(m.id);
      seenDedup.add(dedup);
      uniqueMatches.push(m);
    }
  }

  return NextResponse.json({ matches: uniqueMatches, orphans });
}
