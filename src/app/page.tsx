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

  // --- Module B State ---
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState('Parent Contact Number Only');
  const [pasteMatches, setPasteMatches] = useState<any[]>([]);
  const [pasteOrphans, setPasteOrphans] = useState<string[]>([]);
  const [loadingB, setLoadingB] = useState(false);

  const fetchModuleA = async () => {
    setLoadingA(true);
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
      const [coursesRes, studentsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/students')
      ]);
      const coursesData = await coursesRes.json();
      const studentsData = await studentsRes.json();
      setAvailableCourses(coursesData);
      setAvailableStudents(studentsData);
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
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
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
                  <tr key={opp.id}>
                    <td>{opp.lead?.studentName || '-'}</td>
                    <td>{opp.lead?.parentContactNumber}</td>
                    <td>{opp.courseName || '-'}</td>
                    <td><span className={`badge badge-${opp.stage.toLowerCase().replace(' ', '-')}`}>{opp.stage}</span></td>
                    <td>{opp.owner?.name}</td>
                    <td>{opp.leadSource}</td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>No opportunities found</td></tr>
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
