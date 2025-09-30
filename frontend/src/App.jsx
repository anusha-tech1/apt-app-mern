import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CommitteeDashboard from './pages/CommitteeDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import Unauthorized from './pages/Unauthorized';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

const getCurrentUser = () => {
  const saved = localStorage.getItem('user');
  if (!saved) return null;
  try { return JSON.parse(saved); } catch { return null; }
};

const RoleRedirect = () => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'committee_member':
      return <Navigate to="/committee-dashboard" replace />;
    case 'staff':
      return <Navigate to="/staff-dashboard" replace />;
    case 'resident':
      return <Navigate to="/resident-dashboard" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

const ProtectedRoute = ({ children, allowed }) => {
  const location = useLocation();
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee-dashboard"
        element={
          <ProtectedRoute allowed={["admin", "committee_member"]}>
            <CommitteeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident-dashboard"
        element={
          <ProtectedRoute allowed={["resident", "admin", "committee_member"]}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute allowed={["staff", "admin"]}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowed={["admin"]}>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}