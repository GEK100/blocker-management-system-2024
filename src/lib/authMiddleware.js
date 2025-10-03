/**
 * Authentication Middleware with Multi-Tenant Company Context
 * Provides role-based access control and company isolation
 */

import { supabase } from './supabase';

class AuthMiddleware {
  constructor() {
    this.currentUser = null;
    this.currentUserProfile = null;
    this.isInitialized = false;
    this.authListeners = [];
  }

  // Initialize authentication context
  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await this.loadUserContext(session.user);
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserContext(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.clearUserContext();
        }

        // Notify listeners
        this.authListeners.forEach(callback => callback(event, session, this.currentUserProfile));
      });

      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('Failed to initialize auth middleware:', error);
      return false;
    }
  }

  // Load user profile and company context
  async loadUserContext(user) {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          company:companies(
            id,
            name,
            slug,
            subscription_status,
            subscription_plan:subscription_plans(
              name,
              features,
              limits
            ),
            is_active,
            is_suspended
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to load user profile:', error);
        return false;
      }

      this.currentUser = user;
      this.currentUserProfile = userProfile;

      return true;

    } catch (error) {
      console.error('Error loading user context:', error);
      return false;
    }
  }

  // Clear user context on logout
  clearUserContext() {
    this.currentUser = null;
    this.currentUserProfile = null;
  }

  // Get current user with company context
  getCurrentUser() {
    return {
      user: this.currentUser,
      profile: this.currentUserProfile,
      company: this.currentUserProfile?.company,
      isAuthenticated: !!this.currentUser
    };
  }

  // Role-based access control
  hasRole(requiredRole) {
    if (!this.currentUserProfile) return false;

    const roleHierarchy = {
      'super_admin': 100,
      'company_owner': 80,
      'company_admin': 60,
      'project_manager': 50,
      'supervisor': 40,
      'field_worker': 20
    };

    const userRoleLevel = roleHierarchy[this.currentUserProfile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  // Check if user has specific role
  isRole(role) {
    return this.currentUserProfile?.role === role;
  }

  // Super admin check
  isSuperAdmin() {
    return this.isRole('super_admin');
  }

  // Company owner check
  isCompanyOwner() {
    return this.isRole('company_owner');
  }

  // Company admin or above
  isCompanyAdminOrAbove() {
    return this.hasRole('company_admin');
  }

  // Project manager or above
  isProjectManagerOrAbove() {
    return this.hasRole('project_manager');
  }

  // Supervisor or above
  isSupervisorOrAbove() {
    return this.hasRole('supervisor');
  }

  // Company access control
  belongsToCompany(companyId) {
    if (this.isSuperAdmin()) return true;
    return this.currentUserProfile?.company_id === companyId;
  }

  // Feature access control based on subscription
  hasFeatureAccess(feature) {
    if (this.isSuperAdmin()) return true;

    const company = this.currentUserProfile?.company;
    if (!company) return false;

    // Check if company is active
    if (!company.is_active || company.is_suspended) {
      return false;
    }

    // Check subscription status
    if (company.subscription_status === 'cancelled' || company.subscription_status === 'suspended') {
      return false;
    }

    // Check feature in subscription plan
    const features = company.subscription_plan?.features || {};
    return features[feature] === true || features[feature] > 0;
  }

  // Usage limit checks
  checkUsageLimit(limitType) {
    if (this.isSuperAdmin()) return { allowed: true, unlimited: true };

    const company = this.currentUserProfile?.company;
    if (!company) return { allowed: false, reason: 'No company context' };

    const limits = company.subscription_plan?.limits || {};
    const limit = limits[`max_${limitType}`];

    if (limit === -1) {
      return { allowed: true, unlimited: true };
    }

    if (typeof limit === 'number' && limit > 0) {
      return { allowed: true, limit, unlimited: false };
    }

    return { allowed: false, reason: 'Feature not available in current plan' };
  }

  // Project access control
  async canAccessProject(projectId) {
    if (this.isSuperAdmin()) return true;

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('company_id, team_members')
        .eq('id', projectId)
        .single();

      if (error) return false;

      // Check company membership
      if (!this.belongsToCompany(project.company_id)) {
        return false;
      }

      // Company admins can access all projects
      if (this.isCompanyAdminOrAbove()) {
        return true;
      }

      // Check if user is in project team
      const userId = this.currentUser?.id;
      return project.team_members?.includes(userId) || false;

    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  // Blocker access control
  async canAccessBlocker(blockerId) {
    if (this.isSuperAdmin()) return true;

    try {
      const { data: blocker, error } = await supabase
        .from('blockers')
        .select('company_id, project_id, created_by')
        .eq('id', blockerId)
        .single();

      if (error) return false;

      // Check company membership
      if (!this.belongsToCompany(blocker.company_id)) {
        return false;
      }

      // Check project access
      if (blocker.project_id) {
        return await this.canAccessProject(blocker.project_id);
      }

      return true;

    } catch (error) {
      console.error('Error checking blocker access:', error);
      return false;
    }
  }

  // Company data access wrapper
  async executeWithCompanyContext(operation) {
    if (!this.currentUserProfile) {
      throw new Error('User not authenticated');
    }

    if (!this.currentUserProfile.company_id && !this.isSuperAdmin()) {
      throw new Error('User not associated with any company');
    }

    return await operation({
      userId: this.currentUser.id,
      companyId: this.currentUserProfile.company_id,
      userRole: this.currentUserProfile.role,
      isSuperAdmin: this.isSuperAdmin()
    });
  }

  // Data filtering for multi-tenant queries
  applyCompanyFilter(query, tableName = null) {
    if (this.isSuperAdmin()) {
      return query; // Super admin can see all data
    }

    if (!this.currentUserProfile?.company_id) {
      throw new Error('No company context available');
    }

    const columnName = tableName ? `${tableName}.company_id` : 'company_id';
    return query.eq(columnName, this.currentUserProfile.company_id);
  }

  // Subscription validation
  validateSubscription() {
    const company = this.currentUserProfile?.company;
    if (!company) return { valid: false, reason: 'No company' };

    if (!company.is_active) {
      return { valid: false, reason: 'Company inactive' };
    }

    if (company.is_suspended) {
      return { valid: false, reason: 'Company suspended' };
    }

    const status = company.subscription_status;
    const now = new Date();

    switch (status) {
      case 'trial':
        const trialEnd = new Date(company.trial_ends_at);
        if (now > trialEnd) {
          return { valid: false, reason: 'Trial expired' };
        }
        return { valid: true, type: 'trial' };

      case 'active':
        return { valid: true, type: 'active' };

      case 'past_due':
        return { valid: true, type: 'past_due', warning: 'Payment overdue' };

      case 'cancelled':
      case 'suspended':
        return { valid: false, reason: `Subscription ${status}` };

      default:
        return { valid: false, reason: 'Unknown subscription status' };
    }
  }

  // Permission helpers for UI
  getPermissions() {
    if (!this.currentUserProfile) {
      return {
        canCreateProjects: false,
        canManageUsers: false,
        canManageContractors: false,
        canUploadDrawings: false,
        canCreateBlockers: false,
        canAssignBlockers: false,
        canResolveBlockers: false,
        canViewAnalytics: false,
        canManageCompany: false,
        isSuperAdmin: false
      };
    }

    const role = this.currentUserProfile.role;
    const subscription = this.validateSubscription();

    return {
      canCreateProjects: subscription.valid && this.isCompanyAdminOrAbove(),
      canManageUsers: subscription.valid && this.isCompanyAdminOrAbove(),
      canManageContractors: subscription.valid && this.isCompanyAdminOrAbove(),
      canUploadDrawings: subscription.valid && this.isSupervisorOrAbove(),
      canCreateBlockers: subscription.valid,
      canAssignBlockers: subscription.valid && this.isSupervisorOrAbove(),
      canResolveBlockers: subscription.valid,
      canViewAnalytics: subscription.valid && this.isProjectManagerOrAbove(),
      canManageCompany: subscription.valid && this.isCompanyOwner(),
      isSuperAdmin: this.isSuperAdmin(),
      subscriptionValid: subscription.valid,
      subscriptionType: subscription.type,
      subscriptionWarning: subscription.warning
    };
  }

  // Event listeners for auth state changes
  onAuthStateChange(callback) {
    this.authListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Company context helpers
  getCompanyContext() {
    return {
      companyId: this.currentUserProfile?.company_id,
      companyName: this.currentUserProfile?.company?.name,
      companySlug: this.currentUserProfile?.company?.slug,
      subscriptionStatus: this.currentUserProfile?.company?.subscription_status,
      subscriptionPlan: this.currentUserProfile?.company?.subscription_plan
    };
  }

  // Audit logging helper
  async logAuditEvent(action, resourceType, resourceId, oldValues = null, newValues = null) {
    if (!this.currentUser) return;

    try {
      await supabase
        .from('audit_logs')
        .insert({
          company_id: this.currentUserProfile?.company_id,
          user_id: this.currentUser.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: null, // Would need to be captured from request
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export default authMiddleware;