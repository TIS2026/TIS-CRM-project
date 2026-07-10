import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { leadIds, opportunityData } = data;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    if (!opportunityData || Object.keys(opportunityData).length === 0) {
      return NextResponse.json({ error: 'opportunityData is required' }, { status: 400 });
    }

    const stage = opportunityData.stage || 'New';
    const leadSource = 'Bulk Upload'; 
    const opportunityType = 'New';
    let ownerId = opportunityData.ownerId; 
    
    if (!ownerId) {
      // If owner is missing for some reason, fallback to a system admin if possible.
      // But let's assume the UI enforces it or there is at least one admin.
      const firstAdmin = await prisma.user.findFirst();
      if (firstAdmin) {
        ownerId = firstAdmin.id;
      } else {
        return NextResponse.json({ error: 'ownerId is required in opportunityData' }, { status: 400 });
      }
    }

    const createdOpportunities = [];

    // Chunk the creations to avoid large transaction blocks if there are hundreds of leads
    const chunkSize = 50;
    for (let i = 0; i < leadIds.length; i += chunkSize) {
      const chunk = leadIds.slice(i, i + chunkSize);
      
      const results = await Promise.all(chunk.map((leadId: string) => 
        prisma.opportunity.create({
          data: {
            leadId,
            stage,
            leadSource,
            opportunityType,
            ownerId,
            courseName: opportunityData.courseName || null,
            bucket: opportunityData.bucket || null,
          }
        })
      ));
      
      createdOpportunities.push(...results);
    }

    return NextResponse.json({ success: true, count: createdOpportunities.length });
  } catch (error) {
    console.error('Error in bulk create:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
