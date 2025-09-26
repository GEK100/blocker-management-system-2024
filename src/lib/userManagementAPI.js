import { supabase } from './supabase';

export const userManagementAPI = {
  // Get all users for a company
  async getCompanyUsers(companyId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching company users:', error);
        return { success: false, error: error.message, users: [] };
      }

      return { success: true, users: data || [] };
    } catch (error) {
      console.error('Error in getCompanyUsers:', error);
      return { success: false, error: error.message, users: [] };
    }
  },

  // Get users assigned to a specific project
  async getProjectUsers(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          *,
          user:users(*)
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project users:', error);
        return { success: false, error: error.message, users: [] };
      }

      return {
        success: true,
        users: data?.map(item => ({
          ...item.user,
          project_role: item.role,
          joined_project: item.created_at,
          project_permissions: item.permissions
        })) || []
      };
    } catch (error) {
      console.error('Error in getProjectUsers:', error);
      return { success: false, error: error.message, users: [] };
    }
  },

  // Add user to a project
  async addUserToProject(userId, projectId, role = 'field_worker', permissions = {}) {
    try {
      // Check if user is already assigned to project
      const { data: existing } = await supabase
        .from('project_users')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (existing) {
        return { success: false, error: 'User is already assigned to this project' };
      }

      const { data, error } = await supabase
        .from('project_users')
        .insert([{
          user_id: userId,
          project_id: projectId,
          role: role,
          permissions: permissions,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error adding user to project:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in addUserToProject:', error);
      return { success: false, error: error.message };
    }
  },

  // Remove user from a project
  async removeUserFromProject(userId, projectId) {
    try {
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error removing user from project:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeUserFromProject:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user's project role and permissions
  async updateUserProjectRole(userId, projectId, role, permissions = {}) {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .update({
          role: role,
          permissions: permissions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .select();

      if (error) {
        console.error('Error updating user project role:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in updateUserProjectRole:', error);
      return { success: false, error: error.message };
    }
  },

  // Get available users (not assigned to a specific project)
  async getAvailableUsersForProject(companyId, projectId) {
    try {
      // Get all company users
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) {
        console.error('Error fetching all users:', usersError);
        return { success: false, error: usersError.message, users: [] };
      }

      // Get users already assigned to this project
      const { data: assignedUsers, error: assignedError } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', projectId);

      if (assignedError) {
        console.error('Error fetching assigned users:', assignedError);
        return { success: false, error: assignedError.message, users: [] };
      }

      const assignedUserIds = assignedUsers?.map(u => u.user_id) || [];
      const availableUsers = allUsers?.filter(user => !assignedUserIds.includes(user.id)) || [];

      return { success: true, users: availableUsers };
    } catch (error) {
      console.error('Error in getAvailableUsersForProject:', error);
      return { success: false, error: error.message, users: [] };
    }
  },

  // Invite new user to project
  async inviteUserToProject(userData, projectId, companyId) {
    try {
      // Create user invitation record
      const { data, error } = await supabase
        .from('user_invitations')
        .insert([{
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone: userData.phone,
          project_id: projectId,
          company_id: companyId,
          invited_at: new Date().toISOString(),
          status: 'pending'
        }])
        .select();

      if (error) {
        console.error('Error creating user invitation:', error);
        return { success: false, error: error.message };
      }

      // In a real application, you would send an email invitation here
      // await sendInvitationEmail(userData.email, invitationToken);

      return { success: true, invitation: data[0] };
    } catch (error) {
      console.error('Error in inviteUserToProject:', error);
      return { success: false, error: error.message };
    }
  },

  // Get pending invitations for a project
  async getProjectInvitations(projectId) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('Error fetching project invitations:', error);
        return { success: false, error: error.message, invitations: [] };
      }

      return { success: true, invitations: data || [] };
    } catch (error) {
      console.error('Error in getProjectInvitations:', error);
      return { success: false, error: error.message, invitations: [] };
    }
  },

  // Check if user has access to project data
  async checkProjectAccess(userId, projectId) {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single();

      if (error) {
        // User not found in project or error occurred
        return { success: true, hasAccess: false, role: null, permissions: {} };
      }

      return {
        success: true,
        hasAccess: true,
        role: data.role,
        permissions: data.permissions || {}
      };
    } catch (error) {
      console.error('Error in checkProjectAccess:', error);
      return { success: false, error: error.message, hasAccess: false };
    }
  },

  // Get user's projects
  async getUserProjects(userId) {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user projects:', error);
        return { success: false, error: error.message, projects: [] };
      }

      return {
        success: true,
        projects: data?.map(item => ({
          ...item.project,
          user_role: item.role,
          user_permissions: item.permissions
        })) || []
      };
    } catch (error) {
      console.error('Error in getUserProjects:', error);
      return { success: false, error: error.message, projects: [] };
    }
  },

  // Bulk assign users to project
  async bulkAssignUsersToProject(userIds, projectId, role = 'field_worker') {
    try {
      const assignments = userIds.map(userId => ({
        user_id: userId,
        project_id: projectId,
        role: role,
        created_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('project_users')
        .insert(assignments)
        .select();

      if (error) {
        console.error('Error bulk assigning users:', error);
        return { success: false, error: error.message };
      }

      return { success: true, assignments: data };
    } catch (error) {
      console.error('Error in bulkAssignUsersToProject:', error);
      return { success: false, error: error.message };
    }
  },

  // Get project team statistics
  async getProjectTeamStats(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select('role')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project team stats:', error);
        return { success: false, error: error.message, stats: {} };
      }

      const roleCount = data?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        success: true,
        stats: {
          totalMembers: data?.length || 0,
          roleBreakdown: roleCount
        }
      };
    } catch (error) {
      console.error('Error in getProjectTeamStats:', error);
      return { success: false, error: error.message, stats: {} };
    }
  }
};