import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const ChartCard = ({ title, children, width = '100%' }) => (
  <div style={{ 
    background: 'linear-gradient(to bottom, #ffffff, #fafafa)', 
    border: '1px solid #e5e7eb', 
    borderRadius: 16, 
    padding: 24, 
    width,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.3s ease',
  }}>
    <h3 style={{ 
      margin: 0, 
      marginBottom: 20, 
      fontSize: 18, 
      fontWeight: 600,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }}>{title}</h3>
    {children}
  </div>
);

const StatCard = ({ title, value, change, icon }) => (
  <div style={{ 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16, 
    padding: 20, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '150px',
      height: '150px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '50%',
      transform: 'translate(50%, -50%)'
    }}></div>
    <div style={{ 
      width: 56, 
      height: 56, 
      borderRadius: 12, 
      background: 'rgba(255, 255, 255, 0.2)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: 24,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1
    }}>{icon}</div>
    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0', color: '#ffffff' }}>{value ?? 0}</div>
      {typeof change === 'number' && (
        <div style={{ 
          fontSize: 13, 
          color: 'rgba(255, 255, 255, 0.95)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ fontSize: 16 }}>{change > 0 ? '↑' : '↓'}</span>
          {Math.abs(change)}% from last period
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              border: 'none', 
              borderRadius: 8, 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
            }} 
          />
          <Legend />
          <Bar dataKey="total_visitors" fill="#6366f1" name="Visitors" radius={[8, 8, 0, 0]} />
          <Bar dataKey="total_cabs" fill="#10b981" name="Cabs" radius={[8, 8, 0, 0]} />
          <Bar dataKey="total_deliveries" fill="#f59e0b" name="Deliveries" radius={[8, 8, 0, 0]} />
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
            <Pie 
              data={distributionData} 
              cx="50%" 
              cy="50%" 
              labelLine={false} 
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
              outerRadius={80} 
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {distributionData.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: 8, 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
              }} 
            />
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
    <div style={{ 
      padding: 32, 
      background: 'linear-gradient(to bottom right, #f8fafc, #e0e7ff)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32 
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 32, 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => handleExport('csv')} 
            style={{ 
              padding: '10px 20px', 
              border: '2px solid #6366f1', 
              borderRadius: 8, 
              background: '#fff', 
              cursor: 'pointer',
              fontWeight: 600,
              color: '#6366f1',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6366f1';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#6366f1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
          >Export CSV</button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 32, 
        alignItems: 'center',
        background: '#fff',
        padding: 20,
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <label style={{ fontSize: 14, marginRight: 8, fontWeight: 600, color: '#374151' }}>From:</label>
          <input 
            type="date" 
            value={dateRange.startDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} 
            style={{ 
              padding: '10px 14px', 
              border: '2px solid #e5e7eb', 
              borderRadius: 8,
              fontSize: 14,
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>
        <div>
          <label style={{ fontSize: 14, marginRight: 8, fontWeight: 600, color: '#374151' }}>To:</label>
          <input 
            type="date" 
            value={dateRange.endDate} 
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} 
            style={{ 
              padding: '10px 14px', 
              border: '2px solid #e5e7eb', 
              borderRadius: 8,
              fontSize: 14,
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>
        <button 
          onClick={fetchAnalyticsData} 
          style={{ 
            padding: '10px 24px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(102, 126, 234, 0.3)';
          }}
        >Apply</button>
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 60, 
          fontSize: 18, 
          color: '#6b7280',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>Loading analytics data...</div>
      ) : (
        <div style={{ display: 'grid', gap: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <StatCard title="Total Visitors" value={analyticsData.summary.total_visitors} icon="👥" />
            <StatCard title="Total Cabs" value={analyticsData.summary.total_cabs} icon="🚕" />
            <StatCard title="Total Deliveries" value={analyticsData.summary.total_deliveries} icon="📦" />
            <StatCard title="Average Visitors/Day" value={Math.round(analyticsData.summary.avg_visitors_per_day || 0)} icon="📊" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
            <DailyTrendsChart />
            <CategoryDistribution />
          </div>
        </div>
      )}
    </div>
  );
}