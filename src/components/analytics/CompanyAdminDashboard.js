import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  UserGroupIcon,
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  PhotoIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CompanyAdminDashboard = ({ companyId }) => {
  const [data, setData] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalDrawings: 0,
    activeBlockers: 0,
    projectProgress: [],
    userActivity: [],
    blockersByProject: []
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUploadDrawing, setShowUploadDrawing] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // Mock company-specific data
      const mockCompanyData = {
        totalUsers: 12,
        activeProjects: 8,
        totalDrawings: 24,
        activeBlockers: 15,
        projectProgress: [
          { project: 'Tower A', completion: 85, blockers: 2 },
          { project: 'Tower B', completion: 72, blockers: 4 },
          { project: 'Parking Garage', completion: 91, blockers: 1 },
          { project: 'Retail Space', completion: 45, blockers: 8 }
        ],
        userActivity: [
          { week: 'Week 1', active: 10 },
          { week: 'Week 2', active: 11 },
          { week: 'Week 3', active: 12 },
          { week: 'Week 4', active: 12 }
        ],
        blockersByProject: [
          { name: 'Resolved', value: 42, color: '#10b981' },
          { name: 'In Progress', value: 15, color: '#f59e0b' },
          { name: 'Overdue', value: 8, color: '#ef4444' }
        ]
      };

      const mockUsers = [
        { id: 1, name: 'John Smith', email: 'john@company.com', role: 'project_manager', status: 'active', lastActive: '2024-01-15' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', role: 'field_worker', status: 'active', lastActive: '2024-01-15' },
        { id: 3, name: 'Mike Wilson', email: 'mike@company.com', role: 'subcontractor', status: 'active', lastActive: '2024-01-14' },
        { id: 4, name: 'Lisa Brown', email: 'lisa@company.com', role: 'field_worker', status: 'inactive', lastActive: '2024-01-12' }
      ];

      const mockProjects = [
        { id: 1, name: 'Tower A Construction', status: 'active', manager: 'John Smith', completion: 85, drawings: 8, users: 6 },
        { id: 2, name: 'Tower B Construction', status: 'active', manager: 'Sarah Johnson', completion: 72, drawings: 6, users: 5 },
        { id: 3, name: 'Parking Garage', status: 'active', manager: 'John Smith', completion: 91, drawings: 4, users: 3 },
        { id: 4, name: 'Retail Space Fit-out', status: 'planning', manager: 'Lisa Brown', completion: 45, drawings: 6, users: 4 }
      ];

      const mockDrawings = [
        { id: 1, name: 'Tower A - Floor Plans', project: 'Tower A', uploadedBy: 'John Smith', uploadDate: '2024-01-15', size: '2.4 MB' },
        { id: 2, name: 'Electrical Schematics', project: 'Tower B', uploadedBy: 'Sarah Johnson', uploadDate: '2024-01-14', size: '1.8 MB' },
        { id: 3, name: 'Plumbing Layout', project: 'Tower A', uploadedBy: 'Mike Wilson', uploadDate: '2024-01-13', size: '3.1 MB' },
        { id: 4, name: 'Site Survey', project: 'Parking Garage', uploadedBy: 'John Smith', uploadDate: '2024-01-12', size: '5.2 MB' }
      ];

      setData(mockCompanyData);
      setUsers(mockUsers);
      setProjects(mockProjects);
      setDrawings(mockDrawings);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <CardGrid>
        <StatCard
          title="Team Members"
          value={data.totalUsers}
          icon={UserGroupIcon}
          trend={{ value: 2, isPositive: true }}
          subtitle="Active users"
        />
        <StatCard
          title="Active Projects"
          value={data.activeProjects}
          icon={FolderIcon}
          trend={{ value: 1, isPositive: true }}
          subtitle="In progress"
        />
        <StatCard
          title="Site Drawings"
          value={data.totalDrawings}
          icon={DocumentTextIcon}
          trend={{ value: 4, isPositive: true }}
          subtitle="Uploaded files"
        />
        <StatCard
          title="Open Blockers"
          value={data.activeBlockers}
          icon={ExclamationTriangleIcon}
          trend={{ value: -3, isPositive: true }}
          subtitle="Awaiting resolution"
        />
      </CardGrid>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.projectProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Blocker Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Blocker Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.blockersByProject}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
              >
                {data.blockersByProject.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4">
            {data.blockersByProject.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
        <Button onClick={() => setShowAddUser(true)}>
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="primary">{user.role.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.lastActive}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Project Management</h3>
        <Button onClick={() => setShowCreateProject(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Project
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resources</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderIcon className="h-8 w-8 text-slate-400 mr-3" />
                      <div className="text-sm font-medium text-slate-900">{project.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{project.manager}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-construction-600 h-2 rounded-full"
                          style={{ width: `${project.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-600">{project.completion}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{project.drawings} drawings</div>
                    <div>{project.users} team members</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={project.status === 'active' ? 'success' : 'warning'}>
                      {project.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderDrawingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Site Drawings</h3>
        <Button onClick={() => setShowUploadDrawing(true)}>
          <PhotoIcon className="h-5 w-5 mr-2" />
          Upload Drawing
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Drawing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {drawings.map((drawing) => (
                <tr key={drawing.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-slate-400 mr-3" />
                      <div className="text-sm font-medium text-slate-900">{drawing.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{drawing.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{drawing.uploadedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{drawing.uploadDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{drawing.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm">Download</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
          <p className="text-slate-600">Manage your team, projects, and site drawings</p>
        </div>
        <Button variant="outline">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Company Settings
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'users', name: 'Team Members', icon: UserGroupIcon },
            { id: 'projects', name: 'Projects', icon: FolderIcon },
            { id: 'drawings', name: 'Site Drawings', icon: DocumentTextIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-construction-500 text-construction-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'projects' && renderProjectsTab()}
      {activeTab === 'drawings' && renderDrawingsTab()}

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Team Member</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500">
                  <option>Project Manager</option>
                  <option>Field Worker</option>
                  <option>Subcontractor</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddUser(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Add User</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create Project</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Manager</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500">
                  <option>John Smith</option>
                  <option>Sarah Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" rows="3"></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateProject(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Create Project</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showUploadDrawing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Site Drawing</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Drawing Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500">
                  <option>Tower A</option>
                  <option>Tower B</option>
                  <option>Parking Garage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
                <input type="file" accept=".pdf,.dwg,.jpg,.png" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500" />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUploadDrawing(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Upload Drawing</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompanyAdminDashboard;