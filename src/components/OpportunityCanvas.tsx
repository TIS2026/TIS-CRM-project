'use client';
import { useState } from 'react';

export default function OpportunityCanvas({ leadId, currentUserId }: { leadId: string, currentUserId: string }) {
  const [courseName, setCourseName] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [error, setError] = useState('');

  const leadSources = [
    'Referral', 'Walk-in', 'Website Inquiry', 'Ad Campaign', 
    'Repeat - Inbound', 'Agent Outreach', 'Event/Workshop', 'Other'
  ];

  const handleSave = async () => {
    if (!leadSource) {
      setError('Lead Source is strictly mandatory.');
      return;
    }
    // Perform save logic here, isolated from sibling opportunities
    // This would call a backend endpoint that locks Opp Type and sets Owner
    console.log('Saving Opportunity:', { leadId, currentUserId, courseName, leadSource });
    alert('Opportunity created successfully (mock)');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Create New Opportunity</h3>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Course Name</label>
          <input value={courseName} onChange={e => setCourseName(e.target.value)} />
        </div>
        
        <div>
          <label>Lead Source *</label>
          <select value={leadSource} onChange={e => { setLeadSource(e.target.value); setError(''); }}>
            <option value="">Select a Source...</option>
            {leadSources.map(src => <option key={src} value={src}>{src}</option>)}
          </select>
        </div>

        <button className="btn" onClick={handleSave}>Save Opportunity</button>
      </div>
    </div>
  );
}
