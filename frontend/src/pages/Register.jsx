import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'resident'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async () => {
    console.log('Register button clicked!'); // Debug log
    
    // Frontend validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.name.length > 50) {
      setError('Name cannot exceed 50 characters');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store user data
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      alert(`Registration successful! Welcome ${data.user.name}`);
      
      // Redirect based on role
      switch(data.user.role) {
        case 'admin':
          window.location.href = '/admin-dashboard';
          break;
        case 'committee_member':
          window.location.href = '/committee-dashboard';
          break;
        case 'staff':
          window.location.href = '/staff-dashboard';
          break;
        case 'resident':
          window.location.href = '/resident-dashboard';
          break;
        default:
          window.location.href = '/dashboard';
      }

    } catch (error) {
      setError(error.message);
      console.error('Registration error:', error);
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const roleOptions = [
    { value: 'resident', label: 'Resident', description: 'Community resident' },
    { value: 'committee_member', label: 'Committee Member', description: 'Housing society committee member' },
    { value: 'staff', label: 'Staff', description: 'Maintenance and support staff' },
    { value: 'admin', label: 'Admin', description: 'System administrator' }
  ];

  // Inline styles for button (in case Tailwind isn't working)
  const buttonStyle = {
    width: '100%',
    backgroundColor: loading ? '#9CA3AF' : '#059669',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.5 : 1,
    transition: 'all 0.2s',
    marginTop: '8px'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '32px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: 'white', fontSize: '24px' }}>👤</span>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>Create Account</h2>
          <p style={{ color: '#6B7280', margin: 0 }}>Join our community today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              maxLength="50"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none', fontSize: '16px' }}
              placeholder="Enter your full name"
              required
            />
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>{formData.name.length}/50 characters</p>
          </div>

          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none', fontSize: '16px' }}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                style={{ width: '100%', padding: '12px 48px 12px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none', fontSize: '16px' }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>Minimum 8 characters required</p>
          </div>

          {/* Role Field */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none', fontSize: '16px' }}
              required
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
              {roleOptions.find(option => option.value === formData.role)?.description}
            </p>
          </div>

          {/* Register Button - FIXED WITH INLINE STYLES */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={buttonStyle}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#047857';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
          >
            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </button>
        </div>

        {/* Switch to Login */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: '#6B7280', margin: 0 }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;