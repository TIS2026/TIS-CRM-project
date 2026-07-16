'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Agent');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [cfLoading, setCfLoading] = useState(false);
  const [cfResult, setCfResult] = useState<any>(null);

  const [adminEmails, setAdminEmails] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await fetch('/api/custom-fields');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomFields(data);
      } else {
        console.error('Custom fields API error:', data);
        setCustomFields([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCustomFields();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && data.adminEmails) {
        setAdminEmails(data.adminEmails);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailResult(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmails }),
      });
      const data = await response.json();
      if (response.ok) {
        setEmailResult({ success: true });
      } else {
        setEmailResult({ success: false, error: data.error });
      }
    } catch (error: any) {
      setEmailResult({ success: false, error: error.message });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, role: newRole }),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        setNewName('');
        setNewRole('Agent');
        fetchUsers();
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    setCfLoading(true);
    setCfResult(null);

    try {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFieldName, type: newFieldType }),
      });
      const data = await response.json();
      setCfResult(data);
      if (data.success) {
        setNewFieldName('');
        setNewFieldType('text');
        fetchCustomFields();
      }
    } catch (error: any) {
      setCfResult({ success: false, error: error.message });
    } finally {
      setCfLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this owner?')) return;
    
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) {
        setResult({ success: false, error: data.error });
      } else {
        setResult({ success: true, message: 'Owner removed successfully!' });
        fetchUsers();
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Settings</h1>
      
      <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>System Owners</h2>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Owner to View/Manage</label>
            <select 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px' }}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Choose an Owner --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedUserId && users.find(u => u.id === selectedUserId) && (
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>{users.find(u => u.id === selectedUserId)?.name}</h3>
                <p style={{ margin: '0 0 0.25rem 0' }}><strong>Role:</strong> <span className={`badge badge-${users.find(u => u.id === selectedUserId)?.role.toLowerCase()}`}>{users.find(u => u.id === selectedUserId)?.role}</span></p>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}><strong>System ID:</strong> {selectedUserId}</p>
              </div>
              <button 
                onClick={() => {
                  handleDeleteUser(selectedUserId);
                  setSelectedUserId('');
                }} 
                style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                disabled={loading}
              >
                Remove Owner
              </button>
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>Add New Owner</h3>
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Name</label>
            <input 
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="Agent">Agent</option>
              <option value="Admin">Admin</option>
              <option value="System">System</option>
            </select>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Saving...' : 'Add Owner'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            {result.success ? (
              <span style={{ color: 'var(--success)' }}>Successfully added new owner!</span>
            ) : (
              <span style={{ color: 'var(--danger)' }}>Error: {result.error}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Custom Data Fields</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Define custom data fields to be added to all Opportunities. These will appear dynamically in the Add New Lead form and Student profiles.
        </p>

        <table style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Field Name</th>
              <th>Data Type</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {customFields.map((cf: any) => (
              <tr key={cf.id}>
                <td style={{ fontWeight: 500 }}>{cf.name}</td>
                <td>{cf.type}</td>
                <td style={{ opacity: 0.5 }}>{new Date(cf.createdDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {customFields.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center' }}>No custom fields defined.</td></tr>
            )}
          </tbody>
        </table>

        <h3 style={{ marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>Add New Data Field</h3>
        <form onSubmit={handleAddCustomField} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Field Name</label>
            <input 
              required
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              placeholder="e.g. Hobbies, Preferred Time"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Field Type</label>
            <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)}>
              <option value="text">Text (Single Line)</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
          </div>
          <button type="submit" className="btn" disabled={cfLoading}>
            {cfLoading ? 'Saving...' : 'Add Data Field'}
          </button>
        </form>

        {cfResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            {cfResult.success ? (
              <span style={{ color: 'var(--success)' }}>Successfully added new data field!</span>
            ) : (
              <span style={{ color: 'var(--danger)' }}>Error: {cfResult.error}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Automated Backups</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          The system will automatically generate a full CSV backup of your database every day at 5:30 AM IST (Midnight UTC) and email it to the addresses below.
        </p>

        <form onSubmit={handleSaveEmails} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Admin Email Addresses (comma-separated)</label>
            <textarea 
              value={adminEmails}
              onChange={e => setAdminEmails(e.target.value)}
              placeholder="admin@example.com, manager@example.com"
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' }}
            />
          </div>
          <button type="submit" className="btn" disabled={emailLoading} style={{ alignSelf: 'flex-start' }}>
            {emailLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>

        {emailResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            {emailResult.success ? (
              <span style={{ color: 'var(--success)' }}>Settings saved successfully!</span>
            ) : (
              <span style={{ color: 'var(--danger)' }}>Error: {emailResult.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
