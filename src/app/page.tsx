'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogCallModal from '@/components/LogCallModal';
import AnalyticsTab from '@/components/AnalyticsTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'pendingCalls' | 'moduleA' | 'moduleB' | 'analytics'>('pendingCalls');

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
  const [schedulingCallFor, setSchedulingCallFor] = useState<any>(null);
  const [newCallDate, setNewCallDate] = useState('');
  const [newCallType, setNewCallType] = useState('Sales Call');
  const [activeCallForModal, setActiveCallForModal] = useState<any>(null);
  const [pendingCallOwnerFilter, setPendingCallOwnerFilter] = useState('');

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

  // --- User Identity State ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [selectedIdentityId, setSelectedIdentityId] = useState('');

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

      // Check local session
      const storedId = localStorage.getItem('crm_current_user');
      if (storedId) {
        const user = usersData.find((u: any) => u.id === storedId);
        if (user) {
          setCurrentUser(user);
          setPendingCallOwnerFilter(user.id);
          setFilterOwner(user.id);
        }
      } else {
        setShowIdentityModal(true);
      }
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

    // Aggressively poll pending calls to bypass Next.js aggressive client-side router caching
    const interval = setInterval(() => {
      fetchPendingCalls(false); // pass false to avoid loading spinner
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchPendingCalls = async (showLoader = true) => {
    if (showLoader) setLoadingCalls(true);
    try {
      const res = await fetch('/api/calls/pending?t=' + Date.now());
      const data = await res.json();
      setPendingCalls(data.calls || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setLoadingCalls(false);
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

  const saveIdentity = () => {
    if (!selectedIdentityId) {
      localStorage.removeItem('crm_current_user');
      setCurrentUser(null);
      setPendingCallOwnerFilter('');
      setFilterOwner('');
    } else {
      localStorage.setItem('crm_current_user', selectedIdentityId);
      const user = users.find(u => u.id === selectedIdentityId);
      setCurrentUser(user);
      setPendingCallOwnerFilter(user.id);
      setFilterOwner(user.id);
    }
    setShowIdentityModal(false);
  };

  const clearIdentity = () => {
    localStorage.removeItem('crm_current_user');
    setCurrentUser(null);
    setPendingCallOwnerFilter('');
    setFilterOwner('');
    setSelectedIdentityId('');
  };

  return (
    <>
      {showIdentityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '440px', width: '100%', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', fontWeight: '800', margin: '0 auto 1rem' }}>E</div>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Welcome to EduCRM</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>Select your identity to personalise your view</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <select 
                value={selectedIdentityId} 
                onChange={e => setSelectedIdentityId(e.target.value)}
                style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
              >
                <option value="">— Select your name —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowIdentityModal(false)}>Skip for now</button>
              <button className="btn" style={{ flex: 2 }} onClick={saveIdentity}>Confirm Identity</button>
            </div>
          </div>
        </div>
      )}

      {schedulingCallFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '100%', background: 'var(--bg-secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Schedule Call for {schedulingCallFor.lead?.studentName || 'Student'}</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Call Type</label>
              <select value={newCallType} onChange={e => setNewCallType(e.target.value)}>
                <option value="Sales Call">Sales Call</option>
                <option value="Assessment Call">Assessment Call</option>
                <option value="Payment Confirmation Call">Payment Confirmation Call</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Scheduled Date & Time *</label>
              <input 
                type="datetime-local" 
                value={newCallDate} 
                onChange={e => setNewCallDate(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setSchedulingCallFor(null)}
              >
                Cancel
              </button>
              <button 
                className="btn"
                disabled={!newCallDate || callingOppId === schedulingCallFor.id}
                onClick={async () => {
                  setCallingOppId(schedulingCallFor.id);
                  try {
                    await fetch('/api/calls', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        opportunityId: schedulingCallFor.id, 
                        callType: newCallType, 
                        ownerId: schedulingCallFor.ownerId,
                        scheduledDate: newCallDate
                      })
                    });
                    setSchedulingCallFor(null);
                    setNewCallDate('');
                    fetchModuleA(page);
                    fetchPendingCalls();
                  } finally {
                    setCallingOppId(null);
                  }
                }}
              >
                {callingOppId === schedulingCallFor.id ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Sales Dashboard</h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage leads, calls, and pipeline performance</p>
        </div>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', background: 'var(--accent-light)', borderRadius: '9999px', border: '1px solid var(--accent-subtle)', fontSize: '0.875rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>Viewing as</span>
            <strong style={{ color: 'var(--accent-primary)' }}>{currentUser.name}</strong>
            <button onClick={() => setShowIdentityModal(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.25rem', textDecoration: 'underline' }}>Change</button>
          </div>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div className="glass-panel" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 1rem' }}>
          <button className={`tab-item ${activeTab === 'pendingCalls' ? 'active' : ''}`} onClick={() => setActiveTab('pendingCalls')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41a2 2 0 0 1 1.98-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.12 6.12l1.88-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Pending Calls
            {pendingCalls.length > 0 && <span className="tab-badge">{pendingCalls.length}</span>}
          </button>
          <button className={`tab-item ${activeTab === 'moduleA' ? 'active' : ''}`} onClick={() => setActiveTab('moduleA')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Data View
          </button>
          <button className={`tab-item ${activeTab === 'moduleB' ? 'active' : ''}`} onClick={() => setActiveTab('moduleB')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Paste-to-Search
          </button>
          <button className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <AnalyticsTab />
      )}

      {activeTab === 'pendingCalls' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {/* Banner */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
            background: pendingCalls.length > 0
              ? 'linear-gradient(135deg, rgba(220,38,38,0.05) 0%, rgba(220,38,38,0.02) 100%)'
              : 'var(--bg-highlight)',
            borderLeft: `4px solid ${pendingCalls.length > 0 ? 'var(--danger)' : 'var(--glass-border)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {pendingCalls.length > 0 ? (
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: pendingCalls.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {pendingCalls.length > 0 ? `${pendingCalls.length} Call${pendingCalls.length > 1 ? 's' : ''} Need Attention` : 'All Clear — No Pending Calls'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {pendingCalls.length > 0 ? 'Log these calls to keep your pipeline up to date' : 'No overdue or pending calls at this time'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filter owner:</label>
              <select value={pendingCallOwnerFilter} onChange={e => setPendingCallOwnerFilter(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
                <option value="">All Owners</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {loadingCalls && pendingCalls.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : pendingCalls.filter(c => !pendingCallOwnerFilter || c.ownerId === pendingCallOwnerFilter).length > 0 ? (
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Call Type</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Owner</th>
                    <th>Scheduled Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCalls.filter(c => !pendingCallOwnerFilter || c.ownerId === pendingCallOwnerFilter).map(c => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41a2 2 0 0 1 1.98-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.12 6.12l1.88-1.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          {c.callType}
                        </span>
                      </td>
                      <td>
                        <Link href={`/leads/${c.opportunity?.leadId}`} style={{ textDecoration: 'none', color: 'var(--accent-primary)', fontWeight: 500 }}>
                          {c.opportunity?.lead?.studentName || 'Unknown'}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.opportunity?.courseName || '—'}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                            {(c.owner?.name || '?')[0]}
                          </div>
                          {c.owner?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--danger)', fontWeight: 500, fontSize: '0.85rem' }}>
                          {new Date(c.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          &nbsp;<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{new Date(c.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          onClick={() => setActiveCallForModal(c)}
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                        >
                          Log Call
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No pending calls match your current filter.</p>
            </div>
          )}
        </div>
      )}

      {activeCallForModal && (
        <LogCallModal
          activeCall={activeCallForModal}
          onCancel={() => setActiveCallForModal(null)}
          onSuccess={() => {
            setActiveCallForModal(null);
            fetchPendingCalls();
            fetchModuleA();
          }}
        />
      )}

      {activeTab === 'moduleA' && (
        <div>
          {/* Main Controls Row */}
          <div className="glass-panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="btn btn-secondary" style={{ width: 'auto', minWidth: '170px', padding: '0.5rem 0.875rem' }} value={viewMode} onChange={e => setViewMode(e.target.value as any)}>
              <option value="leads">👤 Unique Leads</option>
              <option value="opportunities">🎯 Opportunities</option>
            </select>
            <button className="btn btn-secondary" onClick={() => setSortOrder(sortOrder === 'newest' ? 'az' : 'newest')} style={{ gap: '0.4rem', width: 'auto' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              {sortOrder === 'newest' ? 'Newest First' : 'A → Z'}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setShowCustomFilters(!showCustomFilters)} style={{ gap: '0.4rem', width: 'auto' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                {showCustomFilters ? 'Hide Filters' : 'More Filters'}
              </button>
              <button className="btn" onClick={() => fetchModuleA(1)} disabled={loadingA} style={{ width: 'auto', gap: '0.4rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {loadingA ? 'Searching…' : 'Search'}
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadCSV} disabled={opportunities.length === 0} style={{ width: 'auto', gap: '0.4rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Quick Filters Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search student name…" value={filterStudentName} onChange={e => setFilterStudentName(e.target.value)} list="student-suggestions" style={{ paddingLeft: '2.25rem' }} />
              <datalist id="student-suggestions">{availableStudents.map((s, i) => <option key={i} value={s} />)}</datalist>
            </div>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <input placeholder="Search course name…" value={filterCourseName} onChange={e => setFilterCourseName(e.target.value)} list="course-suggestions" style={{ paddingLeft: '2.25rem' }} />
              <datalist id="course-suggestions">{availableCourses.map((c, i) => <option key={i} value={c} />)}</datalist>
            </div>
            <select value={filterBucket} onChange={e => setFilterBucket(e.target.value)}>
              <option value="">All Buckets</option>
              {availableBuckets.map((bucket, idx) => <option key={idx} value={bucket}>{bucket}</option>)}
            </select>
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

          {/* Record Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {totalRecords.toLocaleString()} {viewMode === 'opportunities' ? 'Opportunities' : 'Leads'}
              {selectedRows.length > 0 && <span style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem' }}>· {selectedRows.length} selected</span>}
            </span>
            {loadingA && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refreshing…</span>}
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)', padding: 0 }}>
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
                      <td>{opp.bucket || '-'}</td>
                      <td>{opp.remarks || '-'}</td>
                      {customFields.map(cf => <td key={cf.id}>{opp.customFields?.[cf.id] || '-'}</td>)}
                      <td>{opp.owner?.name}</td>
                      <td>{opp.leadSource}</td>
                      <td>
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setSchedulingCallFor(opp);
                          }}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          + Call
                        </button>
                      </td>
                    </tr>
                  ))}
                  {opportunities.length === 0 && !loadingA && (
                    <tr><td colSpan={10} style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>No opportunities found matching your filters</td></tr>
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
                  {leads.length === 0 && !loadingA && (
                    <tr><td colSpan={8} style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>No leads found matching your filters</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div style={{ padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '0.75rem', background: '#fafbfc', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{totalRecords === 0 ? 0 : (page - 1) * 50 + 1}–{Math.min(page * 50, totalRecords)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalRecords.toLocaleString()}</strong>
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem', width: 'auto' }} disabled={page <= 1 || loadingA} onClick={() => fetchModuleA(page - 1)}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page - 2 + i;
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button key={pageNum} onClick={() => fetchModuleA(pageNum)} disabled={loadingA}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', borderRadius: 'var(--radius-sm)', border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: pageNum === page ? 700 : 400, background: pageNum === page ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: pageNum === page ? 'white' : 'var(--text-secondary)', borderColor: pageNum === page ? 'var(--accent-primary)' : 'var(--glass-border)', transition: 'var(--transition)' }}
                    >{pageNum}</button>
                  );
                }
                return null;
              })}
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem', width: 'auto' }} disabled={page >= totalPages || loadingA} onClick={() => fetchModuleA(page + 1)}>
                Next →
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Matched Leads <span style={{ color: 'var(--success)' }}>({pasteMatches.length})</span></h3>
              </div>
              
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

              <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Unmatched <span style={{ color: 'var(--danger)' }}>({pasteOrphans.length})</span></h3>
              </div>
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
    </>
  );
}
