import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const [data, setData] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    companyGrowth: [],
    subscriptionStatus: [],
    companyUsage: [],
    recentCompanies: []
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);

      // In a real app, this would fetch from actual database
      // For now, using mock data that represents system-wide metrics
      const mockSystemData = {
        totalCompanies: 24,
        totalUsers: 187,
        activeSubscriptions: 22,
        monthlyRevenue: 12850,
        companyGrowth: [
          { month: 'Jan', companies: 18, revenue: 9200 },
          { month: 'Feb', companies: 20, revenue: 10400 },
          { month: 'Mar', companies: 22, revenue: 11600 },
          { month: 'Apr', companies: 24, revenue: 12850 }
        ],
        subscriptionStatus: [
          { name: 'Active', value: 22, color: '#10b981' },
          { name: 'Trial', value: 2, color: '#f59e0b' },
          { name: 'Overdue', value: 1, color: '#ef4444' }
        ],
        companyUsage: [
          { name: 'High Usage', companies: 8, color: '#10b981' },
          { name: 'Medium Usage', companies: 12, color: '#f59e0b' },
          { name: 'Low Usage', companies: 4, color: '#6b7280' }
        ]
      };

      const mockCompanies = [
        {
          id: 1,
          name: 'ABC Construction Ltd',
          status: 'active',
          subscription: 'pro',
          users: 12,
          projects: 8,
          lastActive: '2024-01-15',
          monthlyRevenue: 199,
          paymentStatus: 'current'
        },
        {
          id: 2,
          name: 'BuildRight Solutions',
          status: 'active',
          subscription: 'enterprise',
          users: 25,
          projects: 15,
          lastActive: '2024-01-14',
          monthlyRevenue: 499,
          paymentStatus: 'current'
        },
        {
          id: 3,
          name: 'Metro Builders',
          status: 'trial',
          subscription: 'trial',
          users: 5,
          projects: 3,
          lastActive: '2024-01-13',
          monthlyRevenue: 0,
          paymentStatus: 'trial'
        },
        {
          id: 4,
          name: 'Elite Construction',
          status: 'active',
          subscription: 'pro',
          users: 18,
          projects: 12,
          lastActive: '2024-01-12',
          monthlyRevenue: 199,
          paymentStatus: 'overdue'
        }
      ];

      setData(mockSystemData);
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setShowCreateCompany(true);
  };

  const handleGenerateInvite = (company) => {
    setSelectedCompany(company);
    setShowInviteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
          <p className="text-slate-600">Manage companies, subscriptions, and platform-wide settings</p>
        </div>
        <Button
          onClick={handleCreateCompany}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Company</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <CardGrid>
        <StatCard
          title="Total Companies"
          value={data.totalCompanies}
          icon={BuildingOfficeIcon}
          trend={{ value: 12, isPositive: true }}
          subtitle="Active organizations"
        />
        <StatCard
          title="Platform Users"
          value={data.totalUsers}
          icon={UserGroupIcon}
          trend={{ value: 8, isPositive: true }}
          subtitle="Across all companies"
        />
        <StatCard
          title="Active Subscriptions"
          value={data.activeSubscriptions}
          icon={CheckCircleIcon}
          trend={{ value: 5, isPositive: true }}
          subtitle="Paying customers"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${data.monthlyRevenue.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          trend={{ value: 15, isPositive: true }}
          subtitle="Recurring revenue"
        />
      </CardGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Growth */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Growth & Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.companyGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" opacity={0.3} />
              <Line yAxisId="left" type="monotone" dataKey="companies" stroke="#0ea5e9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Subscription Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Subscription Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.subscriptionStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
              >
                {data.subscriptionStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {data.subscriptionStatus.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Company Management Table */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Company Management</h3>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Users/Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{company.name}</div>
                        <div className="text-sm text-slate-500">Last active: {company.lastActive}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        company.subscription === 'enterprise' ? 'primary' :
                        company.subscription === 'pro' ? 'success' :
                        'warning'
                      }
                    >
                      {company.subscription.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div>{company.users} users</div>
                    <div className="text-slate-500">{company.projects} projects</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    ${company.monthlyRevenue}/mo
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        company.paymentStatus === 'current' ? 'success' :
                        company.paymentStatus === 'trial' ? 'warning' :
                        'danger'
                      }
                    >
                      {company.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateInvite(company)}
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Invite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Company</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="admin@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subscription Plan
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500">
                  <option value="trial">Trial (30 days)</option>
                  <option value="pro">Pro ($199/month)</option>
                  <option value="enterprise">Enterprise ($499/month)</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateCompany(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create & Send Invite
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Generate Invitation Link
            </h3>
            <p className="text-slate-600 mb-4">
              Create an invitation link for {selectedCompany.name}
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  User Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  User Role
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500">
                  <option value="company_admin">Company Admin</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="field_worker">Field Worker</option>
                  <option value="subcontractor">Subcontractor</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Generate Invite
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;