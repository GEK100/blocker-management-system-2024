import React from 'react';
import NavigationBar from './NavigationBar';
import { useSmartAuth } from '../hooks/useSmartAuth';
import CompanyOverviewDashboard from './analytics/CompanyOverviewDashboard';

const CompanyAdminInterface = () => {
  const { user, userRole, companyId } = useSmartAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <CompanyOverviewDashboard companyId={companyId} />
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminInterface;