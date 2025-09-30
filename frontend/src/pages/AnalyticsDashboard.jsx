import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ChartCard = ({ title, children, width = '100%' }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, width }}>
    <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16 }}>{title}</h3>
    {children}
  </div>
);

const StatCard = ({ title, value, change, icon }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 14, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', margin: '4px 0' }}>{value ?? 0}</div>
      {typeof change === 'number' && (
        <div style={{ fontSize: 12, color: change > 0 ? '#10b981' : '#ef4444' }}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
        </div>
      )}
    </div>
  </div>
);

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [analyticsData, setAnalyticsData] = useState({ daily: [], summary: {} });
  const [loading, setLoading] = useState(false);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [dailyRes, summaryRes] = await Promise.all([
        fetch(`/api/analytics/daily?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, { credentials: 'include' }),
        fetch(`/api/analytics/summary/overview?period=30`, { credentials: 'include' }),
      ]);
      const daily = await dailyRes.json();
      const summary = await summaryRes.json();
      setAnalyticsData({ daily, summary });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalyticsData(); }, []);

  const DailyTrendsChart = () => (
    <ChartCard title="Daily Trends">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={analyticsData.daily}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_visitors" fill="#0088FE" name="Visitors" />
          <Bar dataKey="total_cabs" fill="#00C49F" name="Cabs" />
          <Bar dataKey="total_deliveries" fill="#FFBB28" name="Deliveries" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );

  const CategoryDistribution = () => {
    const distributionData = [
      { name: 'Visitors', value: analyticsData.summary.total_visitors || 0 },
      { name: 'Cabs', value: analyticsData.summary.total_cabs || 0 },
      { name: 'Deliveries', value: analyticsData.summary.total_deliveries || 0 },
    ];
    return (
      <ChartCard title="Category Distribution">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={distributionData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
              {distributionData.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/analytics/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('csv')} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: 14, marginRight: 8 }}>From:</label>
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>
        <div>
          <label style={{ fontSize: 14, marginRight: 8 }}>To:</label>
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }} />
        </div>
        <button onClick={fetchAnalyticsData} style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Apply</button>
      </div>

      {loading ? (
        <div>Loading analytics data...</div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <StatCard title="Total Visitors" value={analyticsData.summary.total_visitors} icon="👥" />
            <StatCard title="Total Cabs" value={analyticsData.summary.total_cabs} icon="🚕" />
            <StatCard title="Total Deliveries" value={analyticsData.summary.total_deliveries} icon="📦" />
            <StatCard title="Average Visitors/Day" value={Math.round(analyticsData.summary.avg_visitors_per_day || 0)} icon="📊" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <DailyTrendsChart />
            <CategoryDistribution />
          </div>
        </div>
      )}
    </div>
  );
}
