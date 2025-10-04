import { supabase } from './supabase';

export const companyAPI = {
  // Generate a unique company ID
  generateCompanyId: () => {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Create a new company workspace
  async createCompany(companyData) {
    try {
      const companyId = companyAPI.generateCompanyId();

      const company = {
        id: companyId,
        name: companyData.companyName,
        subscription_plan: companyData.subscriptionPlan || 'trial',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          features: {
            analytics: true,
            team_management: true,
            project_management: true,
            mobile_app: true
          }
        }
      };

      // In production, this would create company in Supabase with RLS
      // For demo purposes, store in localStorage
      const companies = JSON.parse(localStorage.getItem('companies') || '{}');
      companies[companyId] = company;
      localStorage.setItem('companies', JSON.stringify(companies));

      // Initialize company workspace structure
      await companyAPI.initializeWorkspace(companyId);

      return {
        success: true,
        company,
        companyId
      };
    } catch (error) {
      console.error('Error creating company:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Initialize company workspace with default data structures
  async initializeWorkspace(companyId) {
    try {
      // Create default workspace structure
      const workspaceData = {
        projects: {},
        users: {},
        roles: {},
        settings: {
          defaultRoles: ['company_admin', 'project_manager', 'supervisor', 'field_worker', 'subcontractor']
        },
        templates: {
          projects: [],
          reports: []
        }
      };

      localStorage.setItem(`workspace_${companyId}`, JSON.stringify(workspaceData));

      return { success: true };
    } catch (error) {
      console.error('Error initializing workspace:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a project within a company workspace
  async createProject(companyId, projectData) {
    try {
      const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const project = {
        id: projectId,
        company_id: companyId,
        name: projectData.projectName,
        description: projectData.projectDescription || '',
        address: projectData.projectAddress || '',
        estimated_start_date: projectData.estimatedStartDate,
        estimated_end_date: projectData.estimatedEndDate || null,
        status: 'planning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: projectData.createdBy,
        team_members: [],
        budget: {
          total: 0,
          allocated: 0,
          spent: 0
        },
        phases: [
          {
            id: 'phase_planning',
            name: 'Planning & Design',
            status: 'active',
            estimated_start: projectData.estimatedStartDate,
            estimated_end: null
          }
        ]
      };

      // Get company workspace
      const workspaceData = JSON.parse(localStorage.getItem(`workspace_${companyId}`) || '{}');

      if (!workspaceData.projects) {
        workspaceData.projects = {};
      }

      workspaceData.projects[projectId] = project;
      localStorage.setItem(`workspace_${companyId}`, JSON.stringify(workspaceData));

      return {
        success: true,
        project,
        projectId
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Add user to company
  async addUserToCompany(companyId, userData) {
    try {
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const user = {
        id: userId,
        company_id: companyId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        status: 'pending_invitation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: companyAPI.getDefaultPermissions(userData.role),
        profile: {
          phone: userData.phone || '',
          department: userData.department || '',
          hire_date: new Date().toISOString()
        }
      };

      // Get company workspace
      const workspaceData = JSON.parse(localStorage.getItem(`workspace_${companyId}`) || '{}');

      if (!workspaceData.users) {
        workspaceData.users = {};
      }

      workspaceData.users[userId] = user;
      localStorage.setItem(`workspace_${companyId}`, JSON.stringify(workspaceData));

      return {
        success: true,
        user,
        userId
      };
    } catch (error) {
      console.error('Error adding user to company:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get default permissions for a role
  getDefaultPermissions(role) {
    const permissions = {
      company_admin: [
        'manage_users',
        'manage_projects',
        'view_analytics',
        'manage_company_settings',
        'manage_billing'
      ],
      project_manager: [
        'manage_assigned_projects',
        'manage_project_team',
        'view_project_analytics',
        'create_reports'
      ],
      supervisor: [
        'view_assigned_projects',
        'manage_field_workers',
        'create_reports',
        'update_project_status'
      ],
      field_worker: [
        'view_assigned_tasks',
        'update_task_status',
        'submit_reports'
      ],
      subcontractor: [
        'view_assigned_work',
        'update_work_status',
        'submit_progress_reports'
      ],
      subcontractor_manager: [
        'manage_subcontractor_team',
        'view_assigned_projects',
        'manage_subcontractor_work',
        'create_reports'
      ]
    };

    return permissions[role] || permissions['field_worker'];
  },

  // Get company data
  async getCompany(companyId) {
    try {
      const companies = JSON.parse(localStorage.getItem('companies') || '{}');
      const company = companies[companyId];

      if (!company) {
        return {
          success: false,
          error: 'Company not found'
        };
      }

      return {
        success: true,
        company
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get company workspace data
  async getWorkspaceData(companyId) {
    try {
      const workspaceData = JSON.parse(localStorage.getItem(`workspace_${companyId}`) || '{}');

      return {
        success: true,
        workspace: workspaceData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Complete company onboarding
  async completeOnboarding(companyId, onboardingData) {
    try {
      let actualCompanyId = companyId;
      let companyResult = null;

      // Check if company already exists
      const existingCompanies = JSON.parse(localStorage.getItem('companies') || '{}');
      const existingCompany = Object.values(existingCompanies).find(c => c.name === onboardingData.companyName);

      if (existingCompany) {
        // Use existing company
        actualCompanyId = existingCompany.id;
        companyResult = { success: true, company: existingCompany, companyId: actualCompanyId };
      } else {
        // Create the company only if it doesn't exist
        companyResult = await companyAPI.createCompany({
          companyName: onboardingData.companyName,
          subscriptionPlan: onboardingData.subscriptionPlan || 'trial'
        });

        if (!companyResult.success) {
          return companyResult;
        }

        actualCompanyId = companyResult.companyId;
      }

      // Check if project already exists
      const workspaceData = JSON.parse(localStorage.getItem(`workspace_${actualCompanyId}`) || '{}');
      let projectResult = null;
      const existingProject = workspaceData.projects ?
        Object.values(workspaceData.projects).find(p => p.name === onboardingData.projectName) : null;

      if (existingProject) {
        // Use existing project
        projectResult = { success: true, project: existingProject, projectId: existingProject.id };
      } else {
        // Create the first project only if it doesn't exist
        projectResult = await companyAPI.createProject(actualCompanyId, {
          projectName: onboardingData.projectName,
          projectDescription: onboardingData.projectDescription,
          projectAddress: onboardingData.projectAddress,
          estimatedStartDate: onboardingData.estimatedStartDate,
          estimatedEndDate: onboardingData.estimatedEndDate,
          createdBy: onboardingData.adminUserId
        });
      }

      // Add initial team members (only if they don't already exist)
      const userResults = [];
      const currentWorkspaceData = JSON.parse(localStorage.getItem(`workspace_${actualCompanyId}`) || '{}');
      const existingUsers = currentWorkspaceData.users || {};

      for (const userData of onboardingData.initialUsers) {
        if (userData.email && userData.firstName && userData.lastName) {
          // Check if user with this email already exists
          const existingUser = Object.values(existingUsers).find(u => u.email === userData.email);
          if (existingUser) {
            userResults.push({ success: true, user: existingUser, userId: existingUser.id });
          } else {
            const userResult = await companyAPI.addUserToCompany(actualCompanyId, userData);
            userResults.push(userResult);
          }
        }
      }

      // Create admin user profile (only if doesn't exist)
      const existingAdmin = Object.values(existingUsers).find(u => u.email === onboardingData.email);
      let adminResult;
      if (existingAdmin) {
        adminResult = { success: true, user: existingAdmin, userId: existingAdmin.id };
      } else {
        adminResult = await companyAPI.addUserToCompany(actualCompanyId, {
          email: onboardingData.email,
          firstName: onboardingData.firstName,
          lastName: onboardingData.lastName,
          role: 'company_admin'
        });
      }

      return {
        success: true,
        companyId: actualCompanyId,
        company: companyResult.company,
        project: projectResult.project,
        users: userResults,
        admin: adminResult.user
      };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send user invitations
  async sendUserInvitations(companyId, users) {
    try {
      const invitations = [];

      for (const user of users) {
        // Generate invitation token
        const invitationToken = Array.from(
          new Uint8Array(32),
          byte => byte.toString(16).padStart(2, '0')
        ).join('');

        const invitation = {
          id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          token: invitationToken,
          company_id: companyId,
          user_id: user.id,
          email: user.email,
          role: user.role,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          created_at: new Date().toISOString()
        };

        invitations.push(invitation);

        // Store invitation
        const userInvitations = JSON.parse(localStorage.getItem('userInvitations') || '[]');
        userInvitations.push(invitation);
        localStorage.setItem('userInvitations', JSON.stringify(userInvitations));

        // In production, send actual email here
        console.log('User invitation created:', {
          email: user.email,
          inviteUrl: `${window.location.origin}/user-onboarding?token=${invitationToken}`,
          role: user.role,
          companyId
        });
      }

      return {
        success: true,
        invitations
      };
    } catch (error) {
      console.error('Error sending user invitations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default companyAPI;