import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Segmented = ({ value, onChange, options }) => (
  <div style={{ display: 'inline-flex', background: '#e5e7eb', borderRadius: 8, padding: 4 }}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          background: value === opt.value ? '#111827' : 'transparent',
          color: value === opt.value ? '#fff' : '#111827',
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

function StaffDashboard() {
  const navigate = useNavigate();
  const [roleType, setRoleType] = useState('security');

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Staff Dashboard</h2>
        <Segmented
          value={roleType}
          onChange={setRoleType}
          options={[
            { value: 'security', label: 'Security' },
            { value: 'housekeeping', label: 'Housekeeping' },
          ]}
        />
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      {roleType === 'security' && (
        <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Gate Entries">
            <ul>
              <li>Log visitor entries with purpose and flat no.</li>
              <li>Record vehicle entry/exit</li>
            </ul>
          </Card>
          <Card title="Incidents">
            <ul>
              <li>Report an incident with photo/note</li>
              <li>Notify committee/admin</li>
            </ul>
          </Card>
          <Card title="Deliveries">
            <ul>
              <li>Record package received</li>
              <li>Notify resident</li>
            </ul>
          </Card>
        </main>
      )}

      {roleType === 'housekeeping' && (
        <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Tasks">
            <ul>
              <li>View daily assigned cleaning tasks</li>
              <li>Mark tasks as completed</li>
            </ul>
          </Card>
          <Card title="Maintenance">
            <ul>
              <li>Report issues found during rounds</li>
              <li>Attach photos and location</li>
            </ul>
          </Card>
          <Card title="Schedules">
            <ul>
              <li>View shift schedule</li>
              <li>Swap/Request changes</li>
            </ul>
          </Card>
        </main>
      )}
    </div>
  );
}

export default StaffDashboard;
