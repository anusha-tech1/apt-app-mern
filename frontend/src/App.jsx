import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Optionally redirect to dashboard based on role
        // redirectToDashboard(userData.role);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Function to redirect to dashboard based on role
  const redirectToDashboard = (role) => {
    switch(role) {
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
  };

  // If user is already logged in, show a dashboard or redirect
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome back, {user.name}!</h2>
          <p className="text-gray-600 mb-6">Role: {user.role.replace('_', ' ').toUpperCase()}</p>
          <div className="space-y-4">
            <button
              onClick={() => redirectToDashboard(user.role)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('user');
                setUser(null);
              }}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login or register based on state
  return (
    <div className="App">
      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

export default App;