import React from 'react';
import NavigationBar from './NavigationBar';
import { useSmartAuth } from '../hooks/useSmartAuth';
import SuperAdminBusinessDashboard from './analytics/SuperAdminBusinessDashboard';

const SuperAdminInterface = () => {
  const { user, userRole } = useSmartAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SuperAdminBusinessDashboard />
      </div>
    </div>
  );
};

export default SuperAdminInterface;