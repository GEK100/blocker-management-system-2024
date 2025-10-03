import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { subcontractorAPI } from '../lib/subcontractorAPI';
import { drawingAPI } from '../lib/drawingAPI';
import { blockerAPI } from '../lib/multitenant-api';
import notificationService from '../lib/notificationService';
import OfflineIndicator from './OfflineIndicator';

const SubcontractorDashboard = () => {
  const { user, userRole, logout } = useSmartAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [data, setData] = useState({
    team: [],
    projects: [],
    drawings: [],
    blockers: [],
    receivedBlockers: [],
    stats: {
      activeProjects: 0,
      teamMembers: 0,
      pendingBlockers: 0,
      resolvedBlockers: 0,
    }
  });

  useEffect(() => {
    loadDashboardData();
    setupNotifications();

    return () => {
      // Cleanup subscriptions
    };
  }, []);

  const setupNotifications = () => {
    // Subscribe to drawing uploads
    const unsubscribeDrawings = notificationService.subscribe('drawing_upload', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Refresh drawings data
      loadDrawingsData();
    });

    // Subscribe to user additions
    const unsubscribeUsers = notificationService.subscribe('user_addition', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Refresh team data
      loadTeamData();
    });

    // Subscribe to blocker assignments
    const unsubscribeBlockers = notificationService.subscribe('blocker_assignment', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Add to received blockers
      setData(prevData => ({
        ...prevData,
        receivedBlockers: [notification.data, ...prevData.receivedBlockers]
      }));
    });

    // Subscribe to user-specific notifications
    if (user?.id) {
      const unsubscribeUserNotifications = notificationService.subscribe(`user_${user.id}`, (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });
    }
  };

  const loadDrawingsData = async () => {
    try {
      const drawings = await drawingAPI.getDrawings();
      setData(prevData => ({ ...prevData, drawings }));
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  };

  const loadTeamData = async () => {
    try {
      const team = await subcontractorAPI.getTeamMembers();
      setData(prevData => ({ ...prevData, team }));
    } catch (error) {
      console.error('Error loading team:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [team, projects, drawings, blockers] = await Promise.all([
        subcontractorAPI.getTeamMembers(),
        subcontractorAPI.getProjects(),
        drawingAPI.getDrawings(),
        blockerAPI.getBlockers()
      ]);

      const receivedBlockers = blockers.filter(b =>
        b.assignedTo === user?.companyId || b.subcontractorId === user?.companyId
      );
      const raisedBlockers = blockers.filter(b => b.raisedBy === user?.id);

      setData({
        team,
        projects,
        drawings,
        blockers: raisedBlockers,
        receivedBlockers,
        stats: {
          activeProjects: projects.filter(p => p.status === 'active').length,
          teamMembers: team.length,
          pendingBlockers: raisedBlockers.filter(b => b.status === 'pending').length,
          resolvedBlockers: raisedBlockers.filter(b => b.status === 'resolved').length,
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/subcontractor-login');
  };

  const StatCard = ({ title, value, icon: Icon, color = 'emerald' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Projects"
          value={data.stats.activeProjects}
          icon={BuildingOffice2Icon}
          color="emerald"
        />
        <StatCard
          title="Team Members"
          value={data.stats.teamMembers}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Pending Blockers"
          value={data.stats.pendingBlockers}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="Resolved Blockers"
          value={data.stats.resolvedBlockers}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blockers */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Blockers</h3>
          <div className="space-y-3">
            {data.blockers.slice(0, 5).map((blocker) => (
              <div key={blocker.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{blocker.title}</p>
                  <p className="text-sm text-slate-600">{blocker.project}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  blocker.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  blocker.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {blocker.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Drawings */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Drawings</h3>
          <div className="space-y-3">
            {data.drawings.slice(0, 5).map((drawing) => (
              <div key={drawing.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{drawing.name}</p>
                  <p className="text-sm text-slate-600">{drawing.category}</p>
                </div>
                <button className="text-emerald-600 hover:text-emerald-700">
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Projects
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.team.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{member.name}</div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {member.projects?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBlockers = () => (
    <div className="space-y-6">
      {/* Raised Blockers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Blockers You've Raised</h3>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Raise Blocker
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-4">
            {data.blockers.map((blocker) => (
              <div key={blocker.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-900">{blocker.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{blocker.description}</p>
                    <p className="text-xs text-slate-500 mt-2">Project: {blocker.project}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    blocker.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    blocker.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {blocker.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Received Blockers */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Blockers Assigned to You</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4">
            {data.receivedBlockers.map((blocker) => (
              <div key={blocker.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-slate-900">{blocker.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{blocker.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Raised by: {blocker.raisedByName} | Project: {blocker.project}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      blocker.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      blocker.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blocker.status}
                    </span>
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-emerald-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-900">Subcontractor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <OfflineIndicator className="hidden sm:block" />
              <span className="text-sm text-slate-600">
                Welcome, {user?.name || user?.email}
              </span>
              {notifications.length > 0 && (
                <div className="relative">
                  <div className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {notifications.length}
                  </div>
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-slate-200">
                      <h4 className="font-medium text-slate-900">Recent Notifications</h4>
                    </div>
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="p-3 border-b border-slate-100 last:border-b-0">
                        <h5 className="font-medium text-sm text-slate-900">{notification.title}</h5>
                        <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 flex items-center"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'team', name: 'Team', icon: UserGroupIcon },
              { id: 'blockers', name: 'Blockers', icon: ExclamationTriangleIcon },
              { id: 'drawings', name: 'Drawings', icon: DocumentTextIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'team' && renderTeam()}
        {activeTab === 'blockers' && renderBlockers()}
        {activeTab === 'drawings' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Drawings</h3>
            <p className="text-slate-600">Drawings synchronized from project administration will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubcontractorDashboard;