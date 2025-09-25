import React from 'react';
import NavigationBar from './NavigationBar';
import { useSmartAuth } from '../hooks/useSmartAuth';
import SuperAdminDashboard from './analytics/SuperAdminDashboard';

const SuperAdminInterface = () => {
  const { user, userRole } = useSmartAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Panel</h1>
          <p className="text-slate-600 mt-2">Platform-wide management and oversight</p>
        </div>
        <SuperAdminDashboard />
      </div>
    </div>
  );
};

export default SuperAdminInterface;