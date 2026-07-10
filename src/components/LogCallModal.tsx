'use client';
import { useState } from 'react';

export default function LogCallModal({ activeCall, onCancel, onSuccess }: any) {
  const [outcome, setOutcome] = useState('');
  const [disposition, setDisposition] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [nextScheduledDate, setNextScheduledDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitCall = async () => {
    if (!remarks.trim()) {
      setError('Remarks are strictly mandatory.');
      return;
    }

    setLoading(true);
    setError('');

    let finalDisposition = undefined;
    if (outcome === 'Connected') {
      finalDisposition = `${disposition} | Remark: ${remarks}`;
    } else {
      finalDisposition = `Remark: ${remarks}`;
    }

    try {
      const res = await fetch(`/api/calls/${activeCall.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callOutcome: outcome,
          disposition: finalDisposition,
          nextScheduledDate,
          lostReason,
          enrollmentDate
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDispositionOptions = (callType: string) => {
    if (callType.includes('Sales Call') || callType.includes('Sales Follow-up')) {
      return (
        <>
          <option value="Schedule Sales Follow-up">Schedule Sales Follow-up</option>
          <option value="Schedule Assessment Call">Schedule Assessment Call</option>
          <option value="Schedule Payment Confirmation Call">Schedule Payment Confirmation Call (Direct Path)</option>
          <option value="Close - Not Interested">Close - Not Interested</option>
        </>
      );
    }
    if (callType.includes('Assessment')) {
      return (
        <>
          <option value="Schedule Assessment Follow-up">Schedule Assessment Follow-up</option>
          <option value="Schedule Payment Confirmation Call">Schedule Payment Confirmation Call</option>
          <option value="Close - Not Interested">Close - Not Interested</option>
          <option value="Close - Onboarded">Close - Onboarded</option>
        </>
      );
    }
    if (callType.includes('Payment Confirmation')) {
      return (
        <>
          <option value="Schedule Payment Confirmation Follow-up">Schedule Payment Confirmation Follow-up</option>
          <option value="Close - Not Interested">Close - Not Interested</option>
          <option value="Close - Onboarded">Close - Onboarded</option>
        </>
      );
    }
    return null;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: 'var(--bg)', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>Log {activeCall.callType}</h3>
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Call Outcome *</label>
          <select value={outcome} onChange={e => { setOutcome(e.target.value); setDisposition(''); }} style={{ width: '100%', padding: '0.5rem' }}>
            <option value="">Select Outcome...</option>
            <option value="Connected">Connected</option>
            <option value="No Answer">No Answer</option>
            <option value="Busy">Busy</option>
            <option value="Invalid Number">Invalid Number</option>
          </select>
        </div>

        {outcome === 'Connected' && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Disposition *</label>
            <select value={disposition} onChange={e => setDisposition(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="">Select Disposition...</option>
              {renderDispositionOptions(activeCall.callType)}
            </select>
          </div>
        )}

        {disposition === 'Close - Not Interested' && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Lost Reason *</label>
            <input type="text" value={lostReason} onChange={e => setLostReason(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} placeholder="Why did we lose them?" />
          </div>
        )}

        {disposition === 'Close - Onboarded' && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Enrollment Date *</label>
            <input type="date" value={enrollmentDate} onChange={e => setEnrollmentDate(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
        )}

        {((outcome && !['Connected', 'Invalid Number'].includes(outcome)) || (disposition && disposition.startsWith('Schedule'))) && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 165, 0, 0.1)', border: '2px solid orange', borderRadius: '8px' }}>
            <label style={{ color: 'orange', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'block' }}>
              {outcome !== 'Connected' ? '⚠️ PROMPT: Mandatory Follow-up Required' : '⚠️ PROMPT: Schedule Next Step'}
            </label>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
              Please select the date and time for the follow-up call to proceed.
            </p>
            <input type="datetime-local" value={nextScheduledDate} onChange={e => setNextScheduledDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid orange', borderRadius: '4px' }} />
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label>Remarks * (Mandatory)</label>
          <textarea 
            rows={3}
            value={remarks} 
            onChange={e => setRemarks(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem' }} 
            placeholder="Detailed notes from the call..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }}>Cancel</button>
          <button 
            onClick={submitCall} 
            disabled={loading || !outcome || !remarks.trim() || (outcome === 'Connected' && !disposition) || (['No Answer', 'Busy'].includes(outcome) && !nextScheduledDate) || (disposition && disposition.startsWith('Schedule') && !nextScheduledDate) || (disposition === 'Close - Not Interested' && !lostReason) || (disposition === 'Close - Onboarded' && !enrollmentDate)} 
            style={{ padding: '0.5rem 1rem', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : 'Complete Call'}
          </button>
        </div>
      </div>
    </div>
  );
}
