import { supabase } from '../supabase';

export const gdprAPI = {
  // Get user's current consent preferences
  async getUserConsent(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gdpr_consent, data_retention_days, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user consent:', error);
      throw error;
    }
  },

  // Update user consent preferences
  async updateUserConsent(userId, consentData, retentionDays = 365) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          gdpr_consent: consentData,
          data_retention_days: retentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the consent update
      await this.logConsentAction(userId, 'consent_updated', {
        consent_data: consentData,
        retention_days: retentionDays
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user consent:', error);
      throw error;
    }
  },

  // Submit GDPR request (export or deletion)
  async submitGDPRRequest(userId, requestType, additionalInfo = {}) {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: userId,
          request_type: requestType,
          status: 'pending',
          additional_info: additionalInfo,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log the GDPR request
      await this.logConsentAction(userId, `gdpr_request_${requestType}`, {
        request_id: data.id,
        additional_info: additionalInfo
      });

      // Send notification to admins
      await this.notifyAdminsOfGDPRRequest(data);

      return data;
    } catch (error) {
      console.error('Error submitting GDPR request:', error);
      throw error;
    }
  },

  // Get user's GDPR requests
  async getUserGDPRRequests(userId) {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching GDPR requests:', error);
      throw error;
    }
  },

  // Export user data (for GDPR compliance)
  async exportUserData(userId) {
    try {
      const userData = {};

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      userData.profile = profile;

      // Get user's companies
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId);

      userData.companies = companies;

      // Get user's projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('company_id', companies?.map(c => c.id) || []);

      userData.projects = projects;

      // Get user's blockers
      const { data: blockers } = await supabase
        .from('blockers')
        .select('*')
        .eq('reporter_id', userId);

      userData.blockers = blockers;

      // Get user's status history
      const { data: statusHistory } = await supabase
        .from('status_history')
        .select('*')
        .eq('changed_by', userId);

      userData.statusHistory = statusHistory;

      // Get user's audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .limit(1000)
        .order('created_at', { ascending: false });

      userData.auditLogs = auditLogs;

      // Get user's GDPR requests
      const { data: gdprRequests } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', userId);

      userData.gdprRequests = gdprRequests;

      return {
        exportedAt: new Date().toISOString(),
        userId: userId,
        data: userData
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  // Process data deletion request
  async processDataDeletion(userId, retainAuditLogs = true) {
    try {
      // This should be handled by administrators with proper authorization
      // For now, we'll mark the user for deletion and let admins handle it

      const { error } = await supabase
        .from('user_profiles')
        .update({
          status: 'pending_deletion',
          deletion_requested_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the deletion request
      await this.logConsentAction(userId, 'deletion_requested', {
        retain_audit_logs: retainAuditLogs
      });

      return { success: true, message: 'Deletion request processed. Data will be removed within 30 days.' };
    } catch (error) {
      console.error('Error processing data deletion:', error);
      throw error;
    }
  },

  // Log consent-related actions
  async logConsentAction(userId, action, details = {}) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: action,
          resource_type: 'gdpr_consent',
          resource_id: userId,
          details: details,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging consent action:', error);
      // Don't throw error here as it's just logging
    }
  },

  // Check if user needs to update consent (every 6 months)
  async checkConsentStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gdpr_consent, updated_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data.gdpr_consent || Object.keys(data.gdpr_consent).length === 0) {
        return { needsConsent: true, reason: 'no_consent' };
      }

      const lastUpdated = new Date(data.updated_at);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (lastUpdated < sixMonthsAgo) {
        return { needsConsent: true, reason: 'expired_consent' };
      }

      return { needsConsent: false };
    } catch (error) {
      console.error('Error checking consent status:', error);
      return { needsConsent: true, reason: 'error' };
    }
  },

  // Get privacy policy acceptance status
  async getPrivacyPolicyStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('privacy_policy_accepted, privacy_policy_version, updated_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentVersion = '1.0'; // Update this when privacy policy changes
      const needsAcceptance = !data.privacy_policy_accepted ||
                             data.privacy_policy_version !== currentVersion;

      return {
        accepted: data.privacy_policy_accepted,
        version: data.privacy_policy_version,
        currentVersion,
        needsAcceptance,
        acceptedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error checking privacy policy status:', error);
      return { needsAcceptance: true };
    }
  },

  // Accept privacy policy
  async acceptPrivacyPolicy(userId, version = '1.0') {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          privacy_policy_accepted: true,
          privacy_policy_version: version,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the privacy policy acceptance
      await this.logConsentAction(userId, 'privacy_policy_accepted', {
        version: version
      });

      return { success: true };
    } catch (error) {
      console.error('Error accepting privacy policy:', error);
      throw error;
    }
  },

  // Notify admins of GDPR request
  async notifyAdminsOfGDPRRequest(request) {
    try {
      // Get all super admins
      const { data: superAdmins } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('role', 'super_admin');

      if (superAdmins && superAdmins.length > 0) {
        // Create notifications for super admins
        const notifications = superAdmins.map(admin => ({
          user_id: admin.id,
          title: `New GDPR ${request.request_type} request`,
          message: `User has submitted a GDPR ${request.request_type} request. Request ID: ${request.id}`,
          type: 'gdpr_request',
          priority: 'high',
          metadata: {
            request_id: request.id,
            request_type: request.request_type,
            requesting_user_id: request.user_id
          }
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error notifying admins of GDPR request:', error);
      // Don't throw error as notification failure shouldn't block the request
    }
  },

  // Get company-wide GDPR compliance status
  async getCompanyGDPRStatus(companyId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, gdpr_consent, privacy_policy_accepted, updated_at')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (error) throw error;

      const users = data.map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        hasConsent: user.gdpr_consent && Object.keys(user.gdpr_consent).length > 0,
        hasPrivacyPolicy: user.privacy_policy_accepted,
        lastUpdated: user.updated_at,
        needsUpdate: this.needsConsentUpdate(user.updated_at)
      }));

      const totalUsers = users.length;
      const compliantUsers = users.filter(u => u.hasConsent && u.hasPrivacyPolicy && !u.needsUpdate).length;

      return {
        totalUsers,
        compliantUsers,
        complianceRate: totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : 100,
        users
      };
    } catch (error) {
      console.error('Error getting company GDPR status:', error);
      throw error;
    }
  },

  // Helper function to check if consent needs update
  needsConsentUpdate(lastUpdated) {
    if (!lastUpdated) return true;

    const lastUpdate = new Date(lastUpdated);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return lastUpdate < sixMonthsAgo;
  }
};

export default gdprAPI;