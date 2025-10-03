/**
 * Company Lifecycle Management API
 * Handles complete company lifecycle with secure credentials, status management, and audit logging
 */

import { supabase } from './supabase';
import emailService from './emailService';

class CompanyLifecycleAPI {
  // Create company with temporary credentials
  async createCompanyWithCredentials(companyData, adminEmail, adminName) {
    try {
      const { data: currentUser } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .rpc('create_company_with_temp_credentials', {
          company_data: companyData,
          admin_email: adminEmail,
          admin_name: adminName,
          created_by_user_id: currentUser.user?.id
        });

      if (error) throw error;

      const result = data[0];

      // Send email with temporary credentials
      await emailService.sendCompanySetupEmail({
        to: adminEmail,
        companyName: companyData.name,
        adminName,
        tempPassword: result.temp_password,
        loginUrl: `${window.location.origin}/company-setup?token=${result.reset_token}`,
        expiresAt: result.expires_at
      });

      return {
        companyId: result.company_id,
        setupUrl: `${window.location.origin}/company-setup?token=${result.reset_token}`,
        expiresAt: result.expires_at
      };

    } catch (error) {
      console.error('Error creating company with credentials:', error);
      throw error;
    }
  }

  // Verify temporary credentials
  async verifyTempCredentials(email, password, resetToken) {
    try {
      const { data, error } = await supabase
        .rpc('verify_temp_credentials', {
          email,
          password,
          reset_token: resetToken
        });

      if (error) throw error;

      const result = data[0];

      if (result.valid) {
        // Log successful credential verification
        await this.logCompanyAccess(
          result.company_id,
          null,
          'temp_credential_verification',
          'allowed',
          'company_setup'
        );
      } else {
        // Log failed verification attempt
        await this.logCompanyAccess(
          null,
          null,
          'temp_credential_verification',
          'denied_invalid_credentials',
          'company_setup'
        );
      }

      return result;

    } catch (error) {
      console.error('Error verifying temp credentials:', error);
      throw error;
    }
  }

  // Complete company setup with new password
  async completeCompanySetup(email, resetToken, newPassword, adminName, phone = null) {
    try {
      // First verify the token is still valid
      const verification = await this.verifyTempCredentials(email, 'dummy', resetToken);
      if (!verification.valid) {
        throw new Error('Invalid or expired setup token');
      }

      // Create auth user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: newPassword,
        options: {
          data: {
            name: adminName,
            phone,
            company_id: verification.company_id
          }
        }
      });

      if (authError) throw authError;

      // Create user profile with mandatory password change cleared
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            company_id: verification.company_id,
            email,
            name: adminName,
            phone,
            role: 'company_owner',
            password_must_change: false,
            password_changed_at: new Date().toISOString(),
            first_login_at: new Date().toISOString(),
            is_active: true,
            is_verified: true
          });

        if (profileError) throw profileError;

        // Update company status to active
        await this.changeCompanyStatus(
          verification.company_id,
          'active',
          'Company setup completed by admin',
          authData.user.id
        );

        // Log password change
        await supabase
          .from('password_history')
          .insert({
            user_id: authData.user.id,
            password_hash: 'INITIAL_SETUP',
            changed_reason: 'initial_setup',
            ip_address: null, // Would be captured from request in real implementation
            user_agent: navigator.userAgent
          });
      }

      return {
        user: authData.user,
        companyId: verification.company_id,
        setupComplete: true
      };

    } catch (error) {
      console.error('Error completing company setup:', error);
      throw error;
    }
  }

  // Change company status
  async changeCompanyStatus(companyId, newStatus, reason = null, performedBy = null) {
    try {
      if (!performedBy) {
        const { data: currentUser } = await supabase.auth.getUser();
        performedBy = currentUser.user?.id;
      }

      const { data, error } = await supabase
        .rpc('change_company_status', {
          target_company_id: companyId,
          new_status: newStatus,
          reason,
          performed_by_user_id: performedBy
        });

      if (error) throw error;

      // If suspending, send notification emails to company users
      if (newStatus === 'suspended') {
        await this.notifyCompanySuspension(companyId, reason);
      }

      // If reactivating, send welcome back emails
      if (newStatus === 'active') {
        await this.notifyCompanyReactivation(companyId);
      }

      return { success: true };

    } catch (error) {
      console.error('Error changing company status:', error);
      throw error;
    }
  }

  // Suspend company
  async suspendCompany(companyId, reason) {
    return this.changeCompanyStatus(companyId, 'suspended', reason);
  }

  // Reactivate company
  async reactivateCompany(companyId, reason = 'Account reactivated') {
    return this.changeCompanyStatus(companyId, 'active', reason);
  }

  // Cancel company
  async cancelCompany(companyId, reason) {
    return this.changeCompanyStatus(companyId, 'cancelled', reason);
  }

  // Archive company
  async archiveCompany(companyId, reason) {
    return this.changeCompanyStatus(companyId, 'archived', reason);
  }

  // Check if company access is allowed
  async checkCompanyAccess(companyId) {
    try {
      const { data, error } = await supabase
        .rpc('is_company_access_allowed', {
          target_company_id: companyId
        });

      if (error) throw error;

      return data[0];

    } catch (error) {
      console.error('Error checking company access:', error);
      throw error;
    }
  }

  // Log company access attempt
  async logCompanyAccess(companyId, userId, accessType, accessResult, resource = null) {
    try {
      await supabase
        .rpc('log_company_access', {
          target_company_id: companyId,
          target_user_id: userId,
          access_type: accessType,
          access_result: accessResult,
          resource_accessed: resource,
          ip_addr: null, // Would be captured from request
          user_agent_string: navigator.userAgent
        });

    } catch (error) {
      console.error('Error logging company access:', error);
      // Don't throw error for logging failures
    }
  }

  // Force password change for user
  async forcePasswordChange(userId, reason = 'mandatory') {
    try {
      const { data, error } = await supabase
        .rpc('force_password_change', {
          target_user_id: userId,
          reason
        });

      if (error) throw error;

      return { success: data };

    } catch (error) {
      console.error('Error forcing password change:', error);
      throw error;
    }
  }

  // Get company lifecycle audit trail
  async getCompanyAuditTrail(companyId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('company_lifecycle_audit')
        .select(`
          *,
          performed_by_user:user_profiles(name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error fetching company audit trail:', error);
      throw error;
    }
  }

  // Get all companies with status information
  async getAllCompaniesWithStatus(filters = {}) {
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          subscription_plan:subscription_plans(name, slug, price_monthly),
          user_count:user_profiles(count),
          active_users:user_profiles!inner(count),
          suspended_by_user:user_profiles!suspended_by(name),
          reactivated_by_user:user_profiles!reactivated_by(name),
          recent_audit:company_lifecycle_audit(
            action,
            created_at,
            performed_by_user:user_profiles(name)
          )
        `)
        .eq('user_profiles.is_active', true);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error fetching companies with status:', error);
      throw error;
    }
  }

  // Get company access logs
  async getCompanyAccessLogs(companyId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('company_access_log')
        .select(`
          *,
          user:user_profiles(name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error fetching company access logs:', error);
      throw error;
    }
  }

  // Get password history for user
  async getPasswordHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('password_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error fetching password history:', error);
      throw error;
    }
  }

  // Validate user can access app (check company status and mandatory password change)
  async validateUserAccess(userId) {
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          company:companies(
            id,
            name,
            status,
            suspended_at,
            suspension_reason
          )
        `)
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userProfile.company) {
        return {
          allowed: false,
          reason: 'no_company',
          message: 'User is not associated with any company'
        };
      }

      // Check if password change is required
      if (userProfile.password_must_change) {
        return {
          allowed: false,
          reason: 'password_change_required',
          message: 'You must change your password before accessing the application',
          requiresPasswordChange: true
        };
      }

      // Check company status
      const companyAccess = await this.checkCompanyAccess(userProfile.company.id);

      if (!companyAccess.allowed) {
        // Log the denied access attempt
        await this.logCompanyAccess(
          userProfile.company.id,
          userId,
          'app_access',
          `denied_${companyAccess.company_status}`,
          'dashboard'
        );

        return {
          allowed: false,
          reason: companyAccess.reason,
          message: this.getAccessDeniedMessage(companyAccess.company_status, userProfile.company),
          companyStatus: companyAccess.company_status
        };
      }

      // Log successful access
      await this.logCompanyAccess(
        userProfile.company.id,
        userId,
        'app_access',
        'allowed',
        'dashboard'
      );

      return {
        allowed: true,
        userProfile,
        company: userProfile.company
      };

    } catch (error) {
      console.error('Error validating user access:', error);
      throw error;
    }
  }

  // Get access denied message based on company status
  getAccessDeniedMessage(status, company) {
    switch (status) {
      case 'pending':
        return `${company.name} is still completing their setup. Please contact your administrator.`;
      case 'suspended':
        return `${company.name} account is temporarily suspended. ${company.suspension_reason || 'Please contact support for assistance.'}`;
      case 'cancelled':
        return `${company.name} account has been cancelled. Please contact support if you believe this is an error.`;
      case 'archived':
        return `${company.name} account is archived and no longer active.`;
      default:
        return 'Access denied. Please contact support for assistance.';
    }
  }

  // Send suspension notification emails
  async notifyCompanySuspension(companyId, reason) {
    try {
      // Get company and users
      const { data: company } = await supabase
        .from('companies')
        .select(`
          name,
          user_profiles(email, name)
        `)
        .eq('id', companyId)
        .single();

      if (company?.user_profiles) {
        for (const user of company.user_profiles) {
          await emailService.sendSuspensionNotification({
            to: user.email,
            userName: user.name,
            companyName: company.name,
            reason,
            supportEmail: 'support@yourcompany.com'
          });
        }
      }

    } catch (error) {
      console.error('Error sending suspension notifications:', error);
      // Don't throw error for email failures
    }
  }

  // Send reactivation notification emails
  async notifyCompanyReactivation(companyId) {
    try {
      // Get company and users
      const { data: company } = await supabase
        .from('companies')
        .select(`
          name,
          user_profiles(email, name)
        `)
        .eq('id', companyId)
        .single();

      if (company?.user_profiles) {
        for (const user of company.user_profiles) {
          await emailService.sendReactivationNotification({
            to: user.email,
            userName: user.name,
            companyName: company.name,
            loginUrl: `${window.location.origin}/login`
          });
        }
      }

    } catch (error) {
      console.error('Error sending reactivation notifications:', error);
      // Don't throw error for email failures
    }
  }

  // Cleanup expired temporary credentials (maintenance function)
  async cleanupExpiredCredentials() {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_temp_credentials');

      if (error) throw error;

      return { cleaned: data };

    } catch (error) {
      console.error('Error cleaning up expired credentials:', error);
      throw error;
    }
  }

  // Get platform statistics for super admin
  async getPlatformLifecycleStats() {
    try {
      const [companiesData, auditData, credentialsData] = await Promise.all([
        // Company status distribution
        supabase
          .from('companies')
          .select('status')
          .then(({ data }) => data || []),

        // Recent audit actions
        supabase
          .from('company_lifecycle_audit')
          .select('action, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .then(({ data }) => data || []),

        // Pending credentials
        supabase
          .from('temp_credentials')
          .select('id, created_at, expires_at')
          .eq('used', false)
          .then(({ data }) => data || [])
      ]);

      const statusCounts = companiesData.reduce((acc, company) => {
        acc[company.status] = (acc[company.status] || 0) + 1;
        return acc;
      }, {});

      const actionCounts = auditData.reduce((acc, audit) => {
        acc[audit.action] = (acc[audit.action] || 0) + 1;
        return acc;
      }, {});

      return {
        statusDistribution: statusCounts,
        recentActions: actionCounts,
        pendingSetups: credentialsData.length,
        expiringSoon: credentialsData.filter(
          cred => new Date(cred.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)
        ).length
      };

    } catch (error) {
      console.error('Error fetching platform lifecycle stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const companyLifecycleAPI = new CompanyLifecycleAPI();

export default companyLifecycleAPI;