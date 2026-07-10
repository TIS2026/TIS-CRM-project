'use client';
import { useState } from 'react';

export default function CallManager({ oppId, initialCalls = [], ownerId, onCallUpdated }: any) {
  const calls = initialCalls;
  const [activeCall, setActiveCall] = useState<any>(null); // Call being logged
  const [outcome, setOutcome] = useState('');
  const [disposition, setDisposition] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [nextScheduledDate, setNextScheduledDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scheduledCalls = calls.filter((c: any) => c.status === 'Scheduled');
  const completedCalls = calls.filter((c: any) => c.status === 'Completed');

  const openCallModal = (call: any) => {
    setActiveCall(call);
    setOutcome('');
    setDisposition('');
    setLostReason('');
    setEnrollmentDate('');
    setNextScheduledDate('');
    setError('');
  };

  const submitCall = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/calls/${activeCall.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callOutcome: outcome,
          disposition: outcome === 'Connected' ? disposition : undefined,
          nextScheduledDate,
          lostReason,
          enrollmentDate
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActiveCall(null);
      // Reload opportunities (parent will handle this via callback)
      onCallUpdated();
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
    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--accent)' }}>Call History & Next Actions</h3>
        <button 
          onClick={async () => {
             await fetch('/api/calls', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ opportunityId: oppId, callType: 'Sales Call', ownerId })
             });
             onCallUpdated();
          }}
          style={{ padding: '0.5rem 1rem', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Schedule New Sales Call
        </button>
      </div>

      {scheduledCalls.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Action Required</h4>
          {scheduledCalls.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 0, 0, 0.1)', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid var(--danger)' }}>
              <div>
                <strong>{c.callType}</strong><br/>
                <small style={{ opacity: 0.8 }}>Scheduled: {new Date(c.scheduledDate).toLocaleString()}</small>
              </div>
              <button onClick={() => openCallModal(c)} style={{ padding: '0.4rem 1rem', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
                Log Call
              </button>
            </div>
          ))}
        </div>
      )}

      {completedCalls.length > 0 && (
        <div>
          <h4>Past Calls</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {completedCalls.map((c: any) => (
              <li key={c.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', marginBottom: '0.5rem', borderRadius: '4px' }}>
                <strong>{c.callType}</strong> - <span style={{ color: c.callOutcome === 'Connected' ? 'var(--success)' : 'orange' }}>{c.callOutcome}</span>
                {c.disposition && <span style={{ marginLeft: '10px', fontSize: '0.85rem', padding: '0.1rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>{c.disposition}</span>}
                <br/><small style={{ opacity: 0.6 }}>Completed: {new Date(c.completedDate).toLocaleString()} by {c.owner?.name}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {calls.length === 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
          <p style={{ margin: 0 }}>No calls have been logged for this opportunity yet.</p>
        </div>
      )}

      {activeCall && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3>Log {activeCall.callType}</h3>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
            
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setActiveCall(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }}>Cancel</button>
              <button 
                onClick={submitCall} 
                disabled={loading || !outcome || (outcome === 'Connected' && !disposition) || (['No Answer', 'Busy'].includes(outcome) && !nextScheduledDate) || (disposition && disposition.startsWith('Schedule') && !nextScheduledDate) || (disposition === 'Close - Not Interested' && !lostReason) || (disposition === 'Close - Onboarded' && !enrollmentDate)} 
                style={{ padding: '0.5rem 1rem', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
              >
                {loading ? 'Saving...' : 'Complete Call'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
