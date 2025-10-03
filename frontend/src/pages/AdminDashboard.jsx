import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, FileText, Wrench, Calendar, 
  Bell, FolderOpen, UserCog, Settings, LogOut,
  Home, TrendingUp, Shield, MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalUnits: 0,
    pendingComplaints: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(false);

  // User Management State
  const [createForm, setCreateForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'resident', 
    permissions: [] 
  });
  const [permissionForm, setPermissionForm] = useState({
    email: '',
    permissions: []
  });
  const [uiMessage, setUiMessage] = useState(null);

  const availablePermissions = [
    'member_management', 
    'announcements', 
    'reports', 
    'billing', 
    'maintenance',
    'amenities',
    'documents'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include' })
      ]);
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        const hydrated = usersData.users.map(u => ({ 
          ...u, 
          _editRole: u.role, 
          _editPerms: u.permissions || [] 
        }));
        setUsers(hydrated);
        
        setStats({
          totalResidents: hydrated.filter(u => u.role === 'resident').length,
          totalUnits: hydrated.length,
          pendingComplaints: Math.floor(Math.random() * 15),
          monthlyRevenue: Math.floor(Math.random() * 100000)
        });
      }
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUiMessage({ type: 'loading', message: 'Creating user...' });
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setUiMessage({ type: 'success', message: 'User created successfully' });
      setCreateForm({ name: '', email: '', password: '', role: 'resident', permissions: [] });
      fetchDashboardData();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    setUiMessage({ type: 'loading', message: 'Updating permissions...' });
    try {
      const res = await fetch('/api/users/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(permissionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setUiMessage({ type: 'success', message: 'Permissions updated successfully' });
      setPermissionForm({ email: '', permissions: [] });
      fetchDashboardData();
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
      setUiMessage({ type: 'success', message: 'User updated successfully' });
      fetchDashboardData();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const toggleActive = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle-active`, { 
        method: 'PATCH', 
        credentials: 'include' 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to toggle');
      setUiMessage({ type: 'success', message: data.message || 'Status toggled' });
      fetchDashboardData();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete');
      setUiMessage({ type: 'success', message: 'User deleted successfully' });
      fetchDashboardData();
    } catch (err) {
      setUiMessage({ type: 'error', message: err.message });
    }
  };

  const Sidebar = () => {
    const menuItems = [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'residents', label: 'Residents & Units', icon: Users },
      { id: 'billing', label: 'Accounts & Billing', icon: DollarSign },
      { id: 'complaints', label: 'Complaints', icon: Wrench },
      { id: 'amenities', label: 'Amenities', icon: Calendar },
      // { id: 'announcements', label: 'Announcements', icon: Bell },
      { id: 'documents', label: 'Announcements and Documents', icon: FolderOpen },
      { id: 'staff', label: 'Staff & Vendors', icon: UserCog },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
              onClick={() => item.id === 'analytics' ? navigate('/analytics') : setActiveTab(item.id)}
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

  const StatsCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
          </div>
        )}
      </div>
    </div>
  );

  const OverviewContent = () => (
    <div className="content-section">
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        <StatsCard 
          icon={Users} 
          title="Total Residents" 
          value={stats.totalResidents} 
          change={5}
          color="#3b82f6"
        />
        <StatsCard 
          icon={Home} 
          title="Total Units" 
          value={stats.totalUnits} 
          change={0}
          color="#10b981"
        />
        <StatsCard 
          icon={Wrench} 
          title="Pending Complaints" 
          value={stats.pendingComplaints} 
          change={-12}
          color="#f59e0b"
        />
        <StatsCard 
          icon={DollarSign} 
          title="Monthly Revenue" 
          value={`₹${stats.monthlyRevenue.toLocaleString()}`} 
          change={8}
          color="#8b5cf6"
        />
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button className="action-btn" onClick={() => setActiveTab('residents')}>
            <Users size={20} />
            Add New Resident
          </button>
          <button className="action-btn" onClick={() => setActiveTab('announcements')}>
            <Bell size={20} />
            Create Announcement
          </button>
          <button className="action-btn" onClick={() => setActiveTab('billing')}>
            <DollarSign size={20} />
            Generate Invoice
          </button>
          <button className="action-btn" onClick={() => setActiveTab('complaints')}>
            <Wrench size={20} />
            View Complaints
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon"><Users size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">New resident added to Unit 204</div>
              <div className="activity-time">2 hours ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><DollarSign size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">Payment received: ₹15,000</div>
              <div className="activity-time">5 hours ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon"><Wrench size={16} /></div>
            <div className="activity-content">
              <div className="activity-title">Complaint resolved: Plumbing issue</div>
              <div className="activity-time">1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ResidentsContent = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Residents & User Management</h2>
        <button className="primary-btn" onClick={() => setActiveTab('create-user')}>
          <Users size={18} />
          Add New User
        </button>
      </div>

      {uiMessage && (
        <div className={`message ${uiMessage.type}`}>
          {uiMessage.message}
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select 
                      value={u._editRole} 
                      onChange={e=>setUsers(prev=>prev.map(x=>x._id===u._id?{...x,_editRole:e.target.value}:x))}
                      className="role-select"
                    >
                      <option value="admin">Admin</option>
                      <option value="committee_member">Committee</option>
                      <option value="resident">Resident</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td>
                    <div className="permissions-cell">
                      {availablePermissions.slice(0, 3).map(p => (
                        <label key={p} className="permission-tag">
                          <input 
                            type="checkbox" 
                            checked={u._editPerms?.includes(p)} 
                            onChange={()=>toggleRowPermission(u._id, p)} 
                          />
                          <span>{p.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={()=>saveUserEdits(u)} className="btn-save">Save</button>
                      <button onClick={()=>toggleActive(u._id)} className="btn-toggle">
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={()=>deleteUser(u._id)} className="btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const CreateUserContent = () => (
    <div className="content-section">
      <div className="section-header">
        <h2>Create New User</h2>
        <button className="secondary-btn" onClick={() => setActiveTab('residents')}>
          Back to List
        </button>
      </div>

      <form onSubmit={handleCreateUser} className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              value={createForm.name} 
              onChange={e=>setCreateForm(f=>({...f, name:e.target.value}))} 
              placeholder="John Doe" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input 
              value={createForm.email} 
              onChange={e=>setCreateForm(f=>({...f, email:e.target.value}))} 
              type="email" 
              placeholder="john@example.com" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input 
              value={createForm.password} 
              onChange={e=>setCreateForm(f=>({...f, password:e.target.value}))} 
              type="password" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select 
              value={createForm.role} 
              onChange={e=>setCreateForm(f=>({...f, role:e.target.value}))}
            >
              <option value="admin">Admin</option>
              <option value="committee_member">Committee Member</option>
              <option value="resident">Resident</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Permissions</label>
          <div className="permissions-grid">
            {availablePermissions.map(p => (
              <label key={p} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={createForm.permissions.includes(p)} 
                  onChange={() => {
                    setCreateForm(f=>{
                      const set=new Set(f.permissions);
                      if(set.has(p)) set.delete(p); else set.add(p);
                      return { ...f, permissions: Array.from(set) };
                    })
                  }} 
                />
                <span>{p.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="primary-btn">
          Create User
        </button>
      </form>
    </div>
  );

  const BillingContent = () => {
    const [billingView, setBillingView] = useState('overview');
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [billingStats, setBillingStats] = useState(null);
    const [loadingBilling, setLoadingBilling] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
      userId: '',
      unit: '',
      maintenanceCharge: 10000,
      parkingCharge: 2000,
      waterCharge: 1000,
      commonAreaCharge: 2000,
      gst: 0,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    const [expenseForm, setExpenseForm] = useState({
      category: 'Maintenance',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paymentMethod: 'bank_transfer',
      transactionId: '',
      notes: ''
    });

    useEffect(() => {
      if (activeTab === 'billing') {
        fetchBillingData();
      }
    }, [activeTab]);

    const fetchBillingData = async () => {
      setLoadingBilling(true);
      try {
        const [invoicesRes, expensesRes, statsRes] = await Promise.all([
          fetch('/api/billing/invoices', { credentials: 'include' }),
          fetch('/api/billing/expenses', { credentials: 'include' }),
          fetch('/api/billing/invoices/stats', { credentials: 'include' })
        ]);

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
        }

        if (expensesRes.ok) {
          const data = await expensesRes.json();
          setExpenses(data.expenses || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setBillingStats(data.stats || null);
        }
      } catch (err) {
        setUiMessage({ type: 'error', message: 'Failed to fetch billing data' });
      } finally {
        setLoadingBilling(false);
      }
    };

    const calculateTotal = () => {
      const { maintenanceCharge, parkingCharge, waterCharge, commonAreaCharge, gst } = invoiceForm;
      const subtotal = Number(maintenanceCharge) + Number(parkingCharge) + Number(waterCharge) + Number(commonAreaCharge);
      const gstAmount = (subtotal * Number(gst)) / 100;
      return subtotal + gstAmount;
    };

    const handleCreateInvoice = async (e) => {
      e.preventDefault();
      setUiMessage({ type: 'loading', message: 'Creating invoice...' });
      
      try {
        const res = await fetch('/api/billing/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(invoiceForm)
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to create invoice');
        
        setUiMessage({ type: 'success', message: 'Invoice created successfully' });
        setInvoiceForm({
          userId: '',
          unit: '',
          maintenanceCharge: 10000,
          parkingCharge: 2000,
          waterCharge: 1000,
          commonAreaCharge: 2000,
          gst: 0,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: ''
        });
        setBillingView('overview');
        fetchBillingData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleAddExpense = async (e) => {
      e.preventDefault();
      setUiMessage({ type: 'loading', message: 'Recording expense...' });

      try {
        const res = await fetch('/api/billing/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(expenseForm)
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to record expense');
        
        setUiMessage({ type: 'success', message: 'Expense recorded successfully' });
        setExpenseForm({
          category: 'Maintenance',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          vendor: '',
          paymentMethod: 'bank_transfer',
          transactionId: '',
          notes: ''
        });
        setBillingView('overview');
        fetchBillingData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const markAsPaid = async (invoiceId) => {
      try {
        const res = await fetch(`/api/billing/invoices/${invoiceId}/mark-paid`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paymentMethod: 'bank_transfer' })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to mark as paid');
        
        setUiMessage({ type: 'success', message: 'Payment recorded successfully' });
        fetchBillingData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const sendReminder = (invoiceId) => {
      setUiMessage({ type: 'success', message: 'Payment reminder sent successfully' });
    };

    const deleteInvoice = async (invoiceId) => {
      if (!confirm('Are you sure you want to delete this invoice?')) return;
      
      try {
        const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to delete invoice');
        
        setUiMessage({ type: 'success', message: 'Invoice deleted successfully' });
        fetchBillingData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const deleteExpense = async (expenseId) => {
      if (!confirm('Are you sure you want to delete this expense?')) return;
      
      try {
        const res = await fetch(`/api/billing/expenses/${expenseId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to delete expense');
        
        setUiMessage({ type: 'success', message: 'Expense deleted successfully' });
        fetchBillingData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const totalRevenue = billingStats?.totalRevenue || 0;
    const totalPending = billingStats?.totalPending || 0;
    const totalExpenses = billingStats?.totalExpenses || 0;
    const netBalance = billingStats?.netBalance || 0;
    const collectionRate = billingStats?.collectionRate || 0;

    return (
      <div className="content-section">
        <div className="section-header">
          <h2>Accounts & Billing</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary-btn" onClick={() => setBillingView('create-invoice')}>
              <FileText size={18} />
              Generate Invoice
            </button>
            <button className="secondary-btn" onClick={() => setBillingView('add-expense')}>
              <DollarSign size={18} />
              Add Expense
            </button>
            <button className="primary-btn" onClick={() => navigate('/analytics')}>
              <TrendingUp size={18} />
              View Reports
            </button>
          </div>
        </div>

        {uiMessage && billingView === 'overview' && (
          <div className={`message ${uiMessage.type}`}>
            {uiMessage.message}
          </div>
        )}

        {loadingBilling ? (
          <div className="loading">Loading billing data...</div>
        ) : billingView === 'overview' ? (
          <>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#10b98115' }}>
                  <DollarSign size={24} style={{ color: '#10b981' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Revenue</div>
                  <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
                  <div className="stat-change positive">Collected payments</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f59e0b15' }}>
                  <FileText size={24} style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Pending Payments</div>
                  <div className="stat-value">₹{totalPending.toLocaleString()}</div>
                  <div className="stat-change negative">Outstanding amount</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#ef444415' }}>
                  <DollarSign size={24} style={{ color: '#ef4444' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Expenses</div>
                  <div className="stat-value">₹{totalExpenses.toLocaleString()}</div>
                  <div className="stat-change negative">Total expenditure</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f615' }}>
                  <TrendingUp size={24} style={{ color: '#3b82f6' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Net Balance</div>
                  <div className="stat-value">₹{netBalance.toLocaleString()}</div>
                  <div className={`stat-change ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                    {netBalance >= 0 ? '↑' : '↓'} Current balance
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
              <div className="table-container">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Recent Invoices</h3>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Unit</th>
                      <th>Resident</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          No invoices found. Create your first invoice to get started.
                        </td>
                      </tr>
                    ) : (
                      invoices.map(inv => (
                        <tr key={inv._id}>
                          <td><strong>{inv.invoiceNumber}</strong></td>
                          <td>{inv.unit}</td>
                          <td>{inv.residentName}</td>
                          <td><strong>₹{inv.totalAmount.toLocaleString()}</strong></td>
                          <td>{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                          <td>
                            <span className={`status-badge ${inv.status === 'paid' ? 'active' : inv.status === 'overdue' ? 'inactive' : 'pending'}`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {inv.status !== 'paid' && (
                                <>
                                  <button onClick={() => markAsPaid(inv._id)} className="btn-save" style={{ fontSize: 11 }}>
                                    Mark Paid
                                  </button>
                                  <button onClick={() => sendReminder(inv._id)} className="btn-toggle" style={{ fontSize: 11 }}>
                                    Remind
                                  </button>
                                </>
                              )}
                              <button onClick={() => deleteInvoice(inv._id)} className="btn-delete" style={{ fontSize: 11 }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="quick-actions" style={{ marginBottom: 16 }}>
                  <h3>Payment Collection</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>Collection Rate</span>
                      <strong style={{ color: '#10b981' }}>{collectionRate}%</strong>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${collectionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                      <span>Collected: ₹{totalRevenue.toLocaleString()}</span>
                      <span>Target: ₹{(totalRevenue + totalPending).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="action-btn" onClick={() => setBillingView('create-invoice')}>
                      <FileText size={16} />
                      Generate New Invoice
                    </button>
                    <button className="action-btn" onClick={() => setBillingView('add-expense')}>
                      <DollarSign size={16} />
                      Record Expense
                    </button>
                    <button className="action-btn">
                      <Bell size={16} />
                      Send Payment Reminders
                    </button>
                    <button className="action-btn">
                      <TrendingUp size={16} />
                      Download Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-container">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0 }}>Recent Expenses</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No expenses recorded yet. Add your first expense to track spending.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp._id}>
                        <td><strong>{exp.expenseNumber}</strong></td>
                        <td>
                          <span className="category-badge" style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 12 }}>
                            {exp.category}
                          </span>
                        </td>
                        <td>{exp.description}</td>
                        <td>{exp.vendor}</td>
                        <td><strong style={{ color: '#ef4444' }}>₹{exp.amount.toLocaleString()}</strong></td>
                        <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                        <td>
                          <button onClick={() => deleteExpense(exp._id)} className="btn-delete" style={{ fontSize: 11 }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : billingView === 'create-invoice' ? (
          <div className="form-card">
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Generate New Invoice</h3>
              <button className="secondary-btn" onClick={() => setBillingView('overview')}>
                Back to Overview
              </button>
            </div>

            {uiMessage && (
              <div className={`message ${uiMessage.type}`}>
                {uiMessage.message}
              </div>
            )}

            <form onSubmit={handleCreateInvoice}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Resident User ID *</label>
                  <input
                    value={invoiceForm.userId}
                    onChange={e => setInvoiceForm({...invoiceForm, userId: e.target.value})}
                    placeholder="Enter resident user ID"
                    required
                  />
                  <small style={{ fontSize: 12, color: '#64748b' }}>Get user ID from Residents section</small>
                </div>
                <div className="form-group">
                  <label>Unit Number *</label>
                  <input
                    value={invoiceForm.unit}
                    onChange={e => setInvoiceForm({...invoiceForm, unit: e.target.value})}
                    placeholder="e.g., 204"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, color: '#1e293b' }}>Charge Breakdown</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Maintenance Charge</label>
                    <input
                      type="number"
                      value={invoiceForm.maintenanceCharge}
                      onChange={e => setInvoiceForm({...invoiceForm, maintenanceCharge: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Parking Charge</label>
                    <input
                      type="number"
                      value={invoiceForm.parkingCharge}
                      onChange={e => setInvoiceForm({...invoiceForm, parkingCharge: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Water Charge</label>
                    <input
                      type="number"
                      value={invoiceForm.waterCharge}
                      onChange={e => setInvoiceForm({...invoiceForm, waterCharge: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Common Area Charge</label>
                    <input
                      type="number"
                      value={invoiceForm.commonAreaCharge}
                      onChange={e => setInvoiceForm({...invoiceForm, commonAreaCharge: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>GST (%)</label>
                    <input
                      type="number"
                      value={invoiceForm.gst}
                      onChange={e => setInvoiceForm({...invoiceForm, gst: e.target.value})}
                      placeholder="18"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Notes (Optional)</label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  placeholder="Any additional notes or comments"
                  rows="3"
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ background: '#dbeafe', padding: 20, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#1e40af' }}>Total Amount</h3>
                  <h2 style={{ margin: 0, color: '#1e40af' }}>₹{calculateTotal().toLocaleString()}</h2>
                </div>
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Generate Invoice
              </button>
            </form>
          </div>
        ) : (
          <div className="form-card">
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Record New Expense</h3>
              <button className="secondary-btn" onClick={() => setBillingView('overview')}>
                Back to Overview
              </button>
            </div>

            {uiMessage && (
              <div className={`message ${uiMessage.type}`}>
                {uiMessage.message}
              </div>
            )}

            <form onSubmit={handleAddExpense}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Expense Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                    required
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Repairs">Repairs</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                    placeholder="25000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor/Payee *</label>
                  <input
                    value={expenseForm.vendor}
                    onChange={e => setExpenseForm({...expenseForm, vendor: e.target.value})}
                    placeholder="e.g., TechLift Inc"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transaction ID (Optional)</label>
                  <input
                    value={expenseForm.transactionId}
                    onChange={e => setExpenseForm({...expenseForm, transactionId: e.target.value})}
                    placeholder="e.g., TXN123456"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Description *</label>
                <textarea
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Brief description of the expense"
                  rows="3"
                  required
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Notes (Optional)</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
                  placeholder="Any additional notes"
                  rows="2"
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Record Expense
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const AmenitiesContent = () => {
    const [amenitiesView, setAmenitiesView] = useState('overview');
    const [amenities, setAmenities] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [amenityStats, setAmenityStats] = useState(null);
    const [loadingAmenities, setLoadingAmenities] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    
    const [amenityForm, setAmenityForm] = useState({
      name: '',
      description: '',
      category: 'Indoor',
      capacity: '',
      location: '',
      amenities: '',
      openTime: '06:00',
      closeTime: '22:00',
      maxDuration: 2,
      advanceBookingDays: 7,
      minBookingDuration: 1,
      slotInterval: 1,
      perHour: 0,
      perDay: 0,
      securityDeposit: 0,
      status: 'active'
    });

    const [bookingFilter, setBookingFilter] = useState('all');

    useEffect(() => {
      if (activeTab === 'amenities') {
        fetchAmenitiesData();
      }
    }, [activeTab]);

    const fetchAmenitiesData = async () => {
      setLoadingAmenities(true);
      try {
        const [amenitiesRes, bookingsRes, statsRes] = await Promise.all([
          fetch('/api/amenities/amenities', { credentials: 'include' }),
          fetch('/api/amenities/bookings', { credentials: 'include' }),
          fetch('/api/amenities/amenities/stats', { credentials: 'include' })
        ]);

        if (amenitiesRes.ok) {
          const data = await amenitiesRes.json();
          setAmenities(data.amenities || []);
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setAmenityStats(data.stats || null);
        }
      } catch (err) {
        setUiMessage({ type: 'error', message: 'Failed to fetch amenities data' });
      } finally {
        setLoadingAmenities(false);
      }
    };

    const handleCreateAmenity = async (e) => {
      e.preventDefault();
      setUiMessage({ type: 'loading', message: 'Creating amenity...' });

      try {
        const amenitiesArray = amenityForm.amenities.split(',').map(a => a.trim()).filter(a => a);
        
        const payload = {
          name: amenityForm.name,
          description: amenityForm.description,
          category: amenityForm.category,
          capacity: Number(amenityForm.capacity),
          location: amenityForm.location,
          amenities: amenitiesArray,
          timings: {
            openTime: amenityForm.openTime,
            closeTime: amenityForm.closeTime
          },
          bookingRules: {
            maxDuration: Number(amenityForm.maxDuration),
            advanceBookingDays: Number(amenityForm.advanceBookingDays),
            minBookingDuration: Number(amenityForm.minBookingDuration),
            slotInterval: Number(amenityForm.slotInterval)
          },
          pricing: {
            perHour: Number(amenityForm.perHour),
            perDay: Number(amenityForm.perDay),
            securityDeposit: Number(amenityForm.securityDeposit)
          },
          status: amenityForm.status
        };

        const res = await fetch('/api/amenities/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to create amenity');
        
        setUiMessage({ type: 'success', message: 'Amenity created successfully' });
        setAmenityForm({
          name: '',
          description: '',
          category: 'Indoor',
          capacity: '',
          location: '',
          amenities: '',
          openTime: '06:00',
          closeTime: '22:00',
          maxDuration: 2,
          advanceBookingDays: 7,
          minBookingDuration: 1,
          slotInterval: 1,
          perHour: 0,
          perDay: 0,
          securityDeposit: 0,
          status: 'active'
        });
        setAmenitiesView('overview');
        fetchAmenitiesData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleUpdateAmenity = async (amenityId, updates) => {
      try {
        const res = await fetch(`/api/amenities/amenities/${amenityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates)
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to update amenity');
        
        setUiMessage({ type: 'success', message: 'Amenity updated successfully' });
        fetchAmenitiesData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleDeleteAmenity = async (amenityId) => {
      if (!confirm('Are you sure you want to delete this amenity? All related bookings will also be deleted.')) return;
      
      try {
        const res = await fetch(`/api/amenities/amenities/${amenityId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to delete amenity');
        
        setUiMessage({ type: 'success', message: 'Amenity deleted successfully' });
        fetchAmenitiesData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleBookingAction = async (bookingId, action, rejectionReason = '') => {
      try {
        const res = await fetch(`/api/amenities/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: action, rejectionReason })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || `Failed to ${action} booking`);
        
        setUiMessage({ type: 'success', message: `Booking ${action} successfully` });
        fetchAmenitiesData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleMarkPaid = async (bookingId) => {
      try {
        const res = await fetch(`/api/amenities/bookings/${bookingId}/payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paymentMethod: 'online' })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to mark as paid');
        
        setUiMessage({ type: 'success', message: 'Payment marked as paid' });
        fetchAmenitiesData();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const filteredBookings = bookingFilter === 'all' 
      ? bookings 
      : bookings.filter(b => b.status === bookingFilter);

    const totalAmenities = amenityStats?.totalAmenities || 0;
    const activeAmenities = amenityStats?.activeAmenities || 0;
    const totalBookings = amenityStats?.totalBookings || 0;
    const pendingBookings = amenityStats?.pendingBookings || 0;

    return (
      <div className="content-section">
        <div className="section-header">
          <h2>Amenity & Facility Management</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary-btn" onClick={() => setAmenitiesView('create-amenity')}>
              <Calendar size={18} />
              Add New Amenity
            </button>
            <button className="primary-btn" onClick={() => setAmenitiesView('bookings')}>
              <FileText size={18} />
              View All Bookings
            </button>
          </div>
        </div>

        {uiMessage && amenitiesView === 'overview' && (
          <div className={`message ${uiMessage.type}`}>
            {uiMessage.message}
          </div>
        )}

        {loadingAmenities ? (
          <div className="loading">Loading amenities data...</div>
        ) : amenitiesView === 'overview' ? (
          <>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f615' }}>
                  <Calendar size={24} style={{ color: '#3b82f6' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Amenities</div>
                  <div className="stat-value">{totalAmenities}</div>
                  <div className="stat-change positive">{activeAmenities} Active</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#10b98115' }}>
                  <FileText size={24} style={{ color: '#10b981' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Bookings</div>
                  <div className="stat-value">{totalBookings}</div>
                  <div className="stat-change positive">All time</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f59e0b15' }}>
                  <Bell size={24} style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Pending Approvals</div>
                  <div className="stat-value">{pendingBookings}</div>
                  <div className="stat-change negative">Requires action</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#8b5cf615' }}>
                  <DollarSign size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Revenue</div>
                  <div className="stat-value">₹{(amenityStats?.totalRevenue || 0).toLocaleString()}</div>
                  <div className="stat-change positive">From bookings</div>
                </div>
              </div>
            </div>

            <div className="table-container">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>All Amenities</h3>
                <button className="secondary-btn" onClick={() => setAmenitiesView('create-amenity')}>
                  <Calendar size={16} />
                  Add New
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Amenity Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Timings</th>
                    <th>Pricing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No amenities found. Create your first amenity to get started.
                      </td>
                    </tr>
                  ) : (
                    amenities.map(amenity => (
                      <tr key={amenity._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{amenity.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{amenity.description.substring(0, 50)}...</div>
                        </td>
                        <td>
                          <span className="category-badge" style={{ padding: '4px 12px', background: '#f3f4f6', borderRadius: 12, fontSize: 12 }}>
                            {amenity.category}
                          </span>
                        </td>
                        <td>{amenity.location}</td>
                        <td>{amenity.capacity} people</td>
                        <td style={{ fontSize: 13 }}>
                          {amenity.timings.openTime} - {amenity.timings.closeTime}
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>
                            <div>₹{amenity.pricing.perHour}/hr</div>
                            {amenity.pricing.securityDeposit > 0 && (
                              <div style={{ color: '#64748b', fontSize: 11 }}>
                                +₹{amenity.pricing.securityDeposit} deposit
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${amenity.status === 'active' ? 'active' : amenity.status === 'maintenance' ? 'pending' : 'inactive'}`}>
                            {amenity.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => {
                                setSelectedAmenity(amenity);
                                setAmenitiesView('edit-amenity');
                              }} 
                              className="btn-save" 
                              style={{ fontSize: 11 }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleUpdateAmenity(amenity._id, { 
                                status: amenity.status === 'active' ? 'inactive' : 'active' 
                              })} 
                              className="btn-toggle" 
                              style={{ fontSize: 11 }}
                            >
                              {amenity.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button 
                              onClick={() => handleDeleteAmenity(amenity._id)} 
                              className="btn-delete" 
                              style={{ fontSize: 11 }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : amenitiesView === 'create-amenity' || amenitiesView === 'edit-amenity' ? (
          <div className="form-card">
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>
                {amenitiesView === 'create-amenity' ? 'Create New Amenity' : 'Edit Amenity'}
              </h3>
              <button className="secondary-btn" onClick={() => {
                setAmenitiesView('overview');
                setSelectedAmenity(null);
              }}>
                Back to List
              </button>
            </div>

            {uiMessage && (
              <div className={`message ${uiMessage.type}`}>
                {uiMessage.message}
              </div>
            )}

            <form onSubmit={handleCreateAmenity}>
              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, color: '#1e293b' }}>Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Amenity Name *</label>
                    <input
                      value={amenityForm.name}
                      onChange={e => setAmenityForm({...amenityForm, name: e.target.value})}
                      placeholder="e.g., Swimming Pool"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={amenityForm.category}
                      onChange={e => setAmenityForm({...amenityForm, category: e.target.value})}
                      required
                    >
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Sports">Sports</option>
                      <option value="Recreation">Recreation</option>
                      <option value="Meeting">Meeting</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      value={amenityForm.location}
                      onChange={e => setAmenityForm({...amenityForm, location: e.target.value})}
                      placeholder="e.g., Ground Floor, Block A"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input
                      type="number"
                      value={amenityForm.capacity}
                      onChange={e => setAmenityForm({...amenityForm, capacity: e.target.value})}
                      placeholder="Max number of people"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={amenityForm.description}
                    onChange={e => setAmenityForm({...amenityForm, description: e.target.value})}
                    placeholder="Brief description of the amenity"
                    rows="3"
                    required
                    style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label>Available Facilities (comma-separated)</label>
                  <input
                    value={amenityForm.amenities}
                    onChange={e => setAmenityForm({...amenityForm, amenities: e.target.value})}
                    placeholder="e.g., WiFi, Air Conditioning, Projector"
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, color: '#1e293b' }}>Timing & Booking Rules</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Opening Time *</label>
                    <input
                      type="time"
                      value={amenityForm.openTime}
                      onChange={e => setAmenityForm({...amenityForm, openTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Closing Time *</label>
                    <input
                      type="time"
                      value={amenityForm.closeTime}
                      onChange={e => setAmenityForm({...amenityForm, closeTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Duration (hours) *</label>
                    <input
                      type="number"
                      value={amenityForm.maxDuration}
                      onChange={e => setAmenityForm({...amenityForm, maxDuration: e.target.value})}
                      placeholder="e.g., 2"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Duration (hours) *</label>
                    <input
                      type="number"
                      value={amenityForm.minBookingDuration}
                      onChange={e => setAmenityForm({...amenityForm, minBookingDuration: e.target.value})}
                      placeholder="e.g., 1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Slot Interval (hours) *</label>
                    <input
                      type="number"
                      value={amenityForm.slotInterval}
                      onChange={e => setAmenityForm({...amenityForm, slotInterval: e.target.value})}
                      placeholder="e.g., 1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Advance Booking Days *</label>
                    <input
                      type="number"
                      value={amenityForm.advanceBookingDays}
                      onChange={e => setAmenityForm({...amenityForm, advanceBookingDays: e.target.value})}
                      placeholder="e.g., 7"
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, color: '#1e293b' }}>Pricing</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Price per Hour</label>
                    <input
                      type="number"
                      value={amenityForm.perHour}
                      onChange={e => setAmenityForm({...amenityForm, perHour: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price per Day</label>
                    <input
                      type="number"
                      value={amenityForm.perDay}
                      onChange={e => setAmenityForm({...amenityForm, perDay: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Security Deposit</label>
                    <input
                      type="number"
                      value={amenityForm.securityDeposit}
                      onChange={e => setAmenityForm({...amenityForm, securityDeposit: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      value={amenityForm.status}
                      onChange={e => setAmenityForm({...amenityForm, status: e.target.value})}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Under Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {amenitiesView === 'create-amenity' ? 'Create Amenity' : 'Update Amenity'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setBookingFilter(filter)}
                  className={`filter-btn ${bookingFilter === filter ? 'active' : ''}`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'all' && ` (${bookings.length})`}
                  {filter === 'pending' && ` (${bookings.filter(b => b.status === 'pending').length})`}
                </button>
              ))}
            </div>

            {uiMessage && (
              <div className={`message ${uiMessage.type}`}>
                {uiMessage.message}
              </div>
            )}

            <div className="table-container">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>
                  {bookingFilter === 'all' ? 'All Bookings' : `${bookingFilter.charAt(0).toUpperCase() + bookingFilter.slice(1)} Bookings`}
                </h3>
                <button className="secondary-btn" onClick={() => setAmenitiesView('overview')}>
                  Back to Overview
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Amenity</th>
                    <th>Resident</th>
                    <th>Unit</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => {
                      return (
                        <tr key={booking._id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.amenityId?.name || 'N/A'}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{booking.amenityId?.category}</div>
                          </td>
                          <td>{booking.residentName}</td>
                          <td>{booking.unit}</td>
                          <td>
                            <div style={{ fontSize: 13 }}>
                              <div>{new Date(booking.bookingDate).toLocaleDateString('en-IN')}</div>
                              <div style={{ color: '#64748b' }}>{booking.startTime} - {booking.endTime}</div>
                            </div>
                          </td>
                          <td>{booking.duration} hrs</td>
                          <td><strong>₹{booking.totalAmount.toLocaleString()}</strong></td>
                          <td>
                            <span className={`status-badge ${
                              booking.status === 'approved' ? 'active' :
                              (booking.status === 'rejected' || booking.status === 'cancelled') ? 'inactive' :
                              'pending'
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleBookingAction(booking._id, 'approved')}
                                    className="btn-save"
                                    style={{ fontSize: 11 }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Rejection reason:');
                                      if (reason) handleBookingAction(booking._id, 'rejected', reason);
                                    }}
                                    className="btn-delete"
                                    style={{ fontSize: 11 }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {booking.status === 'approved' && booking.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => handleMarkPaid(booking._id)}
                                  className="btn-toggle"
                                  style={{ fontSize: 11 }}
                                >
                                  Mark Paid
                                </button>
                              )}
                              {booking.paymentStatus === 'paid' && (
                                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>PAID</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Complaints & Maintenance
  const ComplaintsContent = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [filters, setFilters] = useState({ status: 'all', priority: 'all', category: 'all' });
    const [staffMembers, setStaffMembers] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const complaintCategories = ['Plumbing','Electrical','Carpentry','Cleaning','Security','Parking','Elevator','Common Area','Noise','Other'];
    const priorityOptions = [
      { value: 'low', label: 'Low', color: '#10b981' },
      { value: 'medium', label: 'Medium', color: '#f59e0b' },
      { value: 'high', label: 'High', color: '#ef4444' },
      { value: 'urgent', label: 'Urgent', color: '#dc2626' }
    ];
    const statusOptions = [
      { value: 'pending', label: 'Pending', color: '#6b7280' },
      { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
      { value: 'resolved', label: 'Resolved', color: '#10b981' },
      { value: 'closed', label: 'Closed', color: '#1f2937' }
    ];

    useEffect(() => { fetchComplaints(); fetchStaffMembers(); }, [filters]);

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const qp = new URLSearchParams();
        if (filters.status !== 'all') qp.append('status', filters.status);
        if (filters.priority !== 'all') qp.append('priority', filters.priority);
        if (filters.category !== 'all') qp.append('category', filters.category);
        const res = await fetch(`/api/complaints?${qp}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setComplaints(data.complaints || []); else setUiMessage({ type: 'error', message: data.error || 'Failed to fetch complaints' });
      } catch (_) { setUiMessage({ type: 'error', message: 'Failed to fetch complaints' }); }
      finally { setLoading(false); }
    };

    const fetchStaffMembers = async () => {
      try {
        const res = await fetch('/api/users?role=staff', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setStaffMembers(data.users || []);
      } catch (_) {}
    };

    const fetchComplaintDetails = async (id) => {
      try {
        const [cr, rr] = await Promise.all([
          fetch(`/api/complaints/${id}`, { credentials: 'include' }),
          fetch(`/api/complaints/${id}/comments`, { credentials: 'include' })
        ]);
        const cd = await cr.json();
        const cm = await rr.json();
        if (cr.ok) { setSelectedComplaint(cd.complaint); setComments(cm.comments || []); }
      } catch (_) { setUiMessage({ type: 'error', message: 'Failed to fetch complaint details' }); }
    };

    const updateComplaintStatus = async (id, status, notes = '') => {
      try {
        const res = await fetch(`/api/complaints/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status, resolution_notes: notes }) });
        const data = await res.json();
        if (res.ok) { setUiMessage({ type: 'success', message: 'Complaint status updated successfully' }); fetchComplaints(); if (selectedComplaint && selectedComplaint._id === id) setSelectedComplaint(data.complaint); }
        else throw new Error(data.error || 'Failed to update status');
      } catch (err) { setUiMessage({ type: 'error', message: err.message }); }
    };

    const assignToStaff = async (id, staffId) => {
      try {
        const res = await fetch(`/api/complaints/${id}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ staff_id: staffId }) });
        const data = await res.json();
        if (res.ok) { setUiMessage({ type: 'success', message: 'Complaint assigned successfully' }); fetchComplaints(); if (selectedComplaint && selectedComplaint._id === id) setSelectedComplaint(data.complaint); }
        else throw new Error(data.error || 'Failed to assign complaint');
      } catch (err) { setUiMessage({ type: 'error', message: err.message }); }
    };

    const addComment = async (id) => {
      if (!newComment.trim()) return;
      try {
        const res = await fetch(`/api/complaints/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ comment: newComment }) });
        const data = await res.json();
        if (res.ok) { setComments(prev => [...prev, data.comment]); setNewComment(''); setUiMessage({ type: 'success', message: 'Comment added successfully' }); }
        else throw new Error(data.error || 'Failed to add comment');
      } catch (err) { setUiMessage({ type: 'error', message: err.message }); }
    };

    const getStatusColor = (s) => statusOptions.find(x => x.value === s)?.color || '#6b7280';
    const getPriorityColor = (p) => priorityOptions.find(x => x.value === p)?.color || '#6b7280';

    const ComplaintCard = ({ complaint }) => (
      <div className="complaint-card" onClick={() => fetchComplaintDetails(complaint._id)} style={{ cursor: 'pointer' }}>
        <div className="complaint-header">
          <div className="complaint-title">
            <h4>{complaint.title}</h4>
            <div className="complaint-meta">
              <span className="unit-badge">Unit {complaint.unit_number}</span>
              <span className="category-badge">{complaint.category}</span>
            </div>
          </div>
          <div className="complaint-status">
            <span className="status-badge" style={{ backgroundColor: `${getStatusColor(complaint.status)}15`, color: getStatusColor(complaint.status) }}>
              {statusOptions.find(s => s.value === complaint.status)?.label || complaint.status}
            </span>
            <span className="priority-badge" style={{ backgroundColor: `${getPriorityColor(complaint.priority)}15`, color: getPriorityColor(complaint.priority) }}>
              {priorityOptions.find(p => p.value === complaint.priority)?.label || complaint.priority}
            </span>
          </div>
        </div>
        <div className="complaint-body"><p className="complaint-description">{complaint.description}</p></div>
        <div className="complaint-footer">
          <div className="complaint-info">
            <span className="resident-name">By: {complaint.resident_name}</span>
            <span className="complaint-date">{new Date(complaint.created_at).toLocaleDateString('en-IN')}</span>
          </div>
          {complaint.assigned_staff_id && (<span className="assigned-staff">Assigned</span>)}
        </div>
      </div>
    );

    const ComplaintDetailModal = () => {
      if (!selectedComplaint) return null;
      return (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedComplaint.title}</h3>
              <button className="close-btn" onClick={() => setSelectedComplaint(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="complaint-detail-grid">
                <div className="detail-section">
                  <h4>Complaint Details</h4>
                  <div className="detail-item"><label>Resident:</label><span>{selectedComplaint.resident_name} (Unit {selectedComplaint.unit_number})</span></div>
                  <div className="detail-item"><label>Category:</label><span>{selectedComplaint.category}</span></div>
                  <div className="detail-item"><label>Priority:</label><span style={{ color: getPriorityColor(selectedComplaint.priority) }}>{priorityOptions.find(p => p.value === selectedComplaint.priority)?.label}</span></div>
                  <div className="detail-item"><label>Status:</label><span style={{ color: getStatusColor(selectedComplaint.status) }}>{statusOptions.find(s => s.value === selectedComplaint.status)?.label}</span></div>
                  <div className="detail-item"><label>Description:</label><p className="description-text">{selectedComplaint.description}</p></div>
                </div>
                <div className="action-section">
                  <h4>Actions</h4>
                  <div className="form-group">
                    <label>Update Status</label>
                    <select value={selectedComplaint.status} onChange={(e) => updateComplaintStatus(selectedComplaint._id, e.target.value)} className="status-select">
                      {statusOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign to Staff</label>
                    <select value={selectedComplaint.assigned_staff_id || ''} onChange={(e) => assignToStaff(selectedComplaint._id, e.target.value)} className="staff-select">
                      <option value="">Select Staff</option>
                      {staffMembers.map(staff => (<option key={staff._id} value={staff._id}>{staff.name}</option>))}
                    </select>
                  </div>
                  {selectedComplaint.status === 'resolved' && (
                    <div className="form-group">
                      <label>Resolution Notes</label>
                      <textarea
                        value={selectedComplaint.resolution_notes || ''}
                        onChange={(e) => setSelectedComplaint(prev => ({ ...prev, resolution_notes: e.target.value }))}
                        placeholder="Add resolution notes..."
                        rows="3"
                        onBlur={() => updateComplaintStatus(selectedComplaint._id, selectedComplaint.status, selectedComplaint.resolution_notes)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="comments-section">
                <h4>Comments & Updates</h4>
                <div className="comments-list">
                  {comments.map(c => (
                    <div key={c._id} className="comment-item">
                      <div className="comment-header">
                        <span className="commenter">{c.commenter_name}</span>
                        <span className="comment-date">{new Date(c.created_at).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="comment-text">{c.comment}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (<p className="no-comments">No comments yet</p>)}
                </div>
                <div className="add-comment">
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment or update..." rows="3" />
                  <button onClick={() => addComment(selectedComplaint._id)} className="primary-btn" disabled={!newComment.trim()}>Add Comment</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="content-section">
        <div className="section-header">
          <h2>Complaints & Maintenance</h2>
          <button className="primary-btn" onClick={fetchComplaints}><Wrench size={18} />Refresh</button>
        </div>
        {uiMessage && (<div className={`message ${uiMessage.type}`}>{uiMessage.message}</div>)}
        <div className="filters-section">
          <div className="filter-group"><label>Status:</label>
            <select value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="all">All Status</option>
              {statusOptions.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div className="filter-group"><label>Priority:</label>
            <select value={filters.priority} onChange={(e) => setFilters(p => ({ ...p, priority: e.target.value }))}>
              <option value="all">All Priority</option>
              {priorityOptions.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
            </select>
          </div>
          <div className="filter-group"><label>Category:</label>
            <select value={filters.category} onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}>
              <option value="all">All Categories</option>
              {complaintCategories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>
        {loading ? (<div className="loading">Loading complaints...</div>) : (
          <div className="complaints-grid">
            {complaints.length === 0 ? (
              <div className="no-complaints"><Wrench size={48} style={{ color: '#9ca3af', marginBottom: 16 }} /><h3>No complaints found</h3><p>No complaints match your current filters</p></div>
            ) : (
              complaints.map(complaint => (<ComplaintCard key={complaint._id} complaint={complaint} />))
            )}
          </div>
        )}
        <ComplaintDetailModal />
        <style>{`
          .filters-section { display: flex; gap: 16px; margin-bottom: 24px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .filter-group { display: flex; flex-direction: column; gap: 8px; }
          .filter-group label { font-size: 14px; font-weight: 500; color: #374151; }
          .filter-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
          .complaints-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
          .complaint-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; border-left: 4px solid #3b82f6; }
          .complaint-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .complaint-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .complaint-title h4 { margin: 0 0 8px 0; font-size: 16px; color: #1f2937; }
          .complaint-meta { display: flex; gap: 8px; }
          .unit-badge, .category-badge { padding: 4px 8px; background: #f3f4f6; border-radius: 4px; font-size: 12px; color: #6b7280; }
          .complaint-status { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
          .status-badge, .priority-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
          .complaint-body { margin-bottom: 16px; }
          .complaint-description { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .complaint-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; }
          .complaint-info { display: flex; gap: 12px; }
          .assigned-staff { padding: 4px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 11px; }
          .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
          .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
          .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #e2e8f0; }
          .modal-header h3 { margin: 0; color: #1f2937; }
          .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
          .modal-body { padding: 24px; }
          .complaint-detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px; }
          .detail-section, .action-section { background: #f8fafc; padding: 20px; border-radius: 8px; }
          .detail-section h4, .action-section h4 { margin: 0 0 16px 0; color: #374151; }
          .detail-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
          .detail-item label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; }
          .description-text { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 0; }
          .comments-section { border-top: 1px solid #e2e8f0; padding-top: 24px; }
          .comments-section h4 { margin: 0 0 16px 0; }
          .comments-list { max-height: 300px; overflow-y: auto; margin-bottom: 16px; }
          .comment-item { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
          .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .commenter { font-weight: 500; color: #374151; }
          .comment-date { font-size: 12px; color: #9ca3af; }
          .comment-text { margin: 0; font-size: 14px; color: #6b7280; }
          .no-comments { text-align: center; color: #9ca3af; font-style: italic; padding: 20px; }
          .add-comment { display: flex; flex-direction: column; gap: 12px; }
          .add-comment textarea { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; resize: vertical; }
          .no-complaints { text-align: center; padding: 60px 20px; color: #6b7280; }
          .no-complaints h3 { margin: 0 0 8px 0; color: #374151; }
          @media (max-width: 768px) { .filters-section { flex-direction: column; } .complaints-grid { grid-template-columns: 1fr; } .complaint-detail-grid { grid-template-columns: 1fr; } .modal-content { width: 95%; } }
        `}</style>
      </div>
    );
  };

  const DocumentsContent = () => {
    const [documentsView, setDocumentsView] = useState('overview');
    const [documents, setDocuments] = useState([]);
    const [documentStats, setDocumentStats] = useState(null);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [filters, setFilters] = useState({ category: 'all', accessLevel: 'all', search: '' });
    
    const [uploadForm, setUploadForm] = useState({
      title: '',
      description: '',
      category: 'Bylaws',
      accessLevel: 'residents_only',
      tags: '',
      expiryDate: '',
      file: null
    });

    const fileInputRef = useRef(null);

    const documentCategories = [
      'Bylaws',
      'Circulars',
      'Agreements',
      'Meeting Minutes',
      'Financial Reports',
      'Notice',
      'Other'
    ];

    const accessLevels = [
      { value: 'public', label: 'Public', color: '#10b981' },
      { value: 'residents_only', label: 'Residents Only', color: '#3b82f6' },
      { value: 'committee_only', label: 'Committee Only', color: '#f59e0b' },
      { value: 'admin_only', label: 'Admin Only', color: '#ef4444' }
    ];

    useEffect(() => {
      if (activeTab === 'documents') {
        fetchDocuments();
        fetchDocumentStats();
      }
    }, [activeTab, filters]);

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.category !== 'all') queryParams.append('category', filters.category);
        if (filters.accessLevel !== 'all') queryParams.append('accessLevel', filters.accessLevel);
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

    const fetchDocumentStats = async () => {
      try {
        const res = await fetch('/api/documents/stats', { credentials: 'include' });
        const data = await res.json();
        
        if (res.ok) {
          setDocumentStats(data.stats || null);
        }
      } catch (err) {
        console.error('Failed to fetch document stats');
      }
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          setUiMessage({ type: 'error', message: 'File size must be less than 10MB' });
          e.target.value = '';
          return;
        }
        setUploadForm({ ...uploadForm, file });
      }
    };

    const handleUploadDocument = async (e) => {
      e.preventDefault();
      
      if (!uploadForm.file) {
        setUiMessage({ type: 'error', message: 'Please select a file to upload' });
        return;
      }

      setUiMessage({ type: 'loading', message: 'Uploading document...' });

      try {
        const formData = new FormData();
        formData.append('file', uploadForm.file);
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description);
        formData.append('category', uploadForm.category);
        formData.append('accessLevel', uploadForm.accessLevel);
        formData.append('tags', uploadForm.tags);
        if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);

        const res = await fetch('/api/documents', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to upload document');
        
        setUiMessage({ type: 'success', message: 'Document uploaded successfully' });
        setUploadForm({
          title: '',
          description: '',
          category: 'Bylaws',
          accessLevel: 'residents_only',
          tags: '',
          expiryDate: '',
          file: null
        });
        
        // Clear input using ref BEFORE changing view
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setDocumentsView('overview');
        fetchDocuments();
        fetchDocumentStats();
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleUpdateDocument = async (documentId, updates) => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates)
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to update document');
        
        setUiMessage({ type: 'success', message: 'Document updated successfully' });
        fetchDocuments();
        setSelectedDocument(null);
      } catch (err) {
        setUiMessage({ type: 'error', message: err.message });
      }
    };

    const handleDeleteDocument = async (documentId) => {
      if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
      
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Failed to delete document');
        
        setUiMessage({ type: 'success', message: 'Document deleted successfully' });
        fetchDocuments();
        fetchDocumentStats();
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
        fetchDocuments(); // Refresh to update download count
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

    const getAccessLevelColor = (level) => {
      return accessLevels.find(a => a.value === level)?.color || '#6b7280';
    };

    const totalDocuments = documentStats?.totalDocuments || 0;
    const totalDownloads = documentStats?.totalDownloads || 0;
    const categoryBreakdown = documentStats?.documentsByCategory || [];
    const recentUploads = documentStats?.recentUploads || [];

    return (
      <div className="content-section">
        <div className="section-header">
          <h2>Announcement and Document Repository</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="secondary-btn" onClick={() => setDocumentsView('upload')}>
              <FolderOpen size={18} />
              Upload Document
            </button>
          </div>
        </div>

        {uiMessage && documentsView === 'overview' && (
          <div className={`message ${uiMessage.type}`}>
            {uiMessage.message}
          </div>
        )}

        {loadingDocs ? (
          <div className="loading">Loading documents...</div>
        ) : documentsView === 'overview' ? (
          <>
            <div className="stats-grid" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#3b82f615' }}>
                  <FolderOpen size={24} style={{ color: '#3b82f6' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Documents</div>
                  <div className="stat-value">{totalDocuments}</div>
                  <div className="stat-change positive">Active documents</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#10b98115' }}>
                  <FileText size={24} style={{ color: '#10b981' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Total Downloads</div>
                  <div className="stat-value">{totalDownloads}</div>
                  <div className="stat-change positive">All time</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#f59e0b15' }}>
                  <Calendar size={24} style={{ color: '#f59e0b' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Categories</div>
                  <div className="stat-value">{categoryBreakdown.length}</div>
                  <div className="stat-change positive">Document types</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#8b5cf615' }}>
                  <Bell size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-title">Recent Uploads</div>
                  <div className="stat-value">{recentUploads.length}</div>
                  <div className="stat-change positive">Last 5 uploads</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'flex-end'
            }}>
              <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
                <label>Search Documents</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by title, tags..."
                  style={{ padding: '8px 12px' }}
                />
              </div>
              <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  style={{ padding: '8px 12px' }}
                >
                  <option value="all">All Categories</option>
                  {documentCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: '180px', marginBottom: 0 }}>
                <label>Access Level</label>
                <select
                  value={filters.accessLevel}
                  onChange={(e) => setFilters({ ...filters, accessLevel: e.target.value })}
                  style={{ padding: '8px 12px' }}
                >
                  <option value="all">All Levels</option>
                  {accessLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={fetchDocuments} 
                className="secondary-btn"
                style={{ marginBottom: 0 }}
              >
                Apply Filters
              </button>
            </div>

            {/* Documents Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {documents.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  background: 'white',
                  borderRadius: '12px',
                  color: '#94a3b8' 
                }}>
                  <FolderOpen size={48} style={{ marginBottom: '16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No documents found</h3>
                  <p>Upload your first document to get started</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontSize: '32px' }}>{getFileIcon(doc.fileType)}</div>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: `${getAccessLevelColor(doc.accessLevel)}15`,
                          color: getAccessLevelColor(doc.accessLevel),
                          fontSize: '11px',
                          padding: '4px 8px'
                        }}
                      >
                        {accessLevels.find(a => a.value === doc.accessLevel)?.label}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>
                      {doc.title}
                    </h4>

                    {doc.description && (
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#64748b', 
                        margin: '0 0 12px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {doc.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        {doc.category}
                      </span>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#f3f4f6', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>

                    {doc.tags && doc.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '2px 6px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '3px',
                              fontSize: '10px'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ 
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      marginTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        <div>{doc.uploaderName}</div>
                        <div>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {doc.downloadCount} downloads
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(doc._id, doc.fileName);
                        }}
                        className="btn-save"
                        style={{ flex: 1, fontSize: '12px', justifyContent: 'center' }}
                      >
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocument(doc);
                        }}
                        className="btn-toggle"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc._id);
                        }}
                        className="btn-delete"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Document Modal */}
            {selectedDocument && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '20px'
                }}
                onClick={() => setSelectedDocument(null)}
              >
                <div 
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '90vh',
                    overflow: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ 
                    padding: '24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0 }}>Edit Document</h3>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        value={selectedDocument.title}
                        onChange={(e) => setSelectedDocument({ ...selectedDocument, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={selectedDocument.description || ''}
                        onChange={(e) => setSelectedDocument({ ...selectedDocument, description: e.target.value })}
                        rows="3"
                        style={{ 
                          padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          width: '100%'
                        }}
                      />
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={selectedDocument.category}
                          onChange={(e) => setSelectedDocument({ ...selectedDocument, category: e.target.value })}
                        >
                          {documentCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Access Level</label>
                        <select
                          value={selectedDocument.accessLevel}
                          onChange={(e) => setSelectedDocument({ ...selectedDocument, accessLevel: e.target.value })}
                        >
                          {accessLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated)</label>
                      <input
                        value={selectedDocument.tags?.join(', ') || ''}
                        onChange={(e) => setSelectedDocument({ 
                          ...selectedDocument, 
                          tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })}
                        placeholder="e.g., important, 2024, budget"
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={selectedDocument.expiryDate ? new Date(selectedDocument.expiryDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setSelectedDocument({ ...selectedDocument, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedDocument.isActive}
                          onChange={(e) => setSelectedDocument({ ...selectedDocument, isActive: e.target.checked })}
                        />
                        Active Document
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                      <button
                        onClick={() => handleUpdateDocument(selectedDocument._id, {
                          title: selectedDocument.title,
                          description: selectedDocument.description,
                          category: selectedDocument.category,
                          accessLevel: selectedDocument.accessLevel,
                          tags: selectedDocument.tags?.join(','),
                          expiryDate: selectedDocument.expiryDate,
                          isActive: selectedDocument.isActive
                        })}
                        className="primary-btn"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setSelectedDocument(null)}
                        className="secondary-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Upload Form
          <div className="form-card">
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h3 style={{ margin: 0 }}>Upload New Document</h3>
              <button className="secondary-btn" onClick={() => setDocumentsView('overview')}>
                Back to Documents
              </button>
            </div>

            {uiMessage && (
              <div className={`message ${uiMessage.type}`}>
                {uiMessage.message}
              </div>
            )}

            <form onSubmit={handleUploadDocument}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: '#1e293b' }}>Document Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Document Title *</label>
                    <input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g., Society Bylaws 2024"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      required
                    >
                      {documentCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Brief description of the document"
                    rows="3"
                    style={{ 
                      padding: '10px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: '#1e293b' }}>File Upload</h4>
                <div className="form-group">
                  <label>Select File * (Max 10MB)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    required
                    style={{
                      padding: '10px',
                      border: '2px dashed #e2e8f0',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG
                  </small>
                </div>
                {uploadForm.file && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: 'white', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>{getFileIcon(uploadForm.file.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                        {uploadForm.file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatFileSize(uploadForm.file.size)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px', color: '#1e293b' }}>Access & Settings</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Access Level *</label>
                    <select
                      value={uploadForm.accessLevel}
                      onChange={(e) => setUploadForm({ ...uploadForm, accessLevel: e.target.value })}
                      required
                    >
                      {accessLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                    <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Controls who can view and download this document
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={uploadForm.expiryDate}
                      onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Document will be marked as expired after this date
                    </small>
                  </div>
                </div>
                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    placeholder="e.g., important, 2024, budget, annual"
                  />
                  <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Add tags to help with searching and organization
                  </small>
                </div>
              </div>

              <button 
                type="submit" 
                className="primary-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Upload Document
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const PlaceholderContent = ({ title, description }) => (
    <div className="content-section">
      <h2>{title}</h2>
      <div className="placeholder-content">
        <MessageSquare size={48} style={{ color: '#9ca3af' }} />
        <p>{description}</p>
        <p className="text-muted">This module is under development</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        
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
          width: calc(100% - 260px);
          min-height: 100vh;
          background: #f8fafc;
          padding: 64px 32px 32px 32px;
        }
        
        .content-section { max-width: 1400px; margin: 0 auto; }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        h2 {
          font-size: 28px;
          color: #0f172a;
          font-weight: 700;
        }
        
        h3 {
          font-size: 18px;
          color: #1e293b;
          margin-bottom: 16px;
          font-weight: 600;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-content { flex: 1; }
        .stat-title { font-size: 14px; color: #64748b; margin-bottom: 4px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .stat-change { font-size: 13px; font-weight: 500; }
        .stat-change.positive { color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        
        .quick-actions {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #1e293b;
        }
        
        .action-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        
        .recent-activity {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .activity-list { display: flex; flex-direction: column; gap: 16px; }
        
        .activity-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        
        .activity-item:hover { background: #f8fafc; }
        
        .activity-icon {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        
        .activity-content { flex: 1; }
        .activity-title { font-size: 14px; color: #0f172a; margin-bottom: 2px; }
        .activity-time { font-size: 12px; color: #94a3b8; }
        
        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .primary-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        
        .secondary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .secondary-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .message.success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .message.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .message.loading { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        
        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .data-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #1e293b;
        }
        
        .data-table tr:hover { background: #f8fafc; }
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .role-select {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }
        
        .permissions-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .permission-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #f1f5f9;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .permission-tag:hover { background: #e2e8f0; }
        .permission-tag input { cursor: pointer; }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        
        .filter-btn {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }
        
        .filter-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .action-buttons {
          display: flex;
          gap: 6px;
        }
        
        .action-buttons button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-save { background: #3b82f6; color: white; }
        .btn-save:hover { background: #2563eb; }
        .btn-toggle { background: #f59e0b; color: white; }
        .btn-toggle:hover { background: #d97706; }
        .btn-delete { background: #ef4444; color: white; }
        .btn-delete:hover { background: #dc2626; }
        
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        
        .form-group input,
        .form-group select {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #1e293b;
          cursor: pointer;
        }
        
        .checkbox-label input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .placeholder-content {
          text-align: center;
          padding: 80px 20px;
          color: #64748b;
        }
        
        .placeholder-content p {
          font-size: 16px;
          margin-top: 16px;
        }
        
        .text-muted {
          color: #94a3b8;
          font-size: 14px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .sidebar { width: 200px; }
          .main-content { margin-left: 200px; padding: 20px; }
          .stats-grid { grid-template-columns: 1fr; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-content">
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'residents' && <ResidentsContent />}
          {activeTab === 'create-user' && <CreateUserContent />}
          {activeTab === 'billing' && <BillingContent />}
          {activeTab === 'complaints' && <ComplaintsContent />}
          {activeTab === 'amenities' && <AmenitiesContent />}
          {activeTab === 'announcements' && (
            <PlaceholderContent title="Announcements" description="Create and manage community announcements" />
          )}
          {activeTab === 'documents' && <DocumentsContent />}
          {activeTab === 'staff' && <PlaceholderContent title="Staff & Vendors" description="Manage staff attendance and vendor information" />}
          {activeTab === 'security' && <PlaceholderContent title="Security Management" description="Monitor visitor logs and security activities" />}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;