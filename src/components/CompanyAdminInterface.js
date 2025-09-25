import React from 'react';
import NavigationBar from './NavigationBar';
import { useSmartAuth } from '../hooks/useSmartAuth';
import CompanyOverviewDashboard from './analytics/CompanyOverviewDashboard';

const CompanyAdminInterface = () => {
  const { user, userRole, companyId } = useSmartAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompanyOverviewDashboard companyId={companyId} />
      </div>
    </div>
  );
};

export default CompanyAdminInterface;