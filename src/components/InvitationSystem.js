import React, { useState, useEffect } from 'react';
import { multitenant } from '../api/multitenant-api';
import { supabase } from '../supabase';
import './InvitationSystem.css';

const InvitationSystem = ({ company, currentUser, onUserAdded }) => {
  const [activeTab, setActiveTab] = useState('invite');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'field_worker',
    projectAccess: [],
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);

  const roles = [
    {
      value: 'company_admin',
      label: 'Company Admin',
      description: 'Full company access, user management, billing',
      permissions: ['Manage users', 'Access all projects', 'Company settings', 'Billing access']
    },
    {
      value: 'project_manager',
      label: 'Project Manager',
      description: 'Manage assigned projects and teams',
      permissions: ['Manage assigned projects', 'Create blockers', 'Upload drawings', 'Assign tasks']
    },
    {
      value: 'supervisor',
      label: 'Supervisor',
      description: 'Supervise field workers and manage blockers',
      permissions: ['Assign blockers', 'Upload drawings', 'Manage team', 'View reports']
    },
    {
      value: 'field_worker',
      label: 'Field Worker',
      description: 'Create and manage blockers',
      permissions: ['Create blockers', 'View assigned work', 'Update status']
    }
  ];

  useEffect(() => {
    loadData();
  }, [company.id]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadInvitations(),
        loadTeamMembers(),
        loadProjects()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          invited_by:user_profiles(full_name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const projects = await multitenant.projectAPI.getAll();
      setProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleProjectAccess = (projectId, checked) => {
    setInviteForm(prev => ({
      ...prev,
      projectAccess: checked
        ? [...prev.projectAccess, projectId]
        : prev.projectAccess.filter(id => id !== projectId)
    }));
  };

  const validateInviteForm = () => {
    const newErrors = {};

    if (!inviteForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!inviteForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendInvitation = async () => {
    if (!validateInviteForm()) return;

    setLoading(true);
    try {
      // Check if user already exists or has pending invitation
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', inviteForm.email.toLowerCase())
        .single();

      if (existingUser) {
        setErrors({ email: 'User with this email already exists' });
        setLoading(false);
        return;
      }

      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', inviteForm.email.toLowerCase())
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        setErrors({ email: 'Invitation already sent to this email' });
        setLoading(false);
        return;
      }

      // Create invitation
      const invitationId = crypto.randomUUID();
      const inviteToken = crypto.randomUUID();

      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          id: invitationId,
          company_id: company.id,
          email: inviteForm.email.toLowerCase(),
          full_name: inviteForm.fullName,
          role: inviteForm.role,
          project_access: inviteForm.projectAccess,
          message: inviteForm.message,
          token: inviteToken,
          invited_by: currentUser.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      // Send invitation email (in real implementation, this would be handled by a backend service)
      const inviteLink = `${window.location.origin}/accept-invitation?token=${inviteToken}`;

      // For now, we'll simulate sending the email and show a success message
      console.log('Invitation email would be sent to:', inviteForm.email);
      console.log('Invitation link:', inviteLink);

      // Log the invitation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'invitation_sent',
          resource_type: 'invitation',
          resource_id: invitationId,
          details: {
            invited_email: inviteForm.email,
            invited_name: inviteForm.fullName,
            role: inviteForm.role,
            project_access_count: inviteForm.projectAccess.length
          }
        });

      // Reset form and reload invitations
      setInviteForm({
        email: '',
        fullName: '',
        role: 'field_worker',
        projectAccess: [],
        message: ''
      });

      await loadInvitations();

      // Show success message
      alert(`Invitation sent to ${inviteForm.email}!\n\nInvitation link: ${inviteLink}\n\n(In production, this would be sent via email)`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setErrors({ submit: 'Failed to send invitation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      await loadInvitations();
      alert('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    }
  };

  const cancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      await loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log the role change
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'user_role_updated',
          resource_type: 'user',
          resource_id: userId,
          details: { new_role: newRole }
        });

      await loadTeamMembers();
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const deactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user? They will lose access to the company.')) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) throw error;

      // Log the deactivation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'user_deactivated',
          resource_type: 'user',
          resource_id: userId,
          details: {}
        });

      await loadTeamMembers();

      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: '#f59e0b',
      accepted: '#10b981',
      expired: '#6b7280',
      cancelled: '#ef4444'
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#6b7280' }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      company_owner: '#7c3aed',
      company_admin: '#2563eb',
      project_manager: '#059669',
      supervisor: '#d97706',
      field_worker: '#6b7280'
    };

    const roleLabels = {
      company_owner: 'Owner',
      company_admin: 'Admin',
      project_manager: 'PM',
      supervisor: 'Supervisor',
      field_worker: 'Worker'
    };

    return (
      <span
        className="role-badge"
        style={{ backgroundColor: roleColors[role] || '#6b7280' }}
      >
        {roleLabels[role] || role}
      </span>
    );
  };

  return (
    <div className="invitation-system">
      <div className="invitation-header">
        <h2>Team Management</h2>
        <p>Invite and manage your team members with role-based permissions</p>
      </div>

      <div className="invitation-tabs">
        <button
          className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          Send Invitation
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
        </button>
        <button
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team Members ({teamMembers.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'invite' && (
          <div className="invite-form-container">
            <h3>Invite New Team Member</h3>

            <div className="form-section">
              <h4>User Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.doe@company.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={inviteForm.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Role Assignment</h4>
              <div className="roles-grid">
                {roles.map(role => (
                  <div
                    key={role.value}
                    className={`role-card ${inviteForm.role === role.value ? 'selected' : ''}`}
                    onClick={() => handleInputChange('role', role.value)}
                  >
                    <div className="role-header">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={inviteForm.role === role.value}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                      />
                      <div className="role-info">
                        <div className="role-title">{role.label}</div>
                        <div className="role-description">{role.description}</div>
                      </div>
                    </div>
                    <ul className="role-permissions">
                      {role.permissions.map((permission, index) => (
                        <li key={index}>✓ {permission}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {projects.length > 0 && (
              <div className="form-section">
                <h4>Project Access (Optional)</h4>
                <p>Select which projects this user can access:</p>
                <div className="projects-grid">
                  {projects.map(project => (
                    <label key={project.id} className="project-checkbox">
                      <input
                        type="checkbox"
                        checked={inviteForm.projectAccess.includes(project.id)}
                        onChange={(e) => handleProjectAccess(project.id, e.target.checked)}
                      />
                      <div className="project-info">
                        <div className="project-name">{project.name}</div>
                        <div className="project-status">{project.status}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-section">
              <h4>Personal Message (Optional)</h4>
              <textarea
                value={inviteForm.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows="3"
              />
            </div>

            {errors.submit && <div className="error-banner">{errors.submit}</div>}

            <div className="form-actions">
              <button
                onClick={sendInvitation}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="invitations-list">
            <h3>Pending Invitations</h3>

            {invitations.filter(i => i.status === 'pending').length === 0 ? (
              <div className="empty-state">
                <p>No pending invitations.</p>
              </div>
            ) : (
              <div className="invitations-table">
                {invitations
                  .filter(i => i.status === 'pending')
                  .map(invitation => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <div className="invitation-header">
                          <div className="invitee-name">{invitation.full_name}</div>
                          <div className="invitation-meta">
                            {getRoleBadge(invitation.role)}
                            {getStatusBadge(invitation.status)}
                          </div>
                        </div>
                        <div className="invitation-details">
                          <div className="detail-item">
                            <span>Email:</span>
                            <span>{invitation.email}</span>
                          </div>
                          <div className="detail-item">
                            <span>Invited by:</span>
                            <span>{invitation.invited_by?.full_name || 'Unknown'}</span>
                          </div>
                          <div className="detail-item">
                            <span>Sent:</span>
                            <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="detail-item">
                            <span>Expires:</span>
                            <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
                          </div>
                          {invitation.project_access && invitation.project_access.length > 0 && (
                            <div className="detail-item">
                              <span>Project Access:</span>
                              <span>{invitation.project_access.length} project(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="invitation-actions">
                        <button
                          onClick={() => resendInvitation(invitation.id)}
                          className="btn-secondary btn-small"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="btn-danger btn-small"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="team-list">
            <h3>Team Members</h3>

            <div className="team-table">
              {teamMembers.map(member => (
                <div key={member.id} className="team-member-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {member.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="member-details">
                      <div className="member-name">{member.full_name}</div>
                      <div className="member-email">{member.email}</div>
                      <div className="member-meta">
                        <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                        {member.last_login && (
                          <span>Last login: {new Date(member.last_login).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="member-role">
                      {getRoleBadge(member.role)}
                    </div>
                  </div>

                  {member.id !== currentUser.id && currentUser.role === 'company_owner' && (
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={(e) => updateUserRole(member.id, e.target.value)}
                        className="role-selector"
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deactivateUser(member.id)}
                        className="btn-danger btn-small"
                      >
                        Deactivate
                      </button>
                    </div>
                  )}

                  {member.id === currentUser.id && (
                    <div className="member-actions">
                      <span className="current-user-badge">You</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationSystem;