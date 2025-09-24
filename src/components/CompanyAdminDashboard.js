import React, { useState, useEffect } from 'react';
import {
  Building2, Users, FolderOpen, Settings, BarChart3, CreditCard,
  UserPlus, Mail, Shield, FileText, Calendar, DollarSign,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Plus, Edit, Trash2,
  Search, Filter, Download, Upload, Eye, MoreVertical, Star
} from 'lucide-react';

const CompanyAdminDashboard = ({ company, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [companyStats, setCompanyStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalBlockers: 0,
    resolvedBlockers: 0,
    activeUsers: 0,
    storageUsed: 0,
    monthlyGrowth: 0
  });

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      // Load company statistics, projects, and users
      // This would connect to your Supabase functions
      setLoading(false);
    } catch (error) {
      console.error('Error loading company data:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'users', label: 'Team', icon: Users },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Company Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{company?.name || 'Your Company'}</h2>
              <p className="text-blue-100">
                {company?.subscription_plan || 'Professional Plan'} • {users.length} team members
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100">Next billing date</p>
            <p className="text-xl font-semibold">March 15, 2024</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">8</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                2 new this month
              </p>
            </div>
            <FolderOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">23</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Users className="h-4 w-4 mr-1" />
                18 active today
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Blockers</p>
              <p className="text-3xl font-bold text-gray-900">42</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <AlertTriangle className="h-4 w-4 mr-1" />
                8 high priority
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900">94%</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                Above average
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View all</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New blocker resolved</p>
                <p className="text-sm text-gray-500">
                  Downtown Office - Electrical Panel Issue
                </p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">User added to project</p>
                <p className="text-sm text-gray-500">
                  Sarah Wilson joined Mall Renovation team
                </p>
                <p className="text-xs text-gray-400">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">High priority blocker created</p>
                <p className="text-sm text-gray-500">
                  Hospital Wing - Access blocked by scaffolding
                </p>
                <p className="text-xs text-gray-400">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">New Project</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <UserPlus className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Invite User</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Export Data</span>
            </button>
            <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <Settings className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Downtown Office Complex', status: 'active', blockers: 12, team: 8, progress: 75 },
          { name: 'Mall Renovation', status: 'planning', blockers: 3, team: 5, progress: 25 },
          { name: 'Hospital Wing Extension', status: 'active', blockers: 18, team: 12, progress: 60 },
          { name: 'Residential Complex', status: 'on_hold', blockers: 5, team: 6, progress: 40 },
        ].map((project, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{width: `${project.progress}%`}}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-gray-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {project.blockers} blockers
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {project.team} team
                  </div>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View Details
                </button>
                <button className="flex-1 text-sm text-gray-600 hover:text-gray-800 font-medium">
                  Manage Team
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Mail className="h-4 w-4 mr-2" />
            Bulk Invite
          </button>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Roles</option>
              <option value="company_admin">Admin</option>
              <option value="project_manager">Project Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="field_worker">Field Worker</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Projects</option>
              <option value="project1">Downtown Office</option>
              <option value="project2">Mall Renovation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[
              { name: 'John Smith', email: 'john@company.com', role: 'Project Manager', projects: ['Downtown Office'], lastActive: '2 hours ago', status: 'active' },
              { name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Field Worker', projects: ['Mall Renovation'], lastActive: '1 day ago', status: 'active' },
              { name: 'Mike Johnson', email: 'mike@company.com', role: 'Supervisor', projects: ['Downtown Office', 'Hospital Wing'], lastActive: '5 minutes ago', status: 'active' },
            ].map((teamMember, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {teamMember.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {teamMember.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {teamMember.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {teamMember.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {teamMember.projects.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teamMember.lastActive}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {teamMember.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Subscription & Billing</h2>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Professional Plan</h3>
            <p className="text-green-100">$79/month • Billed annually</p>
            <p className="text-sm text-green-100 mt-2">Next billing: March 15, 2024</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5" />
              <span className="text-xl font-bold">Current Plan</span>
            </div>
            <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors">
              Change Plan
            </button>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">Projects</h4>
            <span className="text-2xl font-bold text-gray-900">8/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{width: '80%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">2 projects remaining</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">Team Members</h4>
            <span className="text-2xl font-bold text-gray-900">23/50</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{width: '46%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">27 seats available</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">Storage</h4>
            <span className="text-2xl font-bold text-gray-900">67GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{width: '67%'}}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">33GB remaining</p>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Starter', price: 29, projects: 3, users: 10, storage: 10 },
            { name: 'Professional', price: 79, projects: 10, users: 50, storage: 100, current: true },
            { name: 'Enterprise', price: 199, projects: 'Unlimited', users: 'Unlimited', storage: 1000 }
          ].map((plan, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              plan.current ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                {plan.current && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Current</span>}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-4">${plan.price}/mo</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{plan.projects} projects</p>
                <p>{plan.users} team members</p>
                <p>{plan.storage}GB storage</p>
              </div>
              <button className={`w-full mt-4 py-2 rounded-md font-medium ${
                plan.current
                  ? 'bg-green-100 text-green-800 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                defaultValue={company?.name || 'Your Company'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                defaultValue={company?.website || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                defaultValue={company?.phone || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* GDPR & Privacy Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & GDPR</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">Data Retention</label>
                <p className="text-sm text-gray-500">How long to keep user data</p>
              </div>
              <select className="px-3 py-2 border border-gray-300 rounded-md">
                <option value="2555">7 years (default)</option>
                <option value="1825">5 years</option>
                <option value="1095">3 years</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">GDPR Compliance</label>
                <p className="text-sm text-gray-500">Enable GDPR features</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">Data Export Requests</label>
                <p className="text-sm text-gray-500">Allow users to export their data</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Reset Changes
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Company Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'projects' && renderProjects()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'subscription' && renderSubscription()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;