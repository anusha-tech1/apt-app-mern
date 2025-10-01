import React, { useEffect, useState } from 'react';
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
      { id: 'announcements', label: 'Announcements', icon: Bell },
      { id: 'documents', label: 'Documents', icon: FolderOpen },
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
          min-height: 100vh;
          background: #f8fafc;
          padding: 32px;
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
          {activeTab === 'complaints' && <PlaceholderContent title="Complaints & Maintenance" description="Track and resolve resident complaints" />}
          {activeTab === 'amenities' && <PlaceholderContent title="Amenity Management" description="Manage bookings for common facilities" />}
          {activeTab === 'announcements' && <PlaceholderContent title="Announcements" description="Create and manage community announcements" />}
          {activeTab === 'documents' && <PlaceholderContent title="Document Repository" description="Store and manage important documents" />}
          {activeTab === 'staff' && <PlaceholderContent title="Staff & Vendors" description="Manage staff attendance and vendor information" />}
          {activeTab === 'security' && <PlaceholderContent title="Security Management" description="Monitor visitor logs and security activities" />}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;