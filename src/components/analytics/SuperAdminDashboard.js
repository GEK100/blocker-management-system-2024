import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { inviteAPI } from '../../lib/inviteAPI';
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
  const [createCompanyData, setCreateCompanyData] = useState({
    companyName: '',
    adminEmail: '',
    subscriptionPlan: 'trial'
  });
  const [inviteGenerated, setInviteGenerated] = useState(null);

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
    setInviteGenerated(null);
  };

  const handleGenerateInvite = (company) => {
    setSelectedCompany(company);
    setShowInviteModal(true);
  };

  const handleCreateCompanySubmit = async (e) => {
    e.preventDefault();

    if (!createCompanyData.companyName || !createCompanyData.adminEmail) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create company invitation
      const result = await inviteAPI.createCompanyInvitation({
        companyName: createCompanyData.companyName,
        adminEmail: createCompanyData.adminEmail,
        subscriptionPlan: createCompanyData.subscriptionPlan,
        invitedBy: 'super_admin',
        expiresInDays: 7
      });

      if (result.success) {
        setInviteGenerated(result);
        // Reset form
        setCreateCompanyData({
          companyName: '',
          adminEmail: '',
          subscriptionPlan: 'trial'
        });
      } else {
        alert('Failed to create invitation: ' + result.error);
      }
    } catch (error) {
      alert('Error creating company invitation: ' + error.message);
    }
  };

  const copyInviteLink = () => {
    if (inviteGenerated) {
      navigator.clipboard.writeText(inviteGenerated.inviteUrl);
      alert('Invitation link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">System Administration</h1>
            <p className="text-sm sm:text-base text-slate-600">Manage companies, subscriptions, and platform-wide settings</p>
          </div>
          <Button
            onClick={handleCreateCompany}
            className="flex items-center space-x-2 self-start sm:self-auto"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Create Company</span>
            <span className="sm:hidden">Create</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {!inviteGenerated ? (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Company</h3>
                <form onSubmit={handleCreateCompanySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createCompanyData.companyName}
                      onChange={(e) => setCreateCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={createCompanyData.adminEmail}
                      onChange={(e) => setCreateCompanyData(prev => ({ ...prev, adminEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="admin@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subscription Plan
                    </label>
                    <select
                      value={createCompanyData.subscriptionPlan}
                      onChange={(e) => setCreateCompanyData(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    >
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
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Invitation Created!</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">
                          Company invitation created successfully!
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Invitation sent to {inviteGenerated.invitation.adminEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Invitation Link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inviteGenerated.inviteUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={copyInviteLink}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p><strong>Company:</strong> {inviteGenerated.invitation.companyName}</p>
                    <p><strong>Plan:</strong> {inviteGenerated.invitation.subscriptionPlan}</p>
                    <p><strong>Expires:</strong> {new Date(inviteGenerated.invitation.expiresAt).toLocaleDateString()}</p>
                  </div>

                  <Button
                    onClick={() => setShowCreateCompany(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
    </div>
  );
};

export default SuperAdminDashboard;