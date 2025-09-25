import React from 'react';
import NavigationBar from './NavigationBar';
import { useAuth } from '../hooks/useAuth';
import CompanyAdminDashboard from './analytics/CompanyAdminDashboard';

const CompanyAdminInterface = () => {
  const { user, userRole, companyId } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Company Management</h1>
          <p className="text-slate-600 mt-2">Manage your company, projects, and team members</p>
        </div>
        <CompanyAdminDashboard companyId={companyId} />
      </div>
    </div>
  );
};

export default CompanyAdminInterface;