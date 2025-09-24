import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CameraIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BellIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import ModernBlockerCard from './ModernBlockerCard';

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    construction: 'border-construction-500 bg-construction-50 text-construction-700',
    success: 'border-success-500 bg-success-50 text-success-700',
    warning: 'border-warning-500 bg-warning-50 text-warning-700',
    safety: 'border-safety-500 bg-safety-50 text-safety-700'
  };

  return (
    <div className="card card-hover">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {change && (
                <span className={`ml-2 text-sm font-medium ${
                  trend === 'up' ? 'text-success-600' :
                  trend === 'down' ? 'text-safety-600' :
                  'text-slate-500'
                }`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ title, description, icon: Icon, onClick, color = 'construction' }) => {
  const colorClasses = {
    construction: 'hover:bg-construction-50 border-construction-200 hover:border-construction-300',
    blue: 'hover:bg-blue-50 border-blue-200 hover:border-blue-300',
    success: 'hover:bg-success-50 border-success-200 hover:border-success-300'
  };

  return (
    <button
      onClick={onClick}
      className={`card w-full text-left p-4 transition-colors duration-200 ${colorClasses[color]}`}
    >
      <div className="flex items-center">
        <Icon className="h-8 w-8 text-slate-600 mr-3" />
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </button>
  );
};

const FilterChip = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
      active
        ? 'bg-construction-100 text-construction-800 border border-construction-300'
        : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
        active ? 'bg-construction-200' : 'bg-slate-200'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const ModernDashboard = ({ user, company, blockers = [], contractors = [], onCreateBlocker, onBlockerAction }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Calculate stats
  const stats = {
    total: blockers.length,
    pending: blockers.filter(b => b.status === 'pending_review').length,
    assigned: blockers.filter(b => b.status === 'assigned').length,
    completed: blockers.filter(b => b.status === 'completed').length,
    verified: blockers.filter(b => b.status === 'verified_complete').length,
    rejected: blockers.filter(b => b.status === 'rejected').length
  };

  // Filter blockers
  const filteredBlockers = blockers.filter(blocker => {
    const matchesFilter = activeFilter === 'all' || blocker.status === activeFilter;
    const matchesSearch = !searchTerm ||
      blocker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blocker.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blocker.location?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filters = [
    { key: 'all', label: 'All Blockers', count: stats.total },
    { key: 'pending_review', label: 'Pending Review', count: stats.pending },
    { key: 'assigned', label: 'Assigned', count: stats.assigned },
    { key: 'completed', label: 'Awaiting Verification', count: stats.completed },
    { key: 'verified_complete', label: 'Verified Complete', count: stats.verified },
    { key: 'rejected', label: 'Rejected', count: stats.rejected }
  ];

  return (
    <div className=\"min-h-screen bg-slate-50\">
      {/* Header */}
      <div className=\"bg-gradient-construction shadow-construction-lg\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
          <div className=\"flex items-center justify-between h-16\">
            <div className=\"flex items-center\">
              <BuildingOfficeIcon className=\"h-8 w-8 text-white mr-3\" />
              <div>
                <h1 className=\"text-xl font-bold text-white\">
                  {company?.name || 'Construction Dashboard'}
                </h1>
                <p className=\"text-construction-100 text-sm\">
                  Welcome back, {user?.full_name || 'User'}
                </p>
              </div>
            </div>

            <div className=\"flex items-center space-x-4\">
              <button className=\"p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors duration-200\">
                <BellIcon className=\"h-5 w-5\" />
              </button>
              <button className=\"p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors duration-200\">
                <CogIcon className=\"h-5 w-5\" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {/* Stats Grid */}
        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8\">
          <StatsCard
            title=\"Total Blockers\"
            value={stats.total}
            icon={ChartBarIcon}
            color=\"blue\"
          />
          <StatsCard
            title=\"Pending Review\"
            value={stats.pending}
            icon={ClockIcon}
            color=\"warning\"
          />
          <StatsCard
            title=\"In Progress\"
            value={stats.assigned}
            icon={UserGroupIcon}
            color=\"construction\"
          />
          <StatsCard
            title=\"Awaiting Verification\"
            value={stats.completed}
            icon={CheckCircleIcon}
            color=\"success\"
          />
          <StatsCard
            title=\"Verified Complete\"
            value={stats.verified}
            icon={CheckCircleIconSolid}
            color=\"success\"
          />
        </div>

        {/* Quick Actions */}
        <div className=\"mb-8\">
          <h2 className=\"text-lg font-semibold text-slate-900 mb-4\">Quick Actions</h2>
          <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4\">
            <QuickAction
              title=\"Create New Blocker\"
              description=\"Report a new issue or obstruction\"
              icon={PlusIcon}
              onClick={onCreateBlocker}
              color=\"construction\"
            />
            <QuickAction
              title=\"Take Photos\"
              description=\"Capture site documentation\"
              icon={CameraIcon}
              onClick={() => {}}
              color=\"blue\"
            />
            <QuickAction
              title=\"View Analytics\"
              description=\"Performance insights and reports\"
              icon={ChartBarIcon}
              onClick={() => {}}
              color=\"success\"
            />
            <QuickAction
              title=\"Manage Team\"
              description=\"Invite and assign team members\"
              icon={UserGroupIcon}
              onClick={() => {}}
              color=\"blue\"
            />
          </div>
        </div>

        {/* Blockers Section */}
        <div className=\"mb-8\">
          <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6\">
            <h2 className=\"text-lg font-semibold text-slate-900 mb-4 sm:mb-0\">
              Blocker Management
            </h2>

            {/* Search and Filter */}
            <div className=\"flex flex-col sm:flex-row gap-4\">
              <div className=\"relative\">
                <MagnifyingGlassIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400\" />
                <input
                  type=\"text\"
                  placeholder=\"Search blockers...\"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=\"form-input pl-10 w-full sm:w-64\"
                />
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className=\"flex flex-wrap gap-2 mb-6\">
            {filters.map(filter => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                active={activeFilter === filter.key}
                onClick={() => setActiveFilter(filter.key)}
                count={filter.count}
              />
            ))}
          </div>

          {/* Blockers Grid */}
          {filteredBlockers.length > 0 ? (
            <div className=\"grid grid-cols-1 gap-6\">
              {filteredBlockers.map(blocker => (
                <ModernBlockerCard
                  key={blocker.id}
                  blocker={blocker}
                  onAction={onBlockerAction}
                  user={user}
                />
              ))}
            </div>
          ) : (
            <div className=\"card text-center py-12\">
              <ExclamationTriangleIcon className=\"h-16 w-16 text-slate-400 mx-auto mb-4\" />
              <h3 className=\"text-lg font-semibold text-slate-900 mb-2\">No blockers found</h3>
              <p className=\"text-slate-600 mb-6\">
                {searchTerm
                  ? `No blockers match your search for \"${searchTerm}\"`
                  : activeFilter === 'all'
                    ? 'No blockers have been created yet'
                    : `No blockers with status \"${activeFilter}\"`
                }
              </p>
              {activeFilter === 'all' && !searchTerm && (
                <button
                  onClick={onCreateBlocker}
                  className=\"btn btn-primary\"
                >
                  <PlusIcon className=\"h-5 w-5 mr-2\" />
                  Create Your First Blocker
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;