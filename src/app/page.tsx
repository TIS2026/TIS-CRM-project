'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'moduleA' | 'moduleB'>('moduleA');

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'opportunities' | 'leads'>('opportunities');
  const [sortOrder, setSortOrder] = useState<'newest' | 'az'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterCourseName, setFilterCourseName] = useState('');
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<string[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [showCustomFilters, setShowCustomFilters] = useState(false);
  const [filterStage, setFilterStage] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterLeadSource, setFilterLeadSource] = useState('');
  const [filterBucket, setFilterBucket] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bulkStage, setBulkStage] = useState('');
  const [bulkOwner, setBulkOwner] = useState('');
  const [bulkCourse, setBulkCourse] = useState('');
  const [bulkBucket, setBulkBucket] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [availableLeadSources, setAvailableLeadSources] = useState<string[]>([]);
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [pendingCalls, setPendingCalls] = useState<any[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [callingOppId, setCallingOppId] = useState<string | null>(null);

  // --- Module B State ---
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState('Parent Contact Number Only');
  const [pasteMatches, setPasteMatches] = useState<any[]>([]);
  const [pasteOrphans, setPasteOrphans] = useState<string[]>([]);
  const [loadingB, setLoadingB] = useState(false);

  const fetchModuleA = async (pageOverride?: number) => {
    setLoadingA(true);
    setSelectedRows([]); // Clear selections on new search
    const targetPage = pageOverride || page;
    try {
      const params = new URLSearchParams();
      if (filterStudentName) params.append('studentName', filterStudentName);
      if (filterCourseName) params.append('courseName', filterCourseName);
      if (filterStage) params.append('stage', filterStage);
      if (filterOwner) params.append('ownerId', filterOwner);
      if (filterLeadSource) params.append('leadSource', filterLeadSource);
      if (filterBucket) params.append('bucket', filterBucket);
      params.append('sort', sortOrder);
      params.append('page', targetPage.toString());
      params.append('limit', '50');

      if (viewMode === 'opportunities') {
        const res = await fetch(`/api/opportunities?${params.toString()}`);
        const data = await res.json();
        setOpportunities(data.opportunities || []);
        setTotalPages(Math.ceil((data.total || 0) / 50));
        setTotalRecords(data.total || 0);
      } else {
        const res = await fetch(`/api/leads?${params.toString()}`);
        const data = await res.json();
        setLeads(data.leads || []);
        setTotalPages(Math.ceil((data.total || 0) / 50));
        setTotalRecords(data.total || 0);
      }
      setPage(targetPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingA(false);
    }
  };

  const fetchCoursesAndStudents = async () => {
    try {
      const [coursesRes, studentsRes, usersRes, customFieldsRes, filtersRes] = await Promise.all([
        fetch('/api/courses?t=' + Date.now()),
        fetch('/api/students?t=' + Date.now()),
        fetch('/api/users?t=' + Date.now()),
        fetch('/api/custom-fields?t=' + Date.now()),
        fetch('/api/filters?t=' + Date.now())
      ]);
      const coursesData = await coursesRes.json();
      const studentsData = await studentsRes.json();
      const usersData = await usersRes.json();
      const cfData = await customFieldsRes.json();
      const filtersData = await filtersRes.json();
      
      setAvailableCourses(coursesData);
      setAvailableStudents(studentsData);
      setUsers(usersData);
      setCustomFields(cfData);
      setAvailableBuckets(filtersData.buckets || []);
      setAvailableStages(filtersData.stages || []);
      setAvailableLeadSources(filtersData.leadSources || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModuleA(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [viewMode, sortOrder, filterStudentName, filterCourseName, filterBucket, filterStage, filterOwner, filterLeadSource]);

  useEffect(() => {
    fetchCoursesAndStudents();
    fetchPendingCalls();
  }, []);

  const fetchPendingCalls = async () => {
    setLoadingCalls(true);
    try {
      const res = await fetch('/api/calls/pending?t=' + Date.now());
      const data = await res.json();
      setPendingCalls(data.calls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCalls(false);
    }
  };

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
      setSelectedRows(data.matches.map((o: any) => o.id));
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

  const toggleAllPasteMatches = () => {
    const allSelected = pasteMatches.length > 0 && pasteMatches.every((opp: any) => selectedRows.includes(opp.id));
    if (allSelected) {
      const matchIds = pasteMatches.map((o: any) => o.id);
      setSelectedRows(prev => prev.filter(id => !matchIds.includes(id)));
    } else {
      const matchIds = pasteMatches.map((o: any) => o.id);
      setSelectedRows(prev => Array.from(new Set([...prev, ...matchIds])));
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
      if (bulkBucket) updates.bucket = bulkBucket;

      await fetch('/api/opportunities/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityIds: selectedRows, updates })
      });
      
      await fetchModuleA();

      setBulkStage('');
      setBulkOwner('');
      setBulkCourse('');
      setBulkBucket('');
      setSelectedRows([]);
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (selectedRows.length === 0) return;
    
    if (!bulkOwner || !bulkBucket) {
      alert("Please select both an Owner and a Bucket before creating opportunities.");
      return;
    }

    setBulkLoading(true);
    try {
      const opportunityData: any = {};
      if (bulkStage) opportunityData.stage = bulkStage;
      opportunityData.ownerId = bulkOwner;
      if (bulkCourse) opportunityData.courseName = bulkCourse;
      opportunityData.bucket = bulkBucket;

      await fetch('/api/opportunities/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedRows, opportunityData })
      });
      
      // Refresh module A
      await fetchModuleA();

      // Reset bulk inputs and selection
      setBulkStage('');
      setBulkOwner('');
      setBulkCourse('');
      setBulkBucket('');
      setSelectedRows([]);
      setPasteMatches([]); // Clear paste matches after creation
      setPasteOrphans([]);
      setPasteText('');
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected leads? This cannot be undone.`)) return;
    
    setBulkDeleteLoading(true);
    try {
      await fetch('/api/opportunities/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityIds: selectedRows })
      });
      
      await fetchModuleA();
    } catch (e) {
      console.error(e);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (opportunities.length === 0) return;
    
    // Comprehensive headers matching all fields from Lead and Opportunity models
    const headers = [
      'Opportunity ID', 'Lead ID', 
      'Student Name', 'Student Email', 'Student Contact', 
      'Parent Name', 'Parent Email', 'Parent Contact',
      'Parent 2 Name', 'Parent 2 Email', 'Parent 2 Contact',
      'School', 'Student Grade', 'Lead Type', 'Lead Created Source',
      'Course Name', 'Stage', 'Bucket', 'Remarks', 'Owner', 'Lead Source', 'Opportunity Type',
      'Enrollment Date', 'Enrollment Center', 'Grade At Enrollment',
      'Lost Reason', 'Lost At Stage', 'Is Data Incomplete', 'Created Date'
    ];
    
    customFields.forEach(cf => headers.push(cf.name));
    
    const csvRows = [headers.join(',')];
    
    // Helper to safely escape CSV strings containing quotes or commas
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    
    opportunities.forEach(opp => {
      const row = [
        escapeCSV(opp.id),
        escapeCSV(opp.lead?.id),
        escapeCSV(opp.lead?.studentName),
        escapeCSV(opp.lead?.studentEmail),
        escapeCSV(opp.lead?.studentContactNumber),
        escapeCSV(opp.lead?.parentName),
        escapeCSV(opp.lead?.parentEmail),
        escapeCSV(opp.lead?.parentContactNumber),
        escapeCSV(opp.lead?.parent2Name),
        escapeCSV(opp.lead?.parent2Email),
        escapeCSV(opp.lead?.parent2ContactNumber),
        escapeCSV(opp.lead?.school),
        escapeCSV(opp.lead?.studentGrade),
        escapeCSV(opp.lead?.leadType),
        escapeCSV(opp.lead?.createdSource),
        escapeCSV(opp.courseName),
        escapeCSV(opp.stage),
        escapeCSV(opp.bucket),
        escapeCSV(opp.owner?.name),
        escapeCSV(opp.leadSource),
        escapeCSV(opp.opportunityType),
        escapeCSV(opp.enrollmentDate ? new Date(opp.enrollmentDate).toISOString() : ''),
        escapeCSV(opp.enrollmentCenter),
        escapeCSV(opp.gradeAtEnrollment),
        escapeCSV(opp.lostReason),
        escapeCSV(opp.lostAtStage),
        escapeCSV(opp.isDataIncomplete),
        escapeCSV(opp.createdDate ? new Date(opp.createdDate).toISOString() : '')
      ];
      
      customFields.forEach(cf => {
        row.push(escapeCSV(opp.customFields?.[cf.id] || ''));
      });
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontWeight: 600 }}>CRM Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${activeTab === 'moduleA' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('moduleA')}>
            Data View
          </button>
          <button className={`btn ${activeTab === 'moduleB' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('moduleB')}>
            Paste-to-Search
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: pendingCalls.length > 0 ? 'rgba(255, 0, 0, 0.05)' : 'var(--bg-highlight)', borderRadius: '8px', borderLeft: pendingCalls.length > 0 ? '4px solid var(--danger)' : '4px solid var(--border-light)' }}>
        <h2 style={{ marginBottom: '1rem', color: pendingCalls.length > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '1.2rem' }}>
          {pendingCalls.length > 0 ? `Action Required: Pending Calls (${pendingCalls.length})` : 'Pending Calls (0)'}
        </h2>
        
        {loadingCalls ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading pending calls...</p>
        ) : pendingCalls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {pendingCalls.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-highlight)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '0.5rem' }}>{c.callType}</div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Student:</strong> <Link href={`/leads/${c.opportunity?.leadId}`} style={{ textDecoration: 'underline' }}>{c.opportunity?.lead?.studentName || 'Unknown'}</Link>
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Course:</strong> {c.opportunity?.courseName || '-'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Owner:</strong> {c.owner?.name || '-'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Scheduled: {new Date(c.scheduledDate).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>You have no scheduled pending calls.</p>
        )}
      </div>

      {activeTab === 'moduleA' && (
        <div>
          {/* Main Controls Row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', padding: '1rem', background: 'var(--bg-highlight)', borderRadius: '8px', border: '1px solid var(--border-light)', alignItems: 'center' }}>
            <select className="btn btn-secondary" style={{ padding: '0.5rem', background: 'var(--bg-secondary)', cursor: 'pointer' }} value={viewMode} onChange={e => setViewMode(e.target.value as any)}>
              <option value="leads">View: Unique Leads</option>
              <option value="opportunities">View: Opportunities</option>
            </select>
            <button className="btn btn-secondary" onClick={() => setSortOrder(sortOrder === 'newest' ? 'az' : 'newest')} style={{ background: 'var(--bg-secondary)' }}>
              {sortOrder === 'newest' ? 'Sort: Newest First' : 'Sort: A-Z'}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setShowCustomFilters(!showCustomFilters)} style={{ background: 'var(--bg-secondary)' }}>
                {showCustomFilters ? 'Hide Advanced Filters' : 'Advanced Filters'}
              </button>
              <button className="btn" onClick={() => fetchModuleA(1)} disabled={loadingA}>Search</button>
              <button className="btn btn-secondary" onClick={handleDownloadCSV} disabled={opportunities.length === 0} style={{ background: 'var(--bg-secondary)' }}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Quick Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
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
            <div>
              <select 
                value={filterBucket} 
                onChange={e => setFilterBucket(e.target.value)} 
              >
                <option value="">All Buckets</option>
                {availableBuckets.map((bucket, idx) => (
                  <option key={idx} value={bucket}>{bucket}</option>
                ))}
              </select>
            </div>
          </div>

          {showCustomFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-highlight)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Stage</label>
                <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ width: '100%' }}>
                  <option value="">All Stages</option>
                  {availableStages.map((stage, idx) => (
                    <option key={idx} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Owner</label>
                <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} style={{ width: '100%' }}>
                  <option value="">All Owners</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lead Source</label>
                <select value={filterLeadSource} onChange={e => setFilterLeadSource(e.target.value)} style={{ width: '100%' }}>
                  <option value="">All Sources</option>
                  {availableLeadSources.map((source, idx) => (
                    <option key={idx} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedRows.length > 0 && viewMode === 'opportunities' && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-highlight-strong)', borderRadius: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{selectedRows.length} selected</span>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
              <select value={bulkStage} onChange={e => setBulkStage(e.target.value)}>
                <option value="">Change Stage...</option>
                {availableStages.map((stage, idx) => (
                  <option key={idx} value={stage}>{stage}</option>
                ))}
              </select>
              <select value={bulkOwner} onChange={e => setBulkOwner(e.target.value)}>
                <option value="">Change Owner...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input 
                placeholder="Type or select Bucket..." 
                value={bulkBucket}
                onChange={e => setBulkBucket(e.target.value)}
                list="bucket-suggestions-module-a"
              />
              <datalist id="bucket-suggestions-module-a">
                {availableBuckets.map((bucket, idx) => (
                  <option key={idx} value={bucket}>{bucket}</option>
                ))}
              </datalist>
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
                disabled={bulkLoading || (!bulkStage && !bulkOwner && !bulkCourse && !bulkBucket)}
              >
                {bulkLoading ? 'Applying...' : 'Apply Bulk Edit'}
              </button>
              <button 
                className="btn" 
                onClick={handleBulkDelete} 
                disabled={bulkDeleteLoading}
                style={{ marginLeft: 'auto', background: 'var(--danger, #dc3545)', color: 'white' }}
              >
                {bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            {viewMode === 'opportunities' ? (
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
                    <th>Bucket</th>
                    <th>Remarks</th>
                    {customFields.map(cf => <th key={cf.id}>{cf.name}</th>)}
                    <th>Owner</th>
                    <th>Lead Source</th>
                    <th>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map(opp => (
                    <tr key={opp.id} style={{ background: selectedRows.includes(opp.id) ? '#eff6ff' : 'transparent' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(opp.id)}
                          onChange={() => toggleRow(opp.id)}
                        />
                      </td>
                      <td>
                        <Link href={`/leads/${opp.lead?.id}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                          {opp.lead?.studentName || '-'}
                        </Link>
                      </td>
                      <td>{opp.lead?.parentContactNumber}</td>
                      <td>{opp.courseName || '-'}</td>
                      <td><span className={`badge badge-${opp.stage.toLowerCase().replace(' ', '-')}`}>{opp.stage}</span></td>
                      <td>{opp.bucket ? <span className="badge" style={{background: 'var(--accent)', color: 'white'}}>{opp.bucket}</span> : '-'}</td>
                      <td>{opp.remarks || '-'}</td>
                      {customFields.map(cf => <td key={cf.id}>{opp.customFields?.[cf.id] || '-'}</td>)}
                      <td>{opp.owner?.name}</td>
                      <td>{opp.leadSource}</td>
                      <td>
                        <button 
                          onClick={async (e) => {
                             e.stopPropagation();
                             setCallingOppId(opp.id);
                             try {
                               await fetch('/api/calls', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ opportunityId: opp.id, callType: 'Sales Call', ownerId: opp.ownerId })
                               });
                               await fetchModuleA(page);
                               await fetchPendingCalls();
                             } finally {
                               setCallingOppId(null);
                             }
                          }}
                          disabled={callingOppId === opp.id}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: callingOppId === opp.id ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: callingOppId === opp.id ? 0.7 : 1 }}
                        >
                          {callingOppId === opp.id ? 'Scheduling...' : '+ Call'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {opportunities.length === 0 && (
                    <tr><td colSpan={10} style={{textAlign: 'center', padding: '2rem'}}>No opportunities found</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Parent Contact</th>
                    <th>Parent Email</th>
                    <th>School</th>
                    <th>Grade</th>
                    <th>Type</th>
                    <th>Created Source</th>
                    <th>Total Opportunities</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <Link href={`/leads/${lead.id}`} style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 'bold' }}>
                          {lead.studentName || '-'}
                        </Link>
                      </td>
                      <td>{lead.parentContactNumber}</td>
                      <td>{lead.parentEmail || '-'}</td>
                      <td>{lead.school || '-'}</td>
                      <td>{lead.studentGrade || '-'}</td>
                      <td><span className={`badge badge-${lead.leadType.toLowerCase()}`}>{lead.leadType}</span></td>
                      <td>{lead.createdSource}</td>
                      <td>{lead._count?.opportunities || 0}</td>
                      <td>
                        <Link href={`/leads/${lead.id}`} style={{ padding: '0.4rem 0.8rem', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontSize: '0.85rem' }}>
                          Schedule Call &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={8} style={{textAlign: 'center', padding: '2rem'}}>No leads found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-highlight)', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Showing {totalRecords === 0 ? 0 : (page - 1) * 50 + 1}-{Math.min(page * 50, totalRecords)} of {totalRecords} records
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem' }}
                disabled={page <= 1 || loadingA}
                onClick={() => fetchModuleA(page - 1)}
              >
                Prev
              </button>
              
              {/* Page Numbers */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = page - 2 + i;
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        className={`btn ${pageNum === page ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.25rem 0.75rem', background: pageNum === page ? 'var(--accent)' : '' }}
                        onClick={() => fetchModuleA(pageNum)}
                        disabled={loadingA}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <span style={{ color: 'var(--text-secondary)', margin: '0 0.5rem' }}>
                / {totalPages || 1}
              </span>

              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem' }}
                disabled={page >= totalPages || loadingA}
                onClick={() => fetchModuleA(page + 1)}
              >
                Next
              </button>
            </div>
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
            <button className="btn" onClick={handlePasteSearch} disabled={loadingB}>
              {loadingB ? 'Searching...' : 'Parse & Search'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Table Alpha: Matches ({pasteMatches.length})</h3>
              
              {selectedRows.length > 0 && pasteMatches.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-highlight-strong)', borderRadius: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{selectedRows.filter(id => pasteMatches.some((lead: any) => lead.id === id)).length} selected here</span>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
                  <select value={bulkStage} onChange={e => setBulkStage(e.target.value)}>
                    <option value="">Change Stage...</option>
                    {availableStages.map((stage, idx) => (
                      <option key={idx} value={stage}>{stage}</option>
                    ))}
                  </select>
                  <select value={bulkOwner} onChange={e => setBulkOwner(e.target.value)}>
                    <option value="">Change Owner...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <input 
                    placeholder="Type or select Bucket..." 
                    value={bulkBucket}
                    onChange={e => setBulkBucket(e.target.value)}
                    list="bucket-suggestions"
                  />
                  <datalist id="bucket-suggestions">
                    {availableBuckets.map((bucket, idx) => (
                      <option key={idx} value={bucket}>{bucket}</option>
                    ))}
                  </datalist>
                  <input 
                    placeholder="Change Course..." 
                    value={bulkCourse}
                    onChange={e => setBulkCourse(e.target.value)}
                    list="course-suggestions-paste"
                  />
                  <datalist id="course-suggestions-paste">
                    {availableCourses.map((c, i) => <option key={i} value={c} />)}
                  </datalist>
                  <button 
                    className="btn" 
                    onClick={handleBulkCreate} 
                    disabled={bulkLoading || (!bulkStage && !bulkOwner && !bulkCourse && !bulkBucket)}
                  >
                    {bulkLoading ? 'Creating...' : 'Create Opportunities'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={handleBulkDelete} 
                    disabled={bulkDeleteLoading}
                    style={{ marginLeft: 'auto', background: 'var(--danger, #dc3545)', color: 'white' }}
                  >
                    {bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}
                  </button>
                </div>
              )}

              <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
                {pasteMatches.length > 0 ? (
                   <table>
                   <thead>
                     <tr>
                       <th style={{ width: '40px' }}>
                         <input 
                           type="checkbox" 
                           checked={pasteMatches.length > 0 && pasteMatches.every((lead: any) => selectedRows.includes(lead.id))}
                           onChange={toggleAllPasteMatches}
                         />
                       </th>
                       <th>Student</th>
                       <th>Parent Contact</th>
                       <th>School</th>
                       <th>Grade</th>
                     </tr>
                   </thead>
                   <tbody>
                     {pasteMatches.map((lead: any) => (
                       <tr key={lead.id} style={{ background: selectedRows.includes(lead.id) ? '#eff6ff' : 'transparent' }}>
                         <td>
                           <input 
                             type="checkbox"
                             checked={selectedRows.includes(lead.id)}
                             onChange={() => toggleRow(lead.id)}
                           />
                         </td>
                         <td>{lead.studentName || '-'}</td>
                         <td>{lead.parentContactNumber || '-'}</td>
                         <td>{lead.school || '-'}</td>
                         <td>{lead.studentGrade || '-'}</td>
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
                      <li key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
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
