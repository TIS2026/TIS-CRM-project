'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Agent');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [cfLoading, setCfLoading] = useState(false);
  const [cfResult, setCfResult] = useState<any>(null);

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
  }, []);

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

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Settings</h1>
      
      <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>System Owners</h2>
        
        <table style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>System ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.name}</td>
                <td><span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span></td>
                <td style={{ opacity: 0.5, fontSize: '0.85rem' }}>{user.id}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center' }}>No owners found.</td></tr>
            )}
          </tbody>
        </table>

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
    </div>
  );
}
