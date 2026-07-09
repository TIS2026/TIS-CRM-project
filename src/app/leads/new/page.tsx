'use client';
import { useState, useEffect } from 'react';

export default function NewLeadPage() {
  const [formData, setFormData] = useState({
    parentContactNumber: '',
    studentName: '',
    studentEmail: '',
    parentName: '',
    school: '',
    courseName: '',
    studentGrade: '',
    ownerId: '',
    leadSource: '',
    bucket: '',
    remarks: ''
  });
  const [customFieldsData, setCustomFieldsData] = useState<any>({});
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(console.error);
      
    fetch('/api/custom-fields')
      .then(res => res.json())
      .then(data => setCustomFields(data))
      .catch(console.error);
  }, []);

  const leadSources = [
    'Referral', 'Walk-in', 'Website Inquiry', 'Ad Campaign', 
    'Repeat - Inbound', 'Agent Outreach', 'Event/Workshop', 'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFieldsData({ ...customFieldsData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        ...formData,
        customFields: customFieldsData
      };
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        setFormData({
          parentContactNumber: '', studentName: '', studentEmail: '',
          parentName: '', school: '', courseName: '', studentGrade: '',
          ownerId: '', leadSource: '', bucket: '', remarks: ''
        });
        setCustomFieldsData({});
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Add New Lead</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>Parent Contact Number *</label>
            <input 
              required
              name="parentContactNumber"
              value={formData.parentContactNumber}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label>Student Name</label>
            <input 
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>Parent Name</label>
            <input 
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Student Email</label>
            <input 
              type="email"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>School</label>
            <input 
              name="school"
              value={formData.school}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Interested Course</label>
            <input 
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>Student Grade</label>
            <input 
              name="studentGrade"
              value={formData.studentGrade}
              onChange={handleChange}
              placeholder="e.g. 8"
            />
          </div>
          <div>
            <label>Owner</label>
            <select name="ownerId" value={formData.ownerId} onChange={handleChange}>
              <option value="">Unassigned (System Default)</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label>Lead Source *</label>
            <select required name="leadSource" value={formData.leadSource} onChange={handleChange}>
              <option value="">Select a Source...</option>
              {leadSources.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          <div>
            <label>Bucket</label>
            <input 
              name="bucket"
              value={formData.bucket}
              onChange={handleChange}
              placeholder="e.g. Hot, Warm, Cold"
              list="bucket-suggestions"
            />
            <datalist id="bucket-suggestions">
              <option value="Hot" />
              <option value="Warm" />
              <option value="Cold" />
            </datalist>
          </div>
        </div>

        <div>
          <label>Remarks</label>
          <textarea 
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={3}
            placeholder="Add any additional remarks here..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {customFields.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Additional Data Fields</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {customFields.map(cf => (
                <div key={cf.id}>
                  <label>{cf.name}</label>
                  <input 
                    type={cf.type === 'date' ? 'date' : cf.type === 'number' ? 'number' : 'text'}
                    value={customFieldsData[cf.id] || ''}
                    onChange={e => handleCustomFieldChange(cf.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? 'Saving...' : 'Save Lead'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          {result.success ? (
            <div style={{ color: 'var(--success)' }}>
              Successfully {result.isNewLead ? 'created a new lead' : 'appended an opportunity to an existing lead'}! 
              <br/>Opportunity ID: {result.opportunityId}
            </div>
          ) : (
            <div style={{ color: 'var(--danger)' }}>
              Error: {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
