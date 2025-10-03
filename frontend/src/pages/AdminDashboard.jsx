import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Users, DollarSign, Wrench, Calendar,
  Bell, FolderOpen, UserCog, Shield, TrendingUp, LogOut
} from 'lucide-react';

const Card = ({ title, children }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
    <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

function ResidentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [uiMessage, setUiMessage] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', priority: 'medium' });
  const [myComplaints, setMyComplaints] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ category: 'all', search: '' });
  
  const categories = ['Plumbing','Electrical','Carpentry','Cleaning','Security','Parking','Elevator','Common Area','Noise','Other'];
  const priorities = ['low','medium','high','urgent'];
  const documentCategories = [
    'Bylaws',
    'Circulars',
    'Agreements',
    'Meeting Minutes',
    'Financial Reports',
    'Notice',
    'Other'
  ];

  useEffect(() => { 
    if (activeTab === 'complaints') {
      fetchMyComplaints(); 
    }
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [page, filters, activeTab]);

  const Sidebar = () => {
    const menuItems = [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'complaints', label: 'Complaints', icon: Wrench },
      { id: 'amenities', label: 'Amenities', icon: Calendar },
      { id: 'announcements', label: 'Announcements', icon: Bell },
      { id: 'payments', label: 'Payments', icon: DollarSign },
      { id: 'documents', label: 'Documents', icon: FolderOpen },
    ];

    return (
      <div className="sidebar">
        <div className="logo">
          <Home size={32} />
          <span>ApartManager</span>
        </div>
        <nav>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    );
  };

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

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await fetch(`/api/documents?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setDocuments(data.documents || []);
      } else {
        setUiMessage({ type: 'error', message: data.message || 'Failed to fetch documents' });
      }
    } catch (err) {
      setUiMessage({ type: 'error', message: 'Failed to fetch documents' });
    } finally {
      setLoadingDocs(false);
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

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to download document');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setUiMessage({ type: 'success', message: 'Document downloaded successfully' });
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  const ComplaintsContent = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card title="Submit Maintenance Request">
        {uiMessage && (
          <div style={{ 
            marginBottom: 8, 
            padding: '8px 12px', 
            borderRadius: 8, 
            fontSize: 14, 
            background: uiMessage.type === 'success' ? '#d1fae5' : 
                       uiMessage.type === 'error' ? '#fee2e2' : '#dbeafe', 
            color: uiMessage.type === 'success' ? '#065f46' : 
                  uiMessage.type === 'error' ? '#991b1b' : '#1e40af' 
          }}>
            {uiMessage.message}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <label>Title</label>
            <input 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              required 
              style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} 
              placeholder="Short title e.g. Leakage in kitchen" 
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <label>Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              required 
              rows={4} 
              style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }} 
              placeholder="Describe the issue..." 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <label>Category</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})} 
                style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <label>Priority</label>
              <select 
                value={form.priority} 
                onChange={e => setForm({...form, priority: e.target.value})} 
                style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              style={{ 
                background: '#111827', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '10px 14px', 
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Submit Complaint
            </button>
          </div>
        </form>
      </Card>

      <Card title="My Complaints">
        {loading ? (
          <div>Loading complaints...</div>
        ) : myComplaints.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            No complaints submitted yet
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {myComplaints.map(c => (
              <div 
                key={c._id} 
                style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8, 
                  padding: 12, 
                  background: '#fafafa' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{c.title}</strong>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {new Date(c.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  {c.description}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
                  <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>
                    {c.category}
                  </span>
                  <span style={{ 
                    background: c.priority === 'high' || c.priority === 'urgent' ? '#fee2e2' : '#eef2ff', 
                    color: c.priority === 'high' || c.priority === 'urgent' ? '#dc2626' : '#3730a3', 
                    padding: '2px 6px', 
                    borderRadius: 6 
                  }}>
                    {c.priority.toUpperCase()}
                  </span>
                  <span style={{ 
                    background: c.status === 'resolved' ? '#d1fae5' : 
                               c.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
                    color: c.status === 'resolved' ? '#065f46' : 
                          c.status === 'in_progress' ? '#1e40af' : '#6b7280',
                    padding: '2px 6px', 
                    borderRadius: 6 
                  }}>
                    {c.status.replace('_',' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: 6, 
                  border: '1px solid #e5e7eb', 
                  background: '#fff', 
                  cursor: page <= 1 ? 'not-allowed' : 'pointer' 
                }}
              >
                Prev
              </button>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Page {page} of {Math.max(1, Math.ceil(total / limit))}
              </span>
              <button 
                disabled={page >= Math.ceil(total / limit)} 
                onClick={() => setPage(p => p + 1)} 
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: 6, 
                  border: '1px solid #e5e7eb', 
                  background: '#fff', 
                  cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer' 
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const DocumentsContent = () => (
    <Card title="Society Documents">
      {loadingDocs ? (
        <div>Loading documents...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <select 
              value={filters.category}
              onChange={e => setFilters({...filters, category: e.target.value})}
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value="all">All Categories</option>
              {documentCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, flex: 1 }}
            />
          </div>
          
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 20px' }}>
              No documents found
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc._id} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: 8, 
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{getFileIcon(doc.fileType)}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {doc.category} • {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDocument(doc._id, doc.fileName)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );

  const PlaceholderContent = ({ title, description }) => (
    <Card title={title}>
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
        <p>{description}</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>This feature is coming soon</p>
      </div>
    </Card>
  );

  return (
    <>
      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 260px;
          height: 100vh;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 100;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 32px;
          padding: 0 8px;
        }
        
        nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: #94a3b8;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          text-align: left;
          width: 100%;
        }
        
        .menu-item:hover { background: rgba(255,255,255,0.1); color: white; }
        .menu-item.active { background: #3b82f6; color: white; }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #ef4444;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          margin-top: 16px;
        }
        
        .logout-btn:hover { background: rgba(239,68,68,0.1); }
        
        .main-content {
          margin-left: 260px;
          min-height: 100vh;
          background: #f8fafc;
          padding: 32px;
        }
        
        .content-section { max-width: 1200px; margin: 0 auto; }
        
        h2 {
          font-size: 28px;
          color: #0f172a;
          font-weight: 700;
          margin-bottom: 24px;
        }
        
        @media (max-width: 768px) {
          .sidebar { width: 200px; }
          .main-content { margin-left: 200px; padding: 20px; }
        }
      `}</style>
      
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-content">
          <div className="content-section">
            <h2>Resident Dashboard</h2>
            
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ComplaintsContent />
                <Card title="Quick Actions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button 
                      onClick={() => setActiveTab('complaints')}
                      style={{
                        padding: '12px 16px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <strong>Submit Complaint</strong>
                      <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Report maintenance issues</div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('documents')}
                      style={{
                        padding: '12px 16px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <strong>View Documents</strong>
                      <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Access society documents</div>
                    </button>
                  </div>
                </Card>
              </div>
            )}
            {activeTab === 'complaints' && <ComplaintsContent />}
            {activeTab === 'documents' && <DocumentsContent />}
            {activeTab === 'amenities' && (
              <PlaceholderContent 
                title="Amenity Bookings" 
                description="Book community amenities like swimming pool, gym, clubhouse, etc." 
              />
            )}
            {activeTab === 'announcements' && (
              <PlaceholderContent 
                title="Announcements" 
                description="View latest community notices and updates from management" 
              />
            )}
            {activeTab === 'payments' && (
              <PlaceholderContent 
                title="Payments & Invoices" 
                description="View your dues, payment history, and download invoices" 
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResidentDashboard;