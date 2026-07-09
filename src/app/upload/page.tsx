'use client';
import { useState, useRef } from 'react';
import Papa from 'papaparse';

export default function BulkUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ processed?: number, exceptions?: any[], error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results.data),
          });
          const data = await response.json();
          setResult(data);
        } catch (error: any) {
          setResult({ error: error.message || 'An unknown error occurred during upload.' });
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        setResult({ error: error.message });
        setLoading(false);
      }
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Bulk Upload Leads & Opportunities</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Upload a CSV file containing columns: Parent Contact Number, Student Name, Course Name, Stage, etc.
        </p>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={loading}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button 
          className="btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Select CSV File'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '2rem' }}>
          {result.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error: {result.error}</div>}
          
          {result.processed !== undefined && (
            <div style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '1.2rem' }}>
              Successfully processed: {result.processed} records.
            </div>
          )}

          {result.exceptions && result.exceptions.length > 0 && (
            <div>
              <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Exceptions / Skipped Rows ({result.exceptions.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Row Data snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.exceptions.map((ex, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--danger)' }}>{ex.reason}</td>
                        <td>
                          <pre style={{ margin: 0, fontSize: '0.8rem', background: 'transparent' }}>
                            {JSON.stringify(ex.row).substring(0, 100)}...
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
