import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SectionCard = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

function AdminDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState({ member_management: false, announcements: false, reports: false });
  const [status, setStatus] = useState(null);

  const toggle = (key) => setPerms(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Updating permissions...' });
    try {
      const body = {
        email: email.trim(),
        permissions: Object.entries(perms).filter(([, v]) => v).map(([k]) => k),
      };
      const res = await fetch('/api/users/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setStatus({ type: 'success', message: 'Permissions updated' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Permissions Management (Committee Members)">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>Committee Member Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="user@example.com" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>Assign Modules</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={perms.member_management} onChange={() => toggle('member_management')} /> Member Management
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={perms.announcements} onChange={() => toggle('announcements')} /> Announcements
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={perms.reports} onChange={() => toggle('reports')} /> Reports
                </label>
              </div>
            </div>
            <div>
              <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>Update Permissions</button>
            </div>
            {status && (
              <div style={{ fontSize: 14, color: status.type === 'error' ? '#dc2626' : status.type === 'success' ? '#065f46' : '#374151' }}>
                {status.message}
              </div>
            )}
          </form>
        </SectionCard>

        <SectionCard title="User Management">
          <ul>
            <li>Create, edit, disable users</li>
            <li>Assign roles and committee permissions</li>
          </ul>
        </SectionCard>

        <SectionCard title="Committee Controls">
          <ul>
            <li>Define accessible modules for committee members</li>
            <li>Review committee actions</li>
          </ul>
        </SectionCard>

        <SectionCard title="Security & Housekeeping">
          <ul>
            <li>Configure security checkpoints</li>
            <li>Set housekeeping schedules and tasks</li>
          </ul>
        </SectionCard>

        <SectionCard title="Announcements & Notices">
          <ul>
            <li>Post community-wide notices</li>
            <li>Schedule announcements</li>
          </ul>
        </SectionCard>
      </main>
    </div>
  );
}

export default AdminDashboard;
