import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import { subcontractorAPI } from '../../lib/subcontractorAPI';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';

const CompanyOverviewDashboard = ({ companyId }) => {
  const { user, userRole } = useSmartAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [subcontractors, setSubcontractors] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // Company/Platform Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalBlockers: 0,
    resolvedBlockers: 0,
    activeSubcontractors: 0,
    totalCompanies: 0,
    monthlyGrowth: 0
  });

  // Company Analytics Data
  const [analytics, setAnalytics] = useState({
    blockersByType: [],
    resolutionTimes: [],
    problematicLocations: [],
    contractorPerformance: [],
    blockerTrends: [],
    avgResolutionTime: 0,
    criticalBlockersCount: 0,
    overdueBlockersCount: 0
  });

  // Form states
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'field_worker'
  });

  const [subcontractorFormData, setSubcontractorFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    tradeType: '',
    projectIds: []
  });

  const [isEditingSubcontractor, setIsEditingSubcontractor] = useState(false);
  const [editingSubcontractorId, setEditingSubcontractorId] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSubcontractorForm, setShowSubcontractorForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const generateAnalyticsData = (subcontractors, projects, totalBlockers) => {
    // Generate blocker types breakdown
    const blockerTypes = [
      { name: 'Electrical', value: Math.floor(totalBlockers * 0.3), color: '#f59e0b' },
      { name: 'Plumbing', value: Math.floor(totalBlockers * 0.25), color: '#3b82f6' },
      { name: 'HVAC', value: Math.floor(totalBlockers * 0.2), color: '#10b981' },
      { name: 'Structural', value: Math.floor(totalBlockers * 0.15), color: '#ef4444' },
      { name: 'Other', value: Math.floor(totalBlockers * 0.1), color: '#8b5cf6' }
    ];

    // Generate resolution times by subcontractor
    const resolutionData = subcontractors.slice(0, 5).map((sub, index) => ({
      contractor: sub.name,
      company: sub.company_name || sub.companyName,
      avgHours: 24 + (index * 12) + Math.random() * 24,
      blockersSolved: 5 + Math.floor(Math.random() * 15),
      tradeType: sub.trade_type || sub.tradeType
    }));

    // Generate problematic locations
    const locations = [
      { floor: 'Ground Floor', issues: 8, severity: 'High' },
      { floor: '2nd Floor', issues: 6, severity: 'Medium' },
      { floor: 'Basement', issues: 5, severity: 'High' },
      { floor: '1st Floor', issues: 4, severity: 'Low' },
      { floor: '3rd Floor', issues: 3, severity: 'Medium' }
    ];

    // Generate contractor performance
    const performance = subcontractors.slice(0, 6).map((sub, index) => ({
      id: sub.id,
      name: sub.name,
      company: sub.company_name || sub.companyName,
      tradeType: sub.trade_type || sub.tradeType,
      efficiency: 85 + Math.random() * 15,
      completionRate: 88 + Math.random() * 12,
      avgRating: 4.2 + Math.random() * 0.8,
      totalJobs: 15 + Math.floor(Math.random() * 25),
      onTimeDelivery: 85 + Math.random() * 15
    }));

    // Generate blocker trends (last 7 days)
    const trends = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      created: Math.floor(Math.random() * 5) + 2,
      resolved: Math.floor(Math.random() * 4) + 1
    }));

    setAnalytics({
      blockersByType: blockerTypes,
      resolutionTimes: resolutionData,
      problematicLocations: locations,
      contractorPerformance: performance,
      blockerTrends: trends,
      avgResolutionTime: 48 + Math.random() * 24,
      criticalBlockersCount: Math.floor(totalBlockers * 0.15),
      overdueBlockersCount: Math.floor(totalBlockers * 0.08)
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load subcontractors with proper company ID
      const currentCompanyId = companyId || 'demo_company';

      // Initialize demo data if none exists
      const result = await subcontractorAPI.getSubcontractors(currentCompanyId);
      if (result.success && result.subcontractors.length === 0) {
        // Create demo data
        await subcontractorAPI.createDemoData(currentCompanyId);
        const updatedResult = await subcontractorAPI.getSubcontractors(currentCompanyId);
        if (updatedResult.success) {
          setSubcontractors(updatedResult.subcontractors.filter(sub => sub.status === 'active'));
        }
      } else if (result.success) {
        setSubcontractors(result.subcontractors.filter(sub => sub.status === 'active'));
      } else {
        console.error('Failed to load subcontractors:', result.error);
        setSubcontractors([]);
      }

      // Mock data for demo - replace with actual API calls
      const mockUsers = [
        { id: 1, name: 'John Smith', email: 'john@company.com', role: 'field_worker', status: 'active' },
        { id: 2, name: 'Jane Doe', email: 'jane@company.com', role: 'supervisor', status: 'active' },
        { id: 3, name: 'Bob Wilson', email: 'bob@company.com', role: 'project_manager', status: 'inactive' }
      ];

      const mockProjects = [
        { id: 1, name: 'Downtown Office Complex', status: 'active', blockers: 5 },
        { id: 2, name: 'Residential Tower A', status: 'planning', blockers: 2 },
        { id: 3, name: 'Shopping Center Renovation', status: 'completed', blockers: 0 }
      ];

      setUsers(mockUsers);
      setProjects(mockProjects);

      // Calculate stats
      const totalBlockers = mockProjects.reduce((sum, p) => sum + p.blockers, 0);
      setStats({
        totalUsers: mockUsers.length,
        totalProjects: mockProjects.length,
        totalBlockers: totalBlockers,
        resolvedBlockers: Math.floor(totalBlockers * 0.6),
        activeSubcontractors: subcontractors.length,
        totalCompanies: userRole === 'super_admin' ? 12 : 1,
        monthlyGrowth: 15.8
      });

      // Generate analytics data
      generateAnalyticsData(subcontractors, mockProjects, totalBlockers);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mock user creation - replace with actual API call
      const newUser = {
        id: Date.now(),
        ...userFormData,
        status: 'active'
      };
      setUsers([...users, newUser]);
      setUserFormData({ name: '', email: '', role: 'field_worker' });
      setShowUserForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleSubcontractorSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentCompanyId = companyId || 'demo_company';

      if (isEditingSubcontractor && editingSubcontractorId) {
        const result = await subcontractorAPI.updateSubcontractor(currentCompanyId, editingSubcontractorId, subcontractorFormData);
        if (result.success) {
          setSubcontractors(subcontractors.map(s => s.id === editingSubcontractorId ? result.subcontractor : s));
          resetSubcontractorForm();
        } else {
          alert('Error updating subcontractor: ' + result.error);
        }
      } else {
        const result = await subcontractorAPI.createSubcontractor(currentCompanyId, subcontractorFormData);
        if (result.success) {
          setSubcontractors([...subcontractors, result.subcontractor]);
          resetSubcontractorForm();
        } else {
          alert('Error creating subcontractor: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      alert('Error saving subcontractor');
    }
  };

  const resetSubcontractorForm = () => {
    setSubcontractorFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      tradeType: '',
      projectIds: []
    });
    setIsEditingSubcontractor(false);
    setEditingSubcontractorId(null);
    setShowSubcontractorForm(false);
  };

  const handleEditSubcontractor = (subcontractor) => {
    setSubcontractorFormData({
      name: subcontractor.name,
      companyName: subcontractor.company_name || subcontractor.companyName,
      email: subcontractor.email,
      phone: subcontractor.phone,
      tradeType: subcontractor.trade_type || subcontractor.tradeType,
      projectIds: subcontractor.project_access || subcontractor.projectIds || []
    });
    setIsEditingSubcontractor(true);
    setEditingSubcontractorId(subcontractor.id);
    setShowSubcontractorForm(true);
  };

  const handleDeleteSubcontractor = async (id) => {
    if (window.confirm('Are you sure you want to delete this subcontractor?')) {
      try {
        const currentCompanyId = companyId || 'demo_company';
        const result = await subcontractorAPI.deleteSubcontractor(currentCompanyId, id);
        if (result.success) {
          setSubcontractors(subcontractors.filter(s => s.id !== id));
        } else {
          alert('Error deleting subcontractor: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting subcontractor:', error);
        alert('Error deleting subcontractor');
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'projects', label: 'Projects', icon: FolderOpenIcon },
    { id: 'users', label: 'Team Management', icon: UserGroupIcon },
    { id: 'subcontractors', label: 'Subcontractors', icon: BuildingOfficeIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ];

  // Add platform-specific tabs for super admin
  if (userRole === 'super_admin') {
    tabs.splice(1, 0, { id: 'companies', label: 'Companies', icon: BuildingOfficeIcon });
  }

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Company Analytics</h3>
        <p className="text-slate-600 mt-1">Detailed performance metrics and insights</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(analytics.avgResolutionTime)}h</p>
              <p className="text-xs text-green-600 mt-1">12% faster this month</p>
            </div>
            <ClockIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Critical Blockers</p>
              <p className="text-2xl font-bold text-red-600">{analytics.criticalBlockersCount}</p>
              <p className="text-xs text-slate-500 mt-1">Requiring immediate attention</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Overdue Items</p>
              <p className="text-2xl font-bold text-yellow-600">{analytics.overdueBlockersCount}</p>
              <p className="text-xs text-slate-500 mt-1">Past expected completion</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Contractors</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeSubcontractors}</p>
              <p className="text-xs text-green-600 mt-1">All operational</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blocker Types Breakdown */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Blocker Types Breakdown</h4>
          <div className="space-y-4">
            {analytics.blockersByType.map((type, index) => {
              const percentage = Math.round((type.value / stats.totalBlockers) * 100);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span className="text-sm font-medium text-slate-700">{type.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{type.value}</span>
                    <span className="text-xs text-slate-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly Blocker Trends */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Weekly Trends</h4>
          <div className="space-y-4">
            {analytics.blockerTrends.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{day.date}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">{day.created} created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">{day.resolved} resolved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resolution Times by Contractor */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Resolution Times by Contractor</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Trade Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Resolution (hours)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Blockers Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {analytics.resolutionTimes.map((contractor, index) => {
                const performanceColor = contractor.avgHours < 36 ? 'text-green-600' :
                                       contractor.avgHours < 60 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{contractor.contractor}</div>
                        <div className="text-sm text-slate-500">{contractor.company}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="construction" size="sm">{contractor.tradeType}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${performanceColor}`}>
                        {Math.round(contractor.avgHours)}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {contractor.blockersSolved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contractor.avgHours < 36 ? 'bg-green-100 text-green-800' :
                        contractor.avgHours < 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {contractor.avgHours < 36 ? 'Excellent' : contractor.avgHours < 60 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Location Analysis and Contractor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Problematic Locations */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Problematic Locations</h4>
          <div className="space-y-4">
            {analytics.problematicLocations.map((location, index) => {
              const severityColor = location.severity === 'High' ? 'bg-red-100 text-red-800' :
                                   location.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-green-100 text-green-800';
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{location.floor}</div>
                    <div className="text-sm text-slate-600">{location.issues} active issues</div>
                  </div>
                  <Badge variant="secondary" className={severityColor}>
                    {location.severity}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Performing Contractors */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Contractor Performance</h4>
          <div className="space-y-4">
            {analytics.contractorPerformance.slice(0, 5).map((contractor, index) => {
              const efficiency = Math.round(contractor.efficiency);
              const rating = contractor.avgRating.toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{contractor.name}</div>
                    <div className="text-sm text-slate-600">{contractor.company}</div>
                    <Badge variant="construction" size="sm" className="mt-1">{contractor.tradeType}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{efficiency}% efficiency</div>
                    <div className="text-sm text-slate-600">★ {rating} rating</div>
                    <div className="text-xs text-slate-500">{contractor.totalJobs} total jobs</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total {userRole === 'super_admin' ? 'Companies' : 'Projects'}</p>
              <p className="text-2xl font-bold text-slate-900">{userRole === 'super_admin' ? stats.totalCompanies : stats.totalProjects}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Blockers</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalBlockers - stats.resolvedBlockers}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round((stats.resolvedBlockers / stats.totalBlockers) * 100)}%</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm text-slate-600">Blocker resolved in Downtown Office Complex</span>
            <span className="text-xs text-slate-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-slate-600">New team member added to Residential Tower A</span>
            <span className="text-xs text-slate-400">4 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-slate-600">New blocker reported in Shopping Center</span>
            <span className="text-xs text-slate-400">6 hours ago</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
        <Button variant="primary" size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">{project.name}</h4>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge
                    variant={project.status === 'active' ? 'construction' : project.status === 'completed' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {project.status}
                  </Badge>
                  <span className="text-sm text-slate-600">{project.blockers} active blockers</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUserForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* User Form */}
      {showUserForm && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Add New User</h4>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
              >
                <option value="field_worker">Field Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="project_manager">Project Manager</option>
                <option value="subcontractor">Subcontractor</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <Button type="submit" variant="primary">Add User</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUserForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">{user.name}</h4>
                <p className="text-sm text-slate-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="secondary" size="sm">{user.role.replace('_', ' ')}</Badge>
                  <Badge
                    variant={user.status === 'active' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubcontractors = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Subcontractors</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowSubcontractorForm(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Subcontractor
        </Button>
      </div>

      {/* Subcontractor Form */}
      {showSubcontractorForm && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">
            {isEditingSubcontractor ? 'Edit' : 'Add New'} Subcontractor
          </h4>
          <form onSubmit={handleSubcontractorSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={subcontractorFormData.name}
                  onChange={(e) => setSubcontractorFormData({...subcontractorFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={subcontractorFormData.companyName}
                  onChange={(e) => setSubcontractorFormData({...subcontractorFormData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="e.g., Elite Electrical LLC"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={subcontractorFormData.email}
                  onChange={(e) => setSubcontractorFormData({...subcontractorFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="john@eliteelectrical.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={subcontractorFormData.phone}
                  onChange={(e) => setSubcontractorFormData({...subcontractorFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trade Type</label>
              <select
                value={subcontractorFormData.tradeType}
                onChange={(e) => setSubcontractorFormData({...subcontractorFormData, tradeType: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                required
              >
                <option value="">Select Trade Type</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="concrete">Concrete</option>
                <option value="roofing">Roofing</option>
                <option value="flooring">Flooring</option>
                <option value="painting">Painting</option>
                <option value="drywall">Drywall</option>
                <option value="insulation">Insulation</option>
                <option value="landscaping">Landscaping</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <Button type="submit" variant="primary">
                {isEditingSubcontractor ? 'Update' : 'Add'} Subcontractor
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetSubcontractorForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Subcontractors List */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ) : subcontractors.length === 0 ? (
          <Card className="p-6 text-center">
            <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Subcontractors Yet</h3>
            <p className="text-slate-600 mb-4">Add your first subcontractor to get started.</p>
            <Button
              variant="primary"
              onClick={() => setShowSubcontractorForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Subcontractor
            </Button>
          </Card>
        ) : (
          subcontractors.map((subcontractor) => (
            <Card key={subcontractor.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{subcontractor.name}</h4>
                  <p className="text-sm text-slate-600">{subcontractor.company_name || subcontractor.companyName}</p>
                  <div className="flex items-center flex-wrap gap-3 mt-2">
                    <Badge variant="construction" size="sm">
                      {subcontractor.trade_type || subcontractor.tradeType}
                    </Badge>
                    <span className="text-sm text-slate-600">{subcontractor.email}</span>
                    {subcontractor.phone && (
                      <span className="text-sm text-slate-600">{subcontractor.phone}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSubcontractor(subcontractor)}
                    title="Edit subcontractor"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubcontractor(subcontractor.id)}
                    title="Delete subcontractor"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Settings</h3>
      <Card className="p-6">
        <h4 className="text-md font-semibold text-slate-900 mb-4">
          {userRole === 'super_admin' ? 'Platform Settings' : 'Company Settings'}
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Email Notifications</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Auto-assign Blockers</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Weekly Reports</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCompanies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Platform Companies</h3>
        <Button variant="primary" size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Mock companies for super admin */}
      <div className="grid gap-4">
        {Array.from({length: 5}, (_, i) => ({
          id: i + 1,
          name: `Construction Company ${i + 1}`,
          users: Math.floor(Math.random() * 50) + 5,
          projects: Math.floor(Math.random() * 10) + 1,
          status: Math.random() > 0.3 ? 'active' : 'trial'
        })).map((company) => (
          <Card key={company.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">{company.name}</h4>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge
                    variant={company.status === 'active' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {company.status}
                  </Badge>
                  <span className="text-sm text-slate-600">{company.users} users</span>
                  <span className="text-sm text-slate-600">{company.projects} projects</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

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
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-construction-500 text-construction-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'companies' && userRole === 'super_admin' && renderCompanies()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'subcontractors' && renderSubcontractors()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default CompanyOverviewDashboard;