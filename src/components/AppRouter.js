import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SmartAuthProvider, useSmartAuth } from '../hooks/useSmartAuth';
import LandingPage from './LandingPage';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import SuperAdminInterface from './SuperAdminInterface';
import SuperAdminDashboard from './SuperAdminDashboard';
import CompanyAdminInterface from './CompanyAdminInterface';
import FieldWorkerWrapper from './FieldWorkerWrapper';
import SubcontractorWrapper from './SubcontractorWrapper';
import SubcontractorLogin from './SubcontractorLogin';
import SubcontractorDashboard from './SubcontractorDashboard';
import GDPRConsentForm from './GDPRConsentForm';
import BlockerWorkflowManager from './BlockerWorkflowManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import RoleBasedDashboard from './RoleBasedDashboard';
import CompanyOnboarding from './onboarding/CompanyOnboarding';
import CompanyInvitationAccept from './CompanyInvitationAccept';
import UserInvitationAccept from './UserInvitationAccept';
import MultiTenantTestPage from './MultiTenantTestPage';
import CompanySetup from './CompanySetup';
import MandatoryPasswordChange from './MandatoryPasswordChange';
import CompanyAccessDenied from './CompanyAccessDenied';
import companyLifecycleAPI from '../lib/companyLifecycleAPI';

// Protected Route Component with Company Access Control
const ProtectedRoute = ({ children, allowedRoles = [], skipCompanyCheck = false }) => {
  const { user, userRole, userProfile, loading } = useSmartAuth();
  const [accessValidation, setAccessValidation] = useState(null);
  const [validationLoading, setValidationLoading] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      if (!user || skipCompanyCheck || userRole === 'super_admin') {
        setAccessValidation({ allowed: true });
        setValidationLoading(false);
        return;
      }

      try {
        const validation = await companyLifecycleAPI.validateUserAccess(user.id);
        setAccessValidation(validation);
      } catch (error) {
        console.error('Error validating user access:', error);
        setAccessValidation({
          allowed: false,
          reason: 'validation_error',
          message: 'Unable to validate access. Please try again or contact support.'
        });
      } finally {
        setValidationLoading(false);
      }
    };

    if (user && !loading) {
      validateAccess();
    } else if (!loading) {
      setValidationLoading(false);
    }
  }, [user, userRole, loading, skipCompanyCheck]);

  if (loading || validationLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check for mandatory password change
  if (accessValidation?.requiresPasswordChange) {
    return <Navigate to="/mandatory-password-change" replace />;
  }

  // Check company access (skip for super admin)
  if (!skipCompanyCheck && userRole !== 'super_admin' && accessValidation && !accessValidation.allowed) {
    if (accessValidation.reason === 'password_change_required') {
      return <Navigate to="/mandatory-password-change" replace />;
    }

    return (
      <CompanyAccessDenied
        companyStatus={accessValidation.companyStatus}
        companyName={accessValidation.company?.name || userProfile?.company?.name || 'Your Company'}
        message={accessValidation.message}
        reason={accessValidation.company?.suspension_reason}
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Router Component
const AppRouter = () => {
  return (
    <SmartAuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/subcontractor-login" element={<SubcontractorLogin />} />

          {/* Company Setup and Password Management - Public routes with token validation */}
          <Route path="/company-setup" element={<CompanySetup />} />
          <Route path="/company-onboarding" element={<CompanyOnboarding />} />
          <Route path="/accept-company-invitation" element={<CompanyInvitationAccept />} />
          <Route path="/accept-invitation" element={<UserInvitationAccept />} />

          {/* Mandatory Password Change - Protected but skips company check */}
          <Route path="/mandatory-password-change" element={
            <ProtectedRoute skipCompanyCheck={true}>
              <MandatoryPasswordChange />
            </ProtectedRoute>
          } />

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

          <Route path="/super-admin/dashboard" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/test-multitenant" element={
            <ProtectedRoute>
              <MultiTenantTestPage />
            </ProtectedRoute>
          } />

          <Route path="/company-admin" element={
            <ProtectedRoute allowedRoles={['company_admin', 'company_owner']}>
              <CompanyAdminInterface />
            </ProtectedRoute>
          } />

          <Route path="/mobile" element={
            <ProtectedRoute allowedRoles={['field_worker', 'supervisor']}>
              <FieldWorkerWrapper />
            </ProtectedRoute>
          } />

          <Route path="/subcontractor" element={
            <ProtectedRoute allowedRoles={['subcontractor', 'subcontractor_manager']}>
              <SubcontractorWrapper />
            </ProtectedRoute>
          } />

          <Route path="/subcontractor-dashboard" element={
            <ProtectedRoute allowedRoles={['subcontractor', 'subcontractor_manager']}>
              <SubcontractorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/blockers" element={
            <ProtectedRoute>
              <BlockerWorkflowManager />
            </ProtectedRoute>
          } />


          {/* Dashboard - Role-based redirect */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </SmartAuthProvider>
  );
};

// Dashboard Router - redirects based on user role
const DashboardRouter = () => {
  const { user, userRole, loading } = useSmartAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
    case 'supervisor':
      return <Navigate to="/mobile" replace />;

    case 'subcontractor':
    case 'subcontractor_manager':
      return <Navigate to="/subcontractor-dashboard" replace />;

    case 'main_contractor':
    case 'project_manager':
    default:
      return <RoleBasedDashboard />;
  }
};

export default AppRouter;