import React, { useEffect, useState } from 'react';
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
  const [uiMessage, setUiMessage] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchAssigned(); }, [statusFilter, page]);

  const fetchAssigned = async () => {
    setLoadingAssigned(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/complaints/assigned?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setAssigned(data.complaints || []);
        setTotal(data.total || 0);
      } else {
        setUiMessage({ type: 'error', message: data.error || 'Failed to load assigned complaints' });
      }
    } catch (_) {
      setUiMessage({ type: 'error', message: 'Failed to load assigned complaints' });
    } finally {
      setLoadingAssigned(false);
    }
  };

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

      <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <Card title="Assigned Complaints">
          {uiMessage && (
            <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, background: uiMessage.type==='success'?'#d1fae5':uiMessage.type==='error'?'#fee2e2':'#dbeafe', color: uiMessage.type==='success'?'#065f46':uiMessage.type==='error'?'#991b1b':'#1e40af' }}>
              {uiMessage.message}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14 }}>Status:</label>
              <select value={statusFilter} onChange={e=>{ setPage(1); setStatusFilter(e.target.value); }} style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button onClick={()=>fetchAssigned()} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Refresh</button>
          </div>
          {loadingAssigned ? (
            <div>Loading...</div>
          ) : assigned.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No assigned complaints</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {assigned.map(c => (
                <div key={c._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{c.title}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(c.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12, flexWrap: 'wrap' }}>
                    <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>Unit {c.unit_number}</span>
                    <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{c.category}</span>
                    <span style={{ background: '#eef2ff', color: '#3730a3', padding: '2px 6px', borderRadius: 6 }}>{c.priority.toUpperCase()}</span>
                    <span style={{ background: '#ecfeff', color: '#155e75', padding: '2px 6px', borderRadius: 6 }}>{c.status.replace('_',' ').toUpperCase()}</span>
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 6 }}>Resident: {c.resident_name}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page<=1?'not-allowed':'pointer' }}>Prev</button>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Page {page} of {Math.max(1, Math.ceil(total/limit))}</span>
                <button disabled={page>=Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page>=Math.ceil(total/limit)?'not-allowed':'pointer' }}>Next</button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default StaffDashboard;
