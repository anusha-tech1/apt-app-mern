import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const SectionCard = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

const getCurrentUser = () => {
  const saved = localStorage.getItem('user');
  if (!saved) return null;
  try { return JSON.parse(saved); } catch { return null; }
};

function CommitteeDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(), []);
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const MODULES = [
    {
      key: 'member_management',
      title: 'Member Management',
      content: (
        <ul>
          <li>View residents</li>
          <li>View/approve requests</li>
        </ul>
      ),
    },
    {
      key: 'announcements',
      title: 'Announcements',
      content: (
        <ul>
          <li>Create/update notices (if permitted)</li>
          <li>Track announcement history</li>
        </ul>
      ),
    },
    {
      key: 'reports',
      title: 'Reports',
      content: (
        <ul>
          <li>View maintenance, security and housekeeping reports</li>
        </ul>
      ),
    },
  ];

  const visibleModules = MODULES.filter(m => permissions.includes(m.key));

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ background: '#1f2937', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Committee Dashboard</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 13 }}>Access is limited to modules assigned by Admin</p>
        </div>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
        {visibleModules.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <p style={{ margin: 0, color: '#6b7280' }}>No modules assigned. Please contact an administrator.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {visibleModules.map(mod => (
              <SectionCard key={mod.key} title={`${mod.title} (Assigned)`}>
                {mod.content}
              </SectionCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default CommitteeDashboard;
