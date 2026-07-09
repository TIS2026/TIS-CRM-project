'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'moduleA' | 'moduleB'>('moduleA');

  // --- Module A State ---
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterCourseName, setFilterCourseName] = useState('');
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bulkStage, setBulkStage] = useState('');
  const [bulkOwner, setBulkOwner] = useState('');
  const [bulkCourse, setBulkCourse] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  // --- Module B State ---
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState('Parent Contact Number Only');
  const [pasteMatches, setPasteMatches] = useState<any[]>([]);
  const [pasteOrphans, setPasteOrphans] = useState<string[]>([]);
  const [loadingB, setLoadingB] = useState(false);

  const fetchModuleA = async () => {
    setLoadingA(true);
    setSelectedRows([]); // Clear selections on new search
    try {
      const res = await fetch(`/api/opportunities?studentName=${filterStudentName}&courseName=${filterCourseName}`);
      const data = await res.json();
      setOpportunities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingA(false);
    }
  };

  const fetchCoursesAndStudents = async () => {
    try {
      const [coursesRes, studentsRes, usersRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/students'),
        fetch('/api/users')
      ]);
      const coursesData = await coursesRes.json();
      const studentsData = await studentsRes.json();
      const usersData = await usersRes.json();
      setAvailableCourses(coursesData);
      setAvailableStudents(studentsData);
      setUsers(usersData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModuleA();
    fetchCoursesAndStudents();
  }, []);

  const handlePasteSearch = async () => {
    setLoadingB(true);
    try {
      const res = await fetch('/api/opportunities/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText, mode: pasteMode })
      });
      const data = await res.json();
      setPasteMatches(data.matches);
      setPasteOrphans(data.orphans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingB(false);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const toggleAllRows = () => {
    if (selectedRows.length === opportunities.length && opportunities.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(opportunities.map(o => o.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRows.length === 0) return;
    setBulkLoading(true);
    try {
      const updates: any = {};
      if (bulkStage) updates.stage = bulkStage;
      if (bulkOwner) updates.ownerId = bulkOwner;
      if (bulkCourse) updates.courseName = bulkCourse;

      await fetch('/api/opportunities/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityIds: selectedRows, updates })
      });
      
      // Refresh and reset
      await fetchModuleA();
      setBulkStage('');
      setBulkOwner('');
      setBulkCourse('');
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (opportunities.length === 0) return;
    const headers = ['Student Name', 'Parent Contact', 'Course', 'Stage', 'Owner', 'Lead Source'];
    const csvRows = [headers.join(',')];
    
    opportunities.forEach(opp => {
      const row = [
        `"${opp.lead?.studentName || ''}"`,
        `"${opp.lead?.parentContactNumber || ''}"`,
        `"${opp.courseName || ''}"`,
        `"${opp.stage || ''}"`,
        `"${opp.owner?.name || ''}"`,
        `"${opp.leadSource || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>CRM Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'moduleA' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('moduleA')}
        >
          Module A: Filter Search
        </button>
        <button 
          className={`btn ${activeTab === 'moduleB' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('moduleB')}
        >
          Module B: Paste-to-Search
        </button>
      </div>

      {activeTab === 'moduleA' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <input 
                placeholder="Filter by Student Name" 
                value={filterStudentName} 
                onChange={e => setFilterStudentName(e.target.value)} 
                list="student-suggestions"
              />
              <datalist id="student-suggestions">
                {availableStudents.map((student, idx) => (
                  <option key={idx} value={student} />
                ))}
              </datalist>
            </div>
            <div>
              <input 
                placeholder="Filter by Course Name" 
                value={filterCourseName} 
                onChange={e => setFilterCourseName(e.target.value)}
                list="course-suggestions"
              />
              <datalist id="course-suggestions">
                {availableCourses.map((course, idx) => (
                  <option key={idx} value={course} />
                ))}
              </datalist>
            </div>
            <button className="btn" onClick={fetchModuleA} disabled={loadingA}>Search</button>
            <button className="btn btn-secondary" onClick={handleDownloadCSV} disabled={opportunities.length === 0}>
              Download CSV
            </button>
          </div>

          {selectedRows.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{selectedRows.length} selected</span>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }}></div>
              <select value={bulkStage} onChange={e => setBulkStage(e.target.value)}>
                <option value="">Change Stage...</option>
                <option value="New">New</option>
                <option value="Attempted">Attempted</option>
                <option value="Connected">Connected</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
              </select>
              <select value={bulkOwner} onChange={e => setBulkOwner(e.target.value)}>
                <option value="">Change Owner...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input 
                placeholder="Change Course..." 
                value={bulkCourse}
                onChange={e => setBulkCourse(e.target.value)}
                list="course-suggestions-bulk"
              />
              <datalist id="course-suggestions-bulk">
                {availableCourses.map((c, i) => <option key={i} value={c} />)}
              </datalist>
              <button 
                className="btn" 
                onClick={handleBulkUpdate} 
                disabled={bulkLoading || (!bulkStage && !bulkOwner && !bulkCourse)}
              >
                {bulkLoading ? 'Applying...' : 'Apply Bulk Edit'}
              </button>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={opportunities.length > 0 && selectedRows.length === opportunities.length}
                      onChange={toggleAllRows}
                    />
                  </th>
                  <th>Student Name</th>
                  <th>Parent Contact</th>
                  <th>Course</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Lead Source</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map(opp => (
                  <tr key={opp.id} style={{ background: selectedRows.includes(opp.id) ? 'rgba(0,122,255,0.1)' : 'transparent' }}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(opp.id)}
                        onChange={() => toggleRow(opp.id)}
                      />
                    </td>
                    <td>{opp.lead?.studentName || '-'}</td>
                    <td>{opp.lead?.parentContactNumber}</td>
                    <td>{opp.courseName || '-'}</td>
                    <td><span className={`badge badge-${opp.stage.toLowerCase().replace(' ', '-')}`}>{opp.stage}</span></td>
                    <td>{opp.owner?.name}</td>
                    <td>{opp.leadSource}</td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem'}}>No opportunities found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'moduleB' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <select value={pasteMode} onChange={e => setPasteMode(e.target.value)} style={{ marginBottom: '1rem' }}>
              <option value="Parent Contact Number Only">Parent Contact Number Only</option>
              <option value="Student Name Only">Student Name Only</option>
              <option value="Student Name + Parent Contact Number (Two Columns)">Student Name + Parent Contact Number (Two Columns)</option>
            </select>
            
            <textarea 
              rows={6} 
              placeholder="Paste Excel data here (separated by newlines and tabs)..." 
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <button className="btn" onClick={handlePasteSearch} disabled={loadingB}>Parse & Search</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Table Alpha: Matches ({pasteMatches.length})</h3>
              <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
                {pasteMatches.length > 0 ? (
                   <table>
                   <thead>
                     <tr>
                       <th>Student</th>
                       <th>Course</th>
                       <th>Stage</th>
                     </tr>
                   </thead>
                   <tbody>
                     {pasteMatches.map(opp => (
                       <tr key={opp.id}>
                         <td>{opp.lead?.studentName || '-'}</td>
                         <td>{opp.courseName || '-'}</td>
                         <td><span className={`badge badge-${opp.stage.toLowerCase().replace(' ', '-')}`}>{opp.stage}</span></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                ) : <p style={{ color: 'var(--text-secondary)' }}>No matches found.</p>}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Table Beta: Orphans ({pasteOrphans.length})</h3>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                {pasteOrphans.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {pasteOrphans.map((orphan, idx) => (
                      <li key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        {orphan}
                      </li>
                    ))}
                  </ul>
                ) : <p style={{ color: 'var(--text-secondary)' }}>No orphans found.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
