// Updated ResidentDashboard.jsx
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
  const [bookingMessage, setBookingMessage] = useState(null); // New: Local message for booking section
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', priority: 'medium' });
  const [myComplaints, setMyComplaints] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ category: 'all', search: '' });
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    amenityId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfGuests: 1
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });
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
    fetchMyComplaints(); 
    fetchDocuments();
    fetchAmenities();
    fetchMyBookings();
  }, [page, filters, user._id]);

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
      // Backend should filter for resident-accessible docs (public or residents_only)

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

  const fetchAmenities = async () => {
    setLoadingAmenities(true);
    try {
      const res = await fetch('/api/amenities/amenities?status=active', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setAmenities(data.amenities || []);
      } else {
        setBookingMessage({ type: 'error', message: data.message || 'Failed to fetch amenities' }); // Use bookingMessage for amenity errors
      }
    } catch (err) {
      setBookingMessage({ type: 'error', message: 'Failed to fetch amenities' });
    } finally {
      setLoadingAmenities(false);
    }
  };

  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      if (!user._id) {
        setBookingMessage({ type: 'error', message: 'User not authenticated' });
        return;
      }
      const res = await fetch(`/api/amenities/bookings?userId=${user._id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMyBookings(data.bookings || []);
      } else {
        setBookingMessage({ type: 'error', message: data.message || 'Failed to fetch bookings' });
      }
    } catch (err) {
      setBookingMessage({ type: 'error', message: 'Failed to fetch bookings' });
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchAvailableSlots = async (amenityId, date) => {
    try {
      const res = await fetch(`/api/amenities/bookings/available-slots?amenityId=${amenityId}&date=${date}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        setBookingMessage({ type: 'error', message: data.message || 'Failed to fetch slots' });
      }
    } catch (err) {
      setBookingMessage({ type: 'error', message: 'Failed to fetch available slots' });
    }
  };

  const handleAmenitySelect = (amenity) => {
    setSelectedAmenity(amenity);
    const newDate = selectedDate;
    setBookingForm({ ...bookingForm, amenityId: amenity._id, bookingDate: newDate });
    setBookingMessage(null); // Clear message on new selection
    fetchAvailableSlots(amenity._id, newDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setBookingForm({ ...bookingForm, bookingDate: newDate });
    setBookingMessage(null); // Clear message on date change
    if (selectedAmenity) {
      fetchAvailableSlots(selectedAmenity._id, newDate);
    }
  };

  const handleSlotSelect = (slot) => {
    setBookingForm({ ...bookingForm, startTime: slot.startTime, endTime: slot.endTime });
    setBookingMessage(null); // Clear message on slot select
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user._id) {
      setBookingMessage({ type: 'error', message: 'User not authenticated' });
      return;
    }
    setBookingMessage({ type: 'loading', message: 'Creating booking...' });
    try {
      const res = await fetch('/api/amenities/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create booking');
      setBookingMessage({ type: 'success', message: 'Booking created successfully' });
      setBookingForm({
        amenityId: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        numberOfGuests: 1
      });
      setSelectedAmenity(null);
      setAvailableSlots([]);
      fetchMyBookings();
    } catch (err) {
      setBookingMessage({ type: 'error', message: err.message });
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
    setUser({});
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Resident Dashboard</h2>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

        <Card title="Amenities & Bookings">
          {bookingMessage && (  // Use bookingMessage here only
            <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, background: bookingMessage.type==='success'?'#d1fae5':bookingMessage.type==='error'?'#fee2e2':'#dbeafe', color: bookingMessage.type==='success'?'#065f46':bookingMessage.type==='error'?'#991b1b':'#1e40af' }}>
              {bookingMessage.message}
            </div>
          )}
          {loadingAmenities ? (
            <div>Loading amenities...</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {amenities.map(amenity => (
                  <div key={amenity._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa', cursor: 'pointer' }} onClick={() => handleAmenitySelect(amenity)}>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#111827' }}>{amenity.name}</h4>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#6b7280' }}>{amenity.description.substring(0, 50)}...</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11 }}>
                      <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{amenity.category}</span>
                      <span style={{ color: '#6b7280' }}>{amenity.location}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>₹{amenity.pricing.perHour}/hr • {amenity.capacity} people</div>
                  </div>
                ))}
              </div>
              {selectedAmenity && (
                <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
                  <h4 style={{ margin: 0, marginBottom: 8 }}>Book {selectedAmenity.name}</h4>
                  <form onSubmit={handleBookingSubmit} style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <label>Date</label>
                        <input type="date" value={selectedDate} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required />
                      </div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <label>Available Slots</label>
                        <select 
                          value={bookingForm.startTime || ''} 
                          onChange={(e) => {
                            if (e.target.value) {
                              const slot = availableSlots.find(s => s.startTime === e.target.value);
                              if (slot) handleSlotSelect(slot);
                            }
                          }} 
                          style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} 
                          required
                        >
                          <option value="">Select Slot</option>
                          {availableSlots.map(slot => (
                            <option key={slot.startTime} value={slot.startTime}>{slot.startTime} - {slot.endTime}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <label>Purpose *</label>
                      <input value={bookingForm.purpose} onChange={e => setBookingForm({...bookingForm, purpose: e.target.value})} placeholder="e.g., Family gathering" style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required />
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <label>Number of Guests *</label>
                      <input type="number" min="1" max={selectedAmenity.capacity} value={bookingForm.numberOfGuests} onChange={e => setBookingForm({...bookingForm, numberOfGuests: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} required />
                    </div>
                    <button type="submit" disabled={!bookingForm.startTime || !bookingForm.purpose || !bookingForm.numberOfGuests} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: (bookingForm.startTime && bookingForm.purpose && bookingForm.numberOfGuests) ? 'pointer' : 'not-allowed' }}>Book Slot</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card title="My Bookings">
          {loadingBookings ? (
            <div>Loading...</div>
          ) : myBookings.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No bookings yet</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {myBookings.map(b => (
                <div key={b._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{b.amenityId?.name || 'N/A'}</strong>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(b.bookingDate).toLocaleDateString('en-IN')} {b.startTime} - {b.endTime}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Purpose: {b.purpose}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 12 }}>
                    <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>{b.status.toUpperCase()}</span>
                    <span style={{ background: '#ecfeff', color: '#155e75', padding: '2px 6px', borderRadius: 6 }}>₹{b.totalAmount}</span>
                  </div>
                </div>
              ))}
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

        <Card title="Documents Repository" style={{ gridColumn: '1 / -1' }}>
          {uiMessage && (
            <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 14, background: uiMessage.type==='success'?'#d1fae5':uiMessage.type==='error'?'#fee2e2':'#dbeafe', color: uiMessage.type==='success'?'#065f46':uiMessage.type==='error'?'#991b1b':'#1e40af' }}>
              {uiMessage.message}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search documents..."
              style={{ flex: 1, padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, minWidth: 200 }}
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
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
          ) : documents.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center' }}>No documents available</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {documents.map(doc => (
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
        </Card>
      </main>
    </div>
  );
}

export default ResidentDashboard;