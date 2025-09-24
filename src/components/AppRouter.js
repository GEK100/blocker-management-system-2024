import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import LandingPage from './LandingPage';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import SuperAdminInterface from './SuperAdminInterface';
import CompanyAdminInterface from './CompanyAdminInterface';
import MobileFieldWorkerInterface from './MobileFieldWorkerInterface';
import GDPRConsentForm from './GDPRConsentForm';
import BlockerWorkflowManager from './BlockerWorkflowManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import RoleBasedDashboard from './RoleBasedDashboard';
import MainApp from './MainApp'; // This will be the existing App component content

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Router Component
const AppRouter = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* GDPR Consent */}
          <Route path="/consent" element={
            <ProtectedRoute>
              <GDPRConsentForm />
            </ProtectedRoute>
          } />

          {/* Role-based Dashboard Routes */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          } />

          {/* Legacy Analytics Dashboard (admin only) */}
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'company_owner']}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />

          {/* Role-specific Interface Routes */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminInterface />
            </ProtectedRoute>
          } />

          <Route path="/company-admin" element={
            <ProtectedRoute allowedRoles={['company_admin', 'company_owner']}>
              <CompanyAdminInterface />
            </ProtectedRoute>
          } />

          <Route path="/mobile" element={
            <ProtectedRoute allowedRoles={['field_worker', 'subcontractor', 'supervisor']}>
              <MobileFieldWorkerInterface />
            </ProtectedRoute>
          } />

          <Route path="/blockers" element={
            <ProtectedRoute>
              <BlockerWorkflowManager />
            </ProtectedRoute>
          } />

          {/* Main Application (legacy) */}
          <Route path="/app" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />

          {/* Dashboard - Role-based redirect */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

// Dashboard Router - redirects based on user role
const DashboardRouter = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based dashboard routing
  switch (userRole) {
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;

    case 'company_owner':
    case 'company_admin':
      return <Navigate to="/company-admin" replace />;

    case 'field_worker':
    case 'subcontractor':
    case 'supervisor':
      return <Navigate to="/mobile" replace />;

    case 'main_contractor':
    case 'project_manager':
    case 'subcontractor_manager':
    default:
      return <RoleBasedDashboard />;
  }
};

export default AppRouter;