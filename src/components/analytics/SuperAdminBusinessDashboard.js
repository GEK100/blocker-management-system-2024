import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const SuperAdminBusinessDashboard = () => {
  const { user, userRole } = useSmartAuth();
  const [loading, setLoading] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState(new Set());

  // Business metrics state
  const [businessStats, setBusinessStats] = useState({
    totalCompanies: 0,
    totalProjects: 0,
    totalUsers: 0,
    activeCompanies: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    averageProjectsPerCompany: 0,
    averageUsersPerCompany: 0
  });

  const [companies, setCompanies] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all'); // all, 30days, 90days, year

  useEffect(() => {
    fetchBusinessData();
  }, [timeFilter]);

  const fetchBusinessData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockCompanies = [
        {
          id: 1,
          name: 'Apex Construction Group',
          status: 'active',
          subscriptionPlan: 'Enterprise',
          monthlyRevenue: 199,
          userCount: 45,
          projectCount: 12,
          joinDate: '2023-01-15',
          lastActive: '2024-01-20',
          projects: [
            {
              id: 1,
              name: 'Downtown Office Complex',
              status: 'active',
              createdDate: '2023-02-10',
              userCount: 12,
              progress: 75
            },
            {
              id: 2,
              name: 'Shopping Mall Renovation',
              status: 'completed',
              createdDate: '2023-03-15',
              userCount: 8,
              progress: 100
            },
            {
              id: 3,
              name: 'Residential Tower A',
              status: 'planning',
              createdDate: '2024-01-08',
              userCount: 5,
              progress: 15
            },
            {
              id: 4,
              name: 'Industrial Warehouse',
              status: 'active',
              createdDate: '2023-11-20',
              userCount: 9,
              progress: 45
            }
          ]
        },
        {
          id: 2,
          name: 'Metro Building Solutions',
          status: 'active',
          subscriptionPlan: 'Professional',
          monthlyRevenue: 79,
          userCount: 23,
          projectCount: 3,
          joinDate: '2023-03-22',
          lastActive: '2024-01-19',
          projects: [
            {
              id: 5,
              name: 'Hospital Wing Extension',
              status: 'active',
              createdDate: '2023-04-12',
              userCount: 15,
              progress: 60
            },
            {
              id: 6,
              name: 'School Modernization',
              status: 'active',
              createdDate: '2023-07-08',
              userCount: 6,
              progress: 25
            },
            {
              id: 7,
              name: 'Bridge Repair Project',
              status: 'on_hold',
              createdDate: '2023-09-14',
              userCount: 2,
              progress: 10
            }
          ]
        },
        {
          id: 3,
          name: 'Premier Contractors LLC',
          status: 'trial',
          subscriptionPlan: 'Professional',
          monthlyRevenue: 0,
          userCount: 8,
          projectCount: 2,
          joinDate: '2024-01-10',
          lastActive: '2024-01-18',
          projects: [
            {
              id: 8,
              name: 'Retail Store Fitout',
              status: 'planning',
              createdDate: '2024-01-12',
              userCount: 4,
              progress: 5
            },
            {
              id: 9,
              name: 'Office Renovation',
              status: 'active',
              createdDate: '2024-01-15',
              userCount: 4,
              progress: 20
            }
          ]
        },
        {
          id: 4,
          name: 'Summit Infrastructure',
          status: 'active',
          subscriptionPlan: 'Enterprise',
          monthlyRevenue: 199,
          userCount: 67,
          projectCount: 4,
          joinDate: '2022-11-08',
          lastActive: '2024-01-20',
          projects: [
            {
              id: 10,
              name: 'Highway Expansion Phase 2',
              status: 'active',
              createdDate: '2022-12-15',
              userCount: 25,
              progress: 85
            },
            {
              id: 11,
              name: 'Water Treatment Facility',
              status: 'active',
              createdDate: '2023-02-20',
              userCount: 18,
              progress: 40
            },
            {
              id: 12,
              name: 'Municipal Building',
              status: 'completed',
              createdDate: '2022-11-10',
              userCount: 15,
              progress: 100
            },
            {
              id: 13,
              name: 'Energy Plant Upgrade',
              status: 'planning',
              createdDate: '2024-01-05',
              userCount: 9,
              progress: 8
            }
          ]
        },
        {
          id: 5,
          name: 'Riverside Development',
          status: 'inactive',
          subscriptionPlan: 'Professional',
          monthlyRevenue: 0,
          userCount: 5,
          projectCount: 1,
          joinDate: '2023-08-15',
          lastActive: '2023-12-01',
          projects: [
            {
              id: 14,
              name: 'Waterfront Apartments',
              status: 'on_hold',
              createdDate: '2023-08-20',
              userCount: 5,
              progress: 30
            }
          ]
        }
      ];

      setCompanies(mockCompanies);

      // Calculate business statistics
      const totalCompanies = mockCompanies.length;
      const activeCompanies = mockCompanies.filter(c => c.status === 'active').length;
      const totalProjects = mockCompanies.reduce((sum, c) => sum + c.projectCount, 0);
      const totalUsers = mockCompanies.reduce((sum, c) => sum + c.userCount, 0);
      const monthlyRevenue = mockCompanies.reduce((sum, c) => sum + c.monthlyRevenue, 0);

      setBusinessStats({
        totalCompanies,
        totalProjects,
        totalUsers,
        activeCompanies,
        monthlyRevenue,
        growthRate: 18.5, // Mock growth rate
        averageProjectsPerCompany: Math.round(totalProjects / totalCompanies * 10) / 10,
        averageUsersPerCompany: Math.round(totalUsers / totalCompanies * 10) / 10
      });

    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanyExpansion = (companyId) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'active': return 'construction';
      case 'completed': return 'success';
      case 'planning': return 'info';
      case 'on_hold': return 'warning';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (userRole !== 'super_admin') {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Access Restricted</h3>
        <p className="text-slate-600">This dashboard is only available to Super Administrators.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Business Analytics</h2>
          <p className="text-slate-600 mt-1">Company-level metrics and system usage statistics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="all">All Time</option>
            <option value="year">Last 12 Months</option>
            <option value="90days">Last 90 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Companies</p>
              <p className="text-2xl font-bold text-slate-900">{businessStats.totalCompanies}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {businessStats.activeCompanies} active
                </span>
              </p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Projects</p>
              <p className="text-2xl font-bold text-slate-900">{businessStats.totalProjects}</p>
              <p className="text-sm text-slate-600 mt-1">
                Avg {businessStats.averageProjectsPerCompany} per company
              </p>
            </div>
            <FolderOpenIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{businessStats.totalUsers}</p>
              <p className="text-sm text-slate-600 mt-1">
                Avg {businessStats.averageUsersPerCompany} per company
              </p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(businessStats.monthlyRevenue)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                {businessStats.growthRate}% growth
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Enterprise ($199/mo)</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">2 companies</span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(398)}</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-construction-600 h-2 rounded-full" style={{width: '80%'}}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Professional ($79/mo)</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">2 companies</span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(79)}</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{width: '20%'}}></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">System Usage Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Active Companies</span>
              <span className="text-sm font-semibold text-slate-900">
                {businessStats.activeCompanies}/{businessStats.totalCompanies}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Trial Companies</span>
              <span className="text-sm font-semibold text-slate-900">1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Average Project Size</span>
              <span className="text-sm font-semibold text-slate-900">
                {Math.round(businessStats.totalUsers / businessStats.totalProjects)} users
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Platform Utilization</span>
              <span className="text-sm font-semibold text-green-600">87%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Companies List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Platform Companies</h3>
            <p className="text-sm text-slate-600 mt-1">
              Browse all companies and their project details
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Interactive</p>
            <p className="text-sm text-construction-600 font-medium">
              ▼ Click to expand
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <div key={company.id} className="border border-slate-200 rounded-lg">
              {/* Company Header */}
              <div
                className="group p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleCompanyExpansion(company.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {expandedCompanies.has(company.id) ? (
                        <ChevronDownIcon className="h-5 w-5 text-construction-600 transition-transform duration-200" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:text-construction-500" />
                      )}
                      <h4 className="ml-2 text-lg font-medium text-slate-900 hover:text-construction-600">
                        {company.name}
                      </h4>
                    </div>
                    <Badge variant={getStatusColor(company.status)} size="sm">
                      {company.status}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {company.subscriptionPlan}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{company.projectCount}</div>
                      <div>Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{company.userCount}</div>
                      <div>Users</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">
                        {company.monthlyRevenue > 0 ? formatCurrency(company.monthlyRevenue) : 'Trial'}
                      </div>
                      <div>Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-slate-900">{formatDate(company.lastActive)}</div>
                      <div>Last Active</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Projects List */}
              {expandedCompanies.has(company.id) && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <div className="p-4">
                    <h5 className="text-sm font-semibold text-slate-900 mb-3">
                      Projects ({company.projects.length})
                    </h5>
                    <div className="space-y-3">
                      {company.projects.map((project) => (
                        <div key={project.id} className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h6 className="text-sm font-semibold text-slate-900 mb-1">
                                {project.name}
                              </h6>
                              <div className="flex items-center space-x-4 text-xs text-slate-600">
                                <div className="flex items-center">
                                  <CalendarDaysIcon className="h-3 w-3 mr-1" />
                                  <span>Created {formatDate(project.createdDate)}</span>
                                </div>
                                <div className="flex items-center">
                                  <UserGroupIcon className="h-3 w-3 mr-1" />
                                  <span>{project.userCount} users</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={getProjectStatusColor(project.status)} size="xs">
                                {project.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {project.progress}%
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                project.status === 'completed' ? 'bg-green-500' :
                                project.status === 'active' ? 'bg-construction-500' :
                                project.status === 'on_hold' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-500">Progress</span>
                            <span className="text-xs font-medium text-slate-700">
                              {project.progress === 100 ? 'Complete' : `${project.progress}% done`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Company Summary */}
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <h5 className="text-sm font-semibold text-slate-900 mb-3">Company Overview</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium text-slate-700">Joined:</span>
                          <div className="text-slate-900">{formatDate(company.joinDate)}</div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Subscription:</span>
                          <div className="text-slate-900">{company.subscriptionPlan}</div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Monthly Revenue:</span>
                          <div className="text-slate-900">{company.monthlyRevenue > 0 ? formatCurrency(company.monthlyRevenue) : 'Trial'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Status:</span>
                          <div className={`font-medium ${
                            company.status === 'active' ? 'text-green-600' :
                            company.status === 'trial' ? 'text-yellow-600' :
                            'text-slate-500'
                          }`}>
                            {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminBusinessDashboard;