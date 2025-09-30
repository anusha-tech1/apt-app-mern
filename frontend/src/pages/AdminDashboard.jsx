import React, { useEffect, useState } from 'react';
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
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'resident', permissions: [] });
  const [uiMessage, setUiMessage] = useState(null);

  const availablePermissions = ['member_management', 'announcements', 'reports'];

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      // Prepare editable row state
      const hydrated = data.users.map(u => ({ ...u, _editRole: u.role, _editPerms: u.permissions || [] }));
      setUsers(hydrated);
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUiMessage({ type: 'loading', message: 'Creating user...' });
    try {
      const body = { ...createForm };
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setUiMessage({ type: 'success', message: 'User created' });
      setCreateForm({ name: '', email: '', password: '', role: 'resident', permissions: [] });
      fetchUsers();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const toggleRowPermission = (userId, perm) => {
    setUsers(prev => prev.map(u => {
      if (u._id !== userId) return u;
      const curr = new Set(u._editPerms || []);
      if (curr.has(perm)) curr.delete(perm); else curr.add(perm);
      return { ...u, _editPerms: Array.from(curr) };
    }));
  };

  const saveUserEdits = async (u) => {
    try {
      const res = await fetch(`/api/users/${u._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: u._editRole, permissions: u._editPerms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');
      setUiMessage({ type: 'success', message: 'User updated' });
      fetchUsers();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle-active`, { method: 'PATCH', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle');
      setUiMessage({ type: 'success', message: data.message || 'Toggled' });
      fetchUsers();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      setUiMessage({ type: 'success', message: 'User deleted' });
      fetchUsers();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
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
          <div style={{ display: 'grid', gap: 16 }}>
            <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input value={createForm.name} onChange={e=>setCreateForm(f=>({...f, name:e.target.value}))} placeholder="Name" required style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }} />
                <input value={createForm.email} onChange={e=>setCreateForm(f=>({...f, email:e.target.value}))} type="email" placeholder="Email" required style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }} />
                <input value={createForm.password} onChange={e=>setCreateForm(f=>({...f, password:e.target.value}))} type="password" placeholder="Password" required style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }} />
                <select value={createForm.role} onChange={e=>setCreateForm(f=>({...f, role:e.target.value}))} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}>
                  <option value="admin">admin</option>
                  <option value="committee_member">committee_member</option>
                  <option value="resident">resident</option>
                  <option value="staff">staff</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {availablePermissions.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={createForm.permissions.includes(p)} onChange={() => {
                      setCreateForm(f=>{
                        const set=new Set(f.permissions);
                        if(set.has(p)) set.delete(p); else set.add(p);
                        return { ...f, permissions: Array.from(set) };
                      })
                    }} /> {p}
                  </label>
                ))}
              </div>
              <div>
                <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>Create User</button>
              </div>
            </form>

            {uiMessage && (
              <div style={{ fontSize: 14, color: uiMessage.type === 'error' ? '#dc2626' : uiMessage.type === 'success' ? '#065f46' : '#374151' }}>
                {uiMessage.message}
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              {loadingUsers ? (
                <div>Loading users...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Permissions</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Active</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{u.name}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{u.email}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                          <select value={u._editRole} onChange={e=>setUsers(prev=>prev.map(x=>x._id===u._id?{...x,_editRole:e.target.value}:x))} style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
                            <option value="admin">admin</option>
                            <option value="committee_member">committee_member</option>
                            <option value="resident">resident</option>
                            <option value="staff">staff</option>
                          </select>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {availablePermissions.map(p => (
                              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: '#f3f4f6', padding: '4px 8px', borderRadius: 999 }}>
                                <input type="checkbox" checked={u._editPerms?.includes(p)} onChange={()=>toggleRowPermission(u._id, p)} /> {p}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{ color: u.isActive ? '#065f46' : '#dc2626', fontWeight: 600 }}>{u.isActive ? 'Yes' : 'No'}</span>
                        </td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                          <button onClick={()=>saveUserEdits(u)} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Save</button>
                          <button onClick={()=>toggleActive(u._id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>{u.isActive ? 'Disable' : 'Enable'}</button>
                          <button onClick={()=>deleteUser(u._id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
