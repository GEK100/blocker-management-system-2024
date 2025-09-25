import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { subcontractorAPI } from '../../lib/subcontractorAPI';
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
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CompanyAdminDashboard = ({ companyId }) => {
  const [data, setData] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalDrawings: 0,
    activeBlockers: 0,
    totalSubcontractors: 0,
    projectProgress: [],
    userActivity: [],
    blockersByProject: []
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showUploadDrawing, setShowUploadDrawing] = useState(false);
  const [showAddSubcontractor, setShowAddSubcontractor] = useState(false);
  const [showEditSubcontractor, setShowEditSubcontractor] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState(null);
  const [subcontractorFormData, setSubcontractorFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    tradeType: '',
    licenseNumber: '',
    insuranceExpiry: '',
    hourlyRate: '',
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    street: '',
    city: '',
    state: '',
    zip: ''
  });

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
        totalSubcontractors: 5,
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

      // Initialize demo subcontractor data if none exists
      const subcontractorResult = await subcontractorAPI.getSubcontractors(companyId || 'demo_company');
      let subcontractorData = [];
      if (!subcontractorResult.success || subcontractorResult.subcontractors.length === 0) {
        const initResult = await subcontractorAPI.initializeDemoData(companyId || 'demo_company');
        if (initResult.success) {
          subcontractorData = initResult.subcontractors;
        }
      } else {
        subcontractorData = subcontractorResult.subcontractors;
      }

      setData({ ...mockCompanyData, totalSubcontractors: subcontractorData.length });
      setUsers(mockUsers);
      setProjects(mockProjects);
      setDrawings(mockDrawings);
      setSubcontractors(subcontractorData);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subcontractor management functions
  const handleAddSubcontractor = () => {
    setSubcontractorFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      tradeType: '',
      licenseNumber: '',
      insuranceExpiry: '',
      hourlyRate: '',
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      street: '',
      city: '',
      state: '',
      zip: ''
    });
    setShowAddSubcontractor(true);
  };

  const handleEditSubcontractor = (subcontractor) => {
    setSelectedSubcontractor(subcontractor);
    setSubcontractorFormData({
      name: subcontractor.name || '',
      companyName: subcontractor.company_name || '',
      email: subcontractor.email || '',
      phone: subcontractor.phone || '',
      tradeType: subcontractor.trade_type || '',
      licenseNumber: subcontractor.license_number || '',
      insuranceExpiry: subcontractor.insurance_expiry || '',
      hourlyRate: subcontractor.hourly_rate?.toString() || '',
      notes: subcontractor.notes || '',
      emergencyContactName: subcontractor.emergency_contact?.name || '',
      emergencyContactPhone: subcontractor.emergency_contact?.phone || '',
      street: subcontractor.address?.street || '',
      city: subcontractor.address?.city || '',
      state: subcontractor.address?.state || '',
      zip: subcontractor.address?.zip || ''
    });
    setShowEditSubcontractor(true);
  };

  const handleDeleteSubcontractor = async (subcontractorId) => {
    if (window.confirm('Are you sure you want to delete this subcontractor?')) {
      const result = await subcontractorAPI.deleteSubcontractor(companyId || 'demo_company', subcontractorId);
      if (result.success) {
        setSubcontractors(prev => prev.filter(sub => sub.id !== subcontractorId));
      } else {
        alert('Failed to delete subcontractor: ' + result.error);
      }
    }
  };

  const handleSubcontractorSubmit = async (e) => {
    e.preventDefault();

    if (!subcontractorFormData.name || !subcontractorFormData.email || !subcontractorFormData.tradeType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let result;
      if (selectedSubcontractor) {
        // Update existing subcontractor
        result = await subcontractorAPI.updateSubcontractor(
          companyId || 'demo_company',
          selectedSubcontractor.id,
          {
            name: subcontractorFormData.name,
            company_name: subcontractorFormData.companyName,
            email: subcontractorFormData.email,
            phone: subcontractorFormData.phone,
            trade_type: subcontractorFormData.tradeType,
            license_number: subcontractorFormData.licenseNumber,
            insurance_expiry: subcontractorFormData.insuranceExpiry,
            hourly_rate: parseFloat(subcontractorFormData.hourlyRate) || 0,
            notes: subcontractorFormData.notes,
            emergency_contact: {
              name: subcontractorFormData.emergencyContactName,
              phone: subcontractorFormData.emergencyContactPhone
            },
            address: {
              street: subcontractorFormData.street,
              city: subcontractorFormData.city,
              state: subcontractorFormData.state,
              zip: subcontractorFormData.zip
            }
          }
        );

        if (result.success) {
          setSubcontractors(prev =>
            prev.map(sub => sub.id === selectedSubcontractor.id ? result.subcontractor : sub)
          );
          setShowEditSubcontractor(false);
        }
      } else {
        // Create new subcontractor
        result = await subcontractorAPI.createSubcontractor(companyId || 'demo_company', subcontractorFormData);

        if (result.success) {
          setSubcontractors(prev => [...prev, result.subcontractor]);
          setData(prev => ({ ...prev, totalSubcontractors: prev.totalSubcontractors + 1 }));
          setShowAddSubcontractor(false);
        }
      }

      if (!result.success) {
        alert('Failed to save subcontractor: ' + result.error);
      }
    } catch (error) {
      alert('Error saving subcontractor: ' + error.message);
    }
  };

  const handleProjectAccessToggle = async (subcontractorId, projectId) => {
    const subcontractor = subcontractors.find(sub => sub.id === subcontractorId);
    if (!subcontractor) return;

    let result;
    if (subcontractor.project_access.includes(projectId)) {
      result = await subcontractorAPI.removeFromProject(companyId || 'demo_company', subcontractorId, projectId);
    } else {
      result = await subcontractorAPI.assignToProject(companyId || 'demo_company', subcontractorId, projectId);
    }

    if (result.success) {
      setSubcontractors(prev =>
        prev.map(sub => sub.id === subcontractorId ? result.subcontractor : sub)
      );
    }
  };

  const renderSubcontractorsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Subcontractor Management</h3>
        <Button onClick={handleAddSubcontractor}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Subcontractor
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subcontractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Trade Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Project Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {subcontractors.map((subcontractor) => (
                <tr key={subcontractor.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="h-8 w-8 text-slate-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{subcontractor.name}</div>
                        <div className="text-sm text-slate-500">{subcontractor.company_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="primary">{subcontractor.trade_type}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      <div className="flex items-center mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-slate-400" />
                        {subcontractor.email}
                      </div>
                      {subcontractor.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1 text-slate-400" />
                          {subcontractor.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${subcontractor.hourly_rate || 0}/hr
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {projects.map((project) => {
                        const hasAccess = subcontractor.project_access.includes(project.id.toString());
                        return (
                          <button
                            key={project.id}
                            onClick={() => handleProjectAccessToggle(subcontractor.id, project.id.toString())}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              hasAccess
                                ? 'bg-construction-100 text-construction-800 border border-construction-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {project.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSubcontractor(subcontractor)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSubcontractor(subcontractor.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subcontractors.length === 0 && (
          <div className="text-center py-12">
            <WrenchScrewdriverIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No subcontractors yet</h3>
            <p className="text-slate-600 mb-6">Add subcontractors to manage your project workforce</p>
            <Button onClick={handleAddSubcontractor}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add First Subcontractor
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

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
        <StatCard
          title="Subcontractors"
          value={data.totalSubcontractors}
          icon={WrenchScrewdriverIcon}
          trend={{ value: 1, isPositive: true }}
          subtitle="Active contractors"
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
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Company Management</h1>
            <p className="text-sm sm:text-base text-slate-600">Manage your team, projects, and site drawings</p>
          </div>
          <Button variant="outline" className="self-start sm:self-auto">
            <Cog6ToothIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden sm:inline">Company Settings</span>
            <span className="sm:hidden">Settings</span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 overflow-hidden">
          <nav className="-mb-px flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 sm:space-x-8 min-w-max px-2 sm:px-0">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'users', name: 'Team Members', icon: UserGroupIcon },
            { id: 'projects', name: 'Projects', icon: FolderIcon },
            { id: 'subcontractors', name: 'Subcontractors', icon: WrenchScrewdriverIcon },
            { id: 'drawings', name: 'Site Drawings', icon: DocumentTextIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center whitespace-nowrap py-2 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'border-construction-500 text-construction-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.id === 'subcontractors' ? 'Subs' : tab.name.split(' ')[0]}</span>
              </button>
            );
          })}
            </div>
          </nav>
        </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'projects' && renderProjectsTab()}
      {activeTab === 'subcontractors' && renderSubcontractorsTab()}
      {activeTab === 'drawings' && renderDrawingsTab()}

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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

      {/* Add Subcontractor Modal */}
      {showAddSubcontractor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Add New Subcontractor</h3>
              <button
                onClick={() => setShowAddSubcontractor(false)}
                className="text-slate-400 hover:text-slate-600 p-2 -m-2 touch-manipulation"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubcontractorSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={subcontractorFormData.name}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.companyName}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="ABC Construction Co."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={subcontractorFormData.email}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={subcontractorFormData.phone}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Trade Type *
                    </label>
                    <select
                      required
                      value={subcontractorFormData.tradeType}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, tradeType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    >
                      <option value="">Select a trade...</option>
                      {subcontractorAPI.getTradeTypes().map(trade => (
                        <option key={trade} value={trade}>{trade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.licenseNumber}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="PL-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Insurance Expiry
                    </label>
                    <input
                      type="date"
                      value={subcontractorFormData.insuranceExpiry}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={subcontractorFormData.hourlyRate}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="85.00"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.emergencyContactName}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={subcontractorFormData.emergencyContactPhone}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="(555) 123-4568"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Address</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.street}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.city}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.state}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="CA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.zip}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, zip: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={subcontractorFormData.notes}
                  onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="Additional notes about this subcontractor..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddSubcontractor(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Subcontractor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Subcontractor Modal */}
      {showEditSubcontractor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Edit Subcontractor</h3>
              <button
                onClick={() => setShowEditSubcontractor(false)}
                className="text-slate-400 hover:text-slate-600 p-2 -m-2 touch-manipulation"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubcontractorSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={subcontractorFormData.name}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.companyName}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="ABC Construction Co."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={subcontractorFormData.email}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={subcontractorFormData.phone}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Professional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Trade Type *
                    </label>
                    <select
                      required
                      value={subcontractorFormData.tradeType}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, tradeType: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    >
                      <option value="">Select a trade...</option>
                      {subcontractorAPI.getTradeTypes().map(trade => (
                        <option key={trade} value={trade}>{trade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.licenseNumber}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="PL-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Insurance Expiry
                    </label>
                    <input
                      type="date"
                      value={subcontractorFormData.insuranceExpiry}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={subcontractorFormData.hourlyRate}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="85.00"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.emergencyContactName}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={subcontractorFormData.emergencyContactPhone}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="(555) 123-4568"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-md font-medium text-slate-900 mb-4">Address</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={subcontractorFormData.street}
                      onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.city}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.state}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="CA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={subcontractorFormData.zip}
                        onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, zip: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={subcontractorFormData.notes}
                  onChange={(e) => setSubcontractorFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500"
                  placeholder="Additional notes about this subcontractor..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditSubcontractor(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Update Subcontractor
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

export default CompanyAdminDashboard;