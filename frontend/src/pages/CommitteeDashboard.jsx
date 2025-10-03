import React, { useMemo, useEffect, useState } from 'react';
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

  const [uiMessage, setUiMessage] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docFilters, setDocFilters] = useState({ category: 'all', search: '' });

  useEffect(() => {
    fetchDocuments();
  }, [docFilters]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const queryParams = new URLSearchParams();
      if (docFilters.category !== 'all') queryParams.append('category', docFilters.category);
      if (docFilters.search) queryParams.append('search', docFilters.search);
      // Backend fetches all, frontend filters for committee access: public or committee_only

      const res = await fetch(`/api/documents?${queryParams}`, { credentials: 'include' });
      const data = await res.json();
      
      if (res.ok) {
        setDocuments(data.documents || []);
        // Filter for committee access: public or committee_only
        const committeeAccessible = data.documents.filter(doc => 
          doc.accessLevel === 'public' || doc.accessLevel === 'committee_only'
        );
        setFilteredDocuments(committeeAccessible);
      } else {
        setUiMessage({ type: 'error', message: data.message || 'Failed to fetch documents' });
      }
    } catch (err) {
      setUiMessage({ type: 'error', message: 'Failed to fetch documents' });
    } finally {
      setLoadingDocs(false);
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

  const documentCategories = [
    'Bylaws',
    'Circulars',
    'Agreements',
    'Meeting Minutes',
    'Financial Reports',
    'Notice',
    'Other'
  ];

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

        <div style={{ marginTop: 24 }}>
          <SectionCard title="Documents Repository">
            {uiMessage && (
              <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, background: uiMessage.type==='success'?'#d1fae5':uiMessage.type==='error'?'#fee2e2':'#dbeafe', color: uiMessage.type==='success'?'#065f46':uiMessage.type==='error'?'#991b1b':'#1e40af' }}>
                {uiMessage.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={docFilters.search}
                onChange={(e) => setDocFilters({ ...docFilters, search: e.target.value })}
                placeholder="Search documents..."
                style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 200 }}
              />
              <select
                value={docFilters.category}
                onChange={(e) => setDocFilters({ ...docFilters, category: e.target.value })}
                style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
              >
                <option value="all">All Categories</option>
                {documentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                onClick={fetchDocuments} 
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
            {loadingDocs ? (
              <div>Loading documents...</div>
            ) : filteredDocuments.length === 0 ? (
              <div style={{ color: '#6b7280', textAlign: 'center' }}>No accessible documents available</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {filteredDocuments.map(doc => (
                  <div key={doc._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{getFileIcon(doc.fileType)}</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: 14 }}>{doc.title}</h4>
                        {doc.description && (
                          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>{doc.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
                          <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{doc.category}</span>
                          <span style={{ color: '#6b7280' }}>{formatFileSize(doc.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => handleDownloadDocument(doc._id, doc.fileName)}
                        style={{ 
                          background: '#111827', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          padding: '6px 12px', 
                          cursor: 'pointer',
                          fontSize: 12 
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}

export default CommitteeDashboard;