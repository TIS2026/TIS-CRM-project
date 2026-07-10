'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [availableLeadSources, setAvailableLeadSources] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, customFieldsRes, usersRes, filtersRes] = await Promise.all([
          fetch(`/api/leads/${id}`),
          fetch('/api/custom-fields'),
          fetch('/api/users'),
          fetch('/api/filters')
        ]);
        
        const leadData = await leadRes.json();
        const cfData = await customFieldsRes.json();
        const uData = await usersRes.json();
        const filtersData = await filtersRes.json();

        setLead(leadData);
        setOpportunities(leadData.opportunities || []);
        setCustomFields(cfData);
        setUsers(uData);
        setAvailableBuckets(filtersData.buckets || []);
        setAvailableStages(filtersData.stages || []);
        setAvailableLeadSources(filtersData.leadSources || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLead({ ...lead, [e.target.name]: e.target.value });
  };

  const handleOppChange = (oppId: string, field: string, value: string) => {
    setOpportunities(opportunities.map(o => 
      o.id === oppId ? { ...o, [field]: value } : o
    ));
  };

  const handleCustomFieldChange = (oppId: string, cfId: string, value: string) => {
    setOpportunities(opportunities.map(o => {
      if (o.id === oppId) {
        return {
          ...o,
          customFields: { ...(o.customFields || {}), [cfId]: value }
        };
      }
      return o;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadData: lead,
          opportunitiesData: opportunities
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Student Profile...</div>;
  if (!lead) return <div style={{ padding: '2rem' }}>Student not found.</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 600 }}>Student Profile: {lead.studentName || 'Unnamed Student'}</h1>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {result && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          {result.success ? (
            <span style={{ color: 'var(--success)' }}>Successfully updated profile!</span>
          ) : (
            <span style={{ color: 'var(--danger)' }}>Error: {result.error}</span>
          )}
        </div>
      )}

      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Core Contact Info</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>Student Name</label>
            <input name="studentName" value={lead.studentName || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>Student Contact</label>
            <input name="studentContactNumber" value={lead.studentContactNumber || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>Student Email</label>
            <input name="studentEmail" value={lead.studentEmail || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>School</label>
            <input name="school" value={lead.school || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>Parent 1 Name</label>
            <input name="parentName" value={lead.parentName || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>Parent 1 Contact *</label>
            <input name="parentContactNumber" value={lead.parentContactNumber || ''} onChange={handleLeadChange} required />
          </div>
          <div>
            <label>Parent 2 Name</label>
            <input name="parent2Name" value={lead.parent2Name || ''} onChange={handleLeadChange} />
          </div>
          <div>
            <label>Parent 2 Contact</label>
            <input name="parent2ContactNumber" value={lead.parent2ContactNumber || ''} onChange={handleLeadChange} />
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Opportunities & Data Fields</h2>
        {opportunities.map((opp, idx) => (
          <div key={opp.id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              Opportunity #{idx + 1} &mdash; {opp.courseName || 'No Course specified'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label>Course Name</label>
                <input value={opp.courseName || ''} onChange={e => handleOppChange(opp.id, 'courseName', e.target.value)} />
              </div>
              <div>
                <label>Stage</label>
                <select value={opp.stage || ''} onChange={e => handleOppChange(opp.id, 'stage', e.target.value)}>
                  <option value="">Select Stage...</option>
                  {availableStages.map((stage, idx) => (
                    <option key={idx} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Bucket</label>
                <select value={opp.bucket || ''} onChange={e => handleOppChange(opp.id, 'bucket', e.target.value)}>
                  <option value="">Select Bucket...</option>
                  {availableBuckets.map((bucket, idx) => (
                    <option key={idx} value={bucket}>{bucket}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Owner</label>
                <select value={opp.ownerId || ''} onChange={e => handleOppChange(opp.id, 'ownerId', e.target.value)}>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label>Lead Source</label>
                <select value={opp.leadSource || ''} onChange={e => handleOppChange(opp.id, 'leadSource', e.target.value)}>
                  <option value="">Select Lead Source...</option>
                  {availableLeadSources.map((source, idx) => (
                    <option key={idx} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Enrollment Date</label>
                <input type="date" value={opp.enrollmentDate ? new Date(opp.enrollmentDate).toISOString().split('T')[0] : ''} onChange={e => handleOppChange(opp.id, 'enrollmentDate', e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label>Remarks</label>
              <textarea 
                rows={2} 
                value={opp.remarks || ''} 
                onChange={e => handleOppChange(opp.id, 'remarks', e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {customFields.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Custom Data Fields</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {customFields.map(cf => (
                    <div key={cf.id}>
                      <label>{cf.name}</label>
                      <input 
                        type={cf.type === 'date' ? 'date' : cf.type === 'number' ? 'number' : 'text'}
                        value={opp.customFields?.[cf.id] || ''}
                        onChange={e => handleCustomFieldChange(opp.id, cf.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}
