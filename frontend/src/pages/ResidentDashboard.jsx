import React from 'react';
import { useNavigate } from 'react-router-dom';

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

function ResidentDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Resident Dashboard</h2>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="My Requests">
          <ul>
            <li>Submit maintenance request</li>
            <li>Track status</li>
          </ul>
        </Card>

        <Card title="Announcements">
          <ul>
            <li>View latest community notices</li>
          </ul>
        </Card>

        <Card title="Payments">
          <ul>
            <li>View dues and payment history</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}

export default ResidentDashboard;
