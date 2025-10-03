import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

function ResidentDashboard() {
  const navigate = useNavigate();
  const [uiMessage, setUiMessage] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', priority: 'medium' });
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const categories = ['Plumbing','Electrical','Carpentry','Cleaning','Security','Parking','Elevator','Common Area','Noise','Other'];
  const priorities = ['low','medium','high','urgent'];

  useEffect(() => { fetchMyComplaints(); }, [page]);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/my?page=${page}&limit=${limit}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMyComplaints(data.complaints || []);
        setTotal(data.total || 0);
      } else {
        setUiMessage({ type: 'error', message: data.error || 'Failed to load complaints' });
      }
    } catch (_) {
      setUiMessage({ type: 'error', message: 'Failed to load complaints' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiMessage({ type: 'loading', message: 'Submitting complaint...' });
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');
      setUiMessage({ type: 'success', message: 'Complaint submitted successfully' });
      setForm({ title: '', description: '', category: 'Other', priority: 'medium' });
      setPage(1);
      fetchMyComplaints();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
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
      <header style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Resident Dashboard</h2>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Submit Maintenance Request">
          {uiMessage && (
            <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, background: uiMessage.type==='success'?'#d1fae5':uiMessage.type==='error'?'#fee2e2':'#dbeafe', color: uiMessage.type==='success'?'#065f46':uiMessage.type==='error'?'#991b1b':'#1e40af' }}>
              {uiMessage.message}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <label>Title</label>
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} placeholder="Short title e.g. Leakage in kitchen" />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required rows={4} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} placeholder="Describe the issue..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <label>Category</label>
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  {categories.map(c=>(<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <label>Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})} style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  {priorities.map(p=>(<option key={p} value={p}>{p.toUpperCase()}</option>))}
                </select>
              </div>
            </div>
            <div>
              <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>Submit</button>
            </div>
          </form>
        </Card>

        <Card title="My Complaints">
          {loading ? (
            <div>Loading...</div>
          ) : myComplaints.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No complaints yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {myComplaints.map(c => (
                <div key={c._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{c.title}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(c.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
                    <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{c.category}</span>
                    <span style={{ background: '#eef2ff', color: '#3730a3', padding: '2px 6px', borderRadius: 6 }}>{c.priority.toUpperCase()}</span>
                    <span style={{ background: '#ecfeff', color: '#155e75', padding: '2px 6px', borderRadius: 6 }}>{c.status.replace('_',' ').toUpperCase()}</span>
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
