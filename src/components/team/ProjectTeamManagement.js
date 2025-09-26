import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import { userManagementAPI } from '../../lib/userManagementAPI';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const ProjectTeamManagement = ({ project, onBack, companyId }) => {
  const { user, userRole } = useSmartAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Team data
  const [projectTeam, setProjectTeam] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  // Modal state
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'field_worker',
    phone: ''
  });

  useEffect(() => {
    loadProjectTeamData();
  }, [project.id, companyId]);

  const loadProjectTeamData = async () => {
    setLoading(true);
    try {
      // Get all company users
      const companyUsersResult = await userManagementAPI.getCompanyUsers(companyId);
      const companyUsers = companyUsersResult.success ? companyUsersResult.users : [];

      // Generate project team data with realistic assignments
      const projectTeamMembers = generateProjectTeamData(companyUsers, project);
      const availableTeamMembers = generateAvailableUsers(companyUsers, projectTeamMembers);
      const pendingInvites = generatePendingInvitations(project);

      setProjectTeam(projectTeamMembers);
      setAvailableUsers(availableTeamMembers);
      setPendingInvitations(pendingInvites);

    } catch (error) {
      console.error('Error loading project team data:', error);
      // Initialize with demo data if API fails
      initializeDemoData();
    } finally {
      setLoading(false);
    }
  };

  const generateProjectTeamData = (companyUsers, project) => {
    // Create realistic project team assignments based on project type and size
    const projectTeam = [];

    if (companyUsers.length > 0) {
      // Assign existing users to project
      companyUsers.slice(0, Math.min(8, companyUsers.length)).forEach((user, index) => {
        projectTeam.push({
          id: user.id,
          email: user.email,
          firstName: user.first_name || `User${index + 1}`,
          lastName: user.last_name || 'Member',
          role: user.role || 'field_worker',
          phone: user.phone || `+1-555-0${100 + index}`,
          avatar: user.avatar_url,
          joinedProject: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTasks: Math.floor(Math.random() * 15) + 1,
          completedTasks: Math.floor(Math.random() * 10) + 1
        });
      });
    }

    // Add demo team members if needed
    const demoMembers = [
      {
        id: 'pm1',
        email: 'john.manager@company.com',
        firstName: 'John',
        lastName: 'Manager',
        role: 'project_manager',
        phone: '+1-555-0101',
        joinedProject: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        assignedTasks: 12,
        completedTasks: 8
      },
      {
        id: 'sup1',
        email: 'sarah.supervisor@company.com',
        firstName: 'Sarah',
        lastName: 'Supervisor',
        role: 'supervisor',
        phone: '+1-555-0102',
        joinedProject: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        assignedTasks: 8,
        completedTasks: 6
      },
      {
        id: 'fw1',
        email: 'mike.worker@company.com',
        firstName: 'Mike',
        lastName: 'Worker',
        role: 'field_worker',
        phone: '+1-555-0103',
        joinedProject: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        assignedTasks: 15,
        completedTasks: 12
      },
      {
        id: 'fw2',
        email: 'lisa.worker@company.com',
        firstName: 'Lisa',
        lastName: 'Worker',
        role: 'field_worker',
        phone: '+1-555-0104',
        joinedProject: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        assignedTasks: 10,
        completedTasks: 7
      }
    ];

    // Add demo members if project team is small
    if (projectTeam.length < 4) {
      demoMembers.slice(0, 4 - projectTeam.length).forEach(member => {
        projectTeam.push(member);
      });
    }

    return projectTeam;
  };

  const generateAvailableUsers = (companyUsers, currentTeam) => {
    const teamMemberIds = currentTeam.map(member => member.id);
    const available = companyUsers.filter(user => !teamMemberIds.includes(user.id));

    // Add some demo available users
    const demoAvailable = [
      {
        id: 'avail1',
        email: 'david.contractor@company.com',
        firstName: 'David',
        lastName: 'Contractor',
        role: 'main_contractor',
        phone: '+1-555-0201',
        status: 'available'
      },
      {
        id: 'avail2',
        email: 'anna.submanager@company.com',
        firstName: 'Anna',
        lastName: 'SubManager',
        role: 'subcontractor_manager',
        phone: '+1-555-0202',
        status: 'available'
      },
      {
        id: 'avail3',
        email: 'robert.field@company.com',
        firstName: 'Robert',
        lastName: 'Field',
        role: 'field_worker',
        phone: '+1-555-0203',
        status: 'available'
      }
    ];

    return [...available, ...demoAvailable];
  };

  const generatePendingInvitations = (project) => {
    return [
      {
        id: 'pending1',
        email: 'new.employee@company.com',
        firstName: 'New',
        lastName: 'Employee',
        role: 'field_worker',
        invitedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: 'john.manager@company.com'
      },
      {
        id: 'pending2',
        email: 'contractor.external@subcontractor.com',
        firstName: 'External',
        lastName: 'Contractor',
        role: 'subcontractor',
        invitedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: 'sarah.supervisor@company.com'
      }
    ];
  };

  const initializeDemoData = () => {
    const demoProject = {
      id: project.id,
      name: project.name || 'Construction Project',
      location: project.location || 'Main Site'
    };

    setProjectTeam(generateProjectTeamData([], demoProject));
    setAvailableUsers(generateAvailableUsers([], []));
    setPendingInvitations(generatePendingInvitations(demoProject));
  };

  const handleAddUserToProject = async (userId) => {
    setSaving(true);
    try {
      const userToAdd = availableUsers.find(u => u.id === userId);
      if (userToAdd) {
        // Add user to project team
        const newTeamMember = {
          ...userToAdd,
          joinedProject: new Date().toISOString(),
          status: 'active',
          lastActivity: new Date().toISOString(),
          assignedTasks: 0,
          completedTasks: 0
        };

        setProjectTeam(prev => [...prev, newTeamMember]);
        setAvailableUsers(prev => prev.filter(u => u.id !== userId));

        // In a real app, make API call to update project assignments
        // await userManagementAPI.addUserToProject(userId, project.id);
      }
    } catch (error) {
      console.error('Error adding user to project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUserFromProject = async (userId) => {
    setSaving(true);
    try {
      const userToRemove = projectTeam.find(u => u.id === userId);
      if (userToRemove) {
        // Remove user from project team
        setProjectTeam(prev => prev.filter(u => u.id !== userId));

        // Add back to available users (except for external contractors)
        if (!userToRemove.email.includes('@subcontractor.com')) {
          const availableUser = {
            id: userToRemove.id,
            email: userToRemove.email,
            firstName: userToRemove.firstName,
            lastName: userToRemove.lastName,
            role: userToRemove.role,
            phone: userToRemove.phone,
            status: 'available'
          };
          setAvailableUsers(prev => [...prev, availableUser]);
        }

        // In a real app, make API call to remove project assignment
        // await userManagementAPI.removeUserFromProject(userId, project.id);
      }
    } catch (error) {
      console.error('Error removing user from project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteNewUser = async () => {
    setSaving(true);
    try {
      // Create pending invitation
      const newInvitation = {
        id: `pending_${Date.now()}`,
        email: newUserData.email,
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        role: newUserData.role,
        invitedDate: new Date().toISOString(),
        invitedBy: user.email
      };

      setPendingInvitations(prev => [...prev, newInvitation]);

      // Reset form
      setNewUserData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'field_worker',
        phone: ''
      });
      setShowAddUserModal(false);

      // In a real app, send invitation email
      // await userManagementAPI.inviteUserToProject(newUserData, project.id);
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role) => {
    const roleNames = {
      project_manager: 'Project Manager',
      main_contractor: 'Main Contractor',
      supervisor: 'Supervisor',
      subcontractor: 'Subcontractor',
      subcontractor_manager: 'Subcontractor Manager',
      field_worker: 'Field Worker'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      project_manager: 'blue',
      main_contractor: 'purple',
      supervisor: 'green',
      subcontractor: 'orange',
      subcontractor_manager: 'yellow',
      field_worker: 'slate'
    };
    return colors[role] || 'slate';
  };

  const filteredTeam = projectTeam.filter(member => {
    const matchesSearch = searchTerm === '' ||
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || member.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name} - Team Management</h1>
            <p className="text-slate-600">Manage project team members and access permissions</p>
          </div>
        </div>

        <Button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Invite Team Member</span>
        </Button>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Team Members</p>
              <p className="text-3xl font-bold text-slate-900">{projectTeam.length}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-construction-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Members</p>
              <p className="text-3xl font-bold text-slate-900">
                {projectTeam.filter(m => m.status === 'active').length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending Invitations</p>
              <p className="text-3xl font-bold text-slate-900">{pendingInvitations.length}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Available Users</p>
              <p className="text-3xl font-bold text-slate-900">{availableUsers.length}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-construction-500 focus:border-construction-500 w-full md:w-80"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
        >
          <option value="all">All Roles</option>
          <option value="project_manager">Project Manager</option>
          <option value="main_contractor">Main Contractor</option>
          <option value="supervisor">Supervisor</option>
          <option value="subcontractor">Subcontractor</option>
          <option value="subcontractor_manager">Subcontractor Manager</option>
          <option value="field_worker">Field Worker</option>
        </select>
      </div>

      {/* Current Team Members */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Team Members</h3>
        <div className="space-y-4">
          {filteredTeam.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-construction-100 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="h-6 w-6 text-construction-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-slate-900">
                      {member.firstName} {member.lastName}
                    </h4>
                    <Badge variant={getRoleColor(member.role)} size="sm">
                      {getRoleName(member.role)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-slate-600">
                    <span className="flex items-center space-x-1">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{member.email}</span>
                    </span>
                    {member.phone && (
                      <span className="flex items-center space-x-1">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                    <span>Joined: {new Date(member.joinedProject).toLocaleDateString()}</span>
                    <span>Tasks: {member.completedTasks}/{member.assignedTasks}</span>
                    <span>Last active: {new Date(member.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  variant={member.status === 'active' ? 'green' : 'yellow'}
                  size="sm"
                >
                  {member.status}
                </Badge>

                {userRole === 'project_manager' || userRole === 'company_admin' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUserFromProject(member.id)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {filteredTeam.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No team members found matching your criteria.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Available Users */}
      {availableUsers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Company Users</h3>
          <div className="space-y-3">
            {availableUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </span>
                      <Badge variant={getRoleColor(user.role)} size="sm">
                        {getRoleName(user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddUserToProject(user.id)}
                  disabled={saving}
                  className="flex items-center space-x-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add to Project</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Invitations</h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-900">
                        {invitation.firstName} {invitation.lastName}
                      </span>
                      <Badge variant={getRoleColor(invitation.role)} size="sm">
                        {getRoleName(invitation.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{invitation.email}</p>
                    <p className="text-xs text-slate-500">
                      Invited {new Date(invitation.invitedDate).toLocaleDateString()} by {invitation.invitedBy}
                    </p>
                  </div>
                </div>

                <Badge variant="orange" size="sm">
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Invite New Team Member</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                  >
                    <option value="field_worker">Field Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="subcontractor">Subcontractor</option>
                    <option value="subcontractor_manager">Subcontractor Manager</option>
                    <option value="main_contractor">Main Contractor</option>
                    <option value="project_manager">Project Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteNewUser}
                  disabled={saving || !newUserData.email || !newUserData.firstName}
                >
                  {saving ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTeamManagement;