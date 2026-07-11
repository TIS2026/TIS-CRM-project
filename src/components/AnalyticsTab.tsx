'use client';
import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300'];

export default function AnalyticsTab() {
  // Default to Last 30 Days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Date Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, marginRight: 'auto', fontWeight: 600 }}>Analytics & Reporting</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>From:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>To:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
        </div>
      </div>

      {loading && <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Updating...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. Pipeline Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Opportunity Pipeline (By Stage)</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipeline}>
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                <Bar dataKey="value" fill="#8884d8">
                  {data.pipeline.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Call Outcomes */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Call Outcomes</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.callOutcomes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {data.callOutcomes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Team Performance */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Team Performance</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Total Opps</th>
                <th>Won Opps</th>
                <th>Win Rate</th>
                <th>Calls Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.teamPerformance.map((u: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.totalOpps}</td>
                  <td style={{ color: 'var(--success)' }}>{u.wonOpps}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '100px', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                        <div style={{ width: `${Math.min(100, u.winRate)}%`, background: 'var(--success)', height: '100%', borderRadius: '4px' }}></div>
                      </div>
                      {u.winRate}%
                    </div>
                  </td>
                  <td>{u.totalCalls}</td>
                </tr>
              ))}
              {data.teamPerformance.length === 0 && (
                <tr><td colSpan={5} style={{textAlign: 'center'}}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* 4. Lead Sources */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Top Lead Sources</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sources} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={200} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                <Legend />
                <Bar dataKey="won" name="Won Opps" stackId="a" fill="#00C49F" />
                <Bar dataKey="other" name="Lost/Open Opps" stackId="a" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Bucket Effectiveness */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Bucket Conversion Rates</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.buckets} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis stroke="#888" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="total" name="Total Opps" fill="#FFBB28" />
                <Bar dataKey="won" name="Won Opps" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
