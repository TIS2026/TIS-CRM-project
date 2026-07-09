'use client';
import { useState } from 'react';

export default function CallLogger({ callId, callType }: { callId: string, callType: string }) {
  const [outcome, setOutcome] = useState('');
  const [disposition, setDisposition] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [lostReason, setLostReason] = useState('');

  const handleSave = async () => {
    // API call to /api/calls/outcome
    console.log({ callId, outcome, disposition, scheduledDate, lostReason });
    alert('Call logged successfully (mock)');
  };

  const isConnected = outcome === 'Connected';
  const requiresFollowUp = !isConnected || disposition.includes('Schedule');

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Log Call ({callType})</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Outcome</label>
          <select value={outcome} onChange={e => { setOutcome(e.target.value); setDisposition(''); }}>
            <option value="">Select Outcome...</option>
            <option value="Connected">Connected</option>
            <option value="No Answer">No Answer</option>
            <option value="Busy">Busy</option>
            <option value="Invalid Number">Invalid Number</option>
          </select>
        </div>

        {isConnected && (
          <div>
            <label>Disposition</label>
            <select value={disposition} onChange={e => setDisposition(e.target.value)}>
              <option value="">Select Disposition...</option>
              <option value="Schedule Sales Follow-up">Schedule Sales Follow-up</option>
              <option value="Schedule Assessment Call">Schedule Assessment Call</option>
              <option value="Schedule Payment Confirmation Call">Schedule Payment Confirmation Call</option>
              <option value="Close - Onboarded">Close - Onboarded</option>
              <option value="Close - Not Interested">Close - Not Interested</option>
            </select>
          </div>
        )}

        {disposition === 'Close - Not Interested' && (
          <div>
            <label>Lost Reason *</label>
            <select value={lostReason} onChange={e => setLostReason(e.target.value)}>
              <option value="">Select Reason...</option>
              <option value="Not affordable">Not affordable</option>
              <option value="Chose competitor">Chose competitor</option>
              <option value="Timing not right">Timing not right</option>
              <option value="Non-responsive">Non-responsive</option>
              <option value="Course not relevant">Course not relevant</option>
              <option value="Other (Free Text)">Other (Free Text)</option>
            </select>
          </div>
        )}

        {requiresFollowUp && outcome !== '' && disposition !== 'Close - Onboarded' && disposition !== 'Close - Not Interested' && (
          <div>
            <label>Schedule Next Call Date</label>
            <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
          </div>
        )}

        <button className="btn" onClick={handleSave}>Log Call Activity</button>
      </div>
    </div>
  );
}
