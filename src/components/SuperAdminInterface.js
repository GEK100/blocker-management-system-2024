import React from 'react';
import NavigationBar from './NavigationBar';
import { useSmartAuth } from '../hooks/useSmartAuth';
import SuperAdminBusinessDashboard from './analytics/SuperAdminBusinessDashboard';

const SuperAdminInterface = () => {
  const { user, userRole } = useSmartAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <SuperAdminBusinessDashboard />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminInterface;