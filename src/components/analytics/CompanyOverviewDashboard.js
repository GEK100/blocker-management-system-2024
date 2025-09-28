import React, { useState } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  FolderOpenIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const CompanyOverviewDashboard = ({ companyId }) => {
  const { user, userRole } = useSmartAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview & Analytics', icon: ChartBarIcon },
    { id: 'project-navigation', label: 'Project Navigation', icon: FolderOpenIcon },
    { id: 'projects', label: 'Projects & Drawings', icon: FolderOpenIcon },
    { id: 'users', label: 'Team Management', icon: UserGroupIcon },
    { id: 'subcontractors', label: 'Subcontractors', icon: BuildingOfficeIcon },
    { id: 'lessons-learned', label: 'Lessons Learned', icon: LightBulbIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ];

  // Add platform-specific tabs for super admin
  if (userRole === 'super_admin') {
    tabs.splice(1, 0, { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {userRole === 'super_admin' ? 'Platform Overview' : 'Company Overview'}
        </h2>
        <p className="text-slate-600 mt-1">
          {userRole === 'super_admin'
            ? 'Manage platform companies, statistics, and system usage'
            : 'Manage your company statistics, team, and projects'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const buttonClasses = [
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
              isActive
                ? 'border-construction-500 text-construction-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            ].join(' ');

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={buttonClasses}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div>
            <h3>Overview content coming soon</h3>
          </div>
        )}
        {activeTab === 'projects' && (
          <div>
            <h3>Projects content coming soon</h3>
          </div>
        )}
        {activeTab === 'users' && (
          <div>
            <h3>Users content coming soon</h3>
          </div>
        )}
        {activeTab === 'subcontractors' && (
          <div>
            <h3>Subcontractors content coming soon</h3>
          </div>
        )}
        {activeTab === 'lessons-learned' && (
          <div>
            <h3>Lessons learned content coming soon</h3>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h3>Settings content coming soon</h3>
          </div>
        )}
        {activeTab === 'companies' && userRole === 'super_admin' && (
          <div>
            <h3>Companies content coming soon</h3>
          </div>
        )}
        {activeTab === 'project-navigation' && (
          <div>
            <h3>Project navigation content coming soon</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyOverviewDashboard;