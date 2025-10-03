/**
 * Super Admin API
 * Provides platform-level management capabilities for super administrators
 */

import { supabase } from './supabase';

class SuperAdminAPI {
  // Platform settings management
  async getPlatformSettings() {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('Error fetching platform settings:', error);
      throw error;
    }

    return data;
  }

  async updatePlatformSetting(settingKey, settingValue, description = null) {
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert({
        setting_key: settingKey,
        setting_value: settingValue,
        description,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating platform setting:', error);
      throw error;
    }

    return data;
  }

  // Company management
  async getAllCompanies(filters = {}) {
    let query = supabase
      .from('companies')
      .select(`
        *,
        subscription_plan:subscription_plans(name, slug),
        user_count:user_profiles(count),
        project_count:projects(count),
        active_blockers:blockers(count)
      `);

    if (filters.status) {
      query = query.eq('subscription_status', filters.status);
    }

    if (filters.plan) {
      query = query.eq('subscription_plan_id', filters.plan);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }

    return data;
  }

  async getCompanyDetails(companyId) {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        subscription_plan:subscription_plans(*),
        users:user_profiles(*),
        projects:projects(
          *,
          blockers(count)
        ),
        audit_logs:audit_logs(
          id,
          action,
          resource_type,
          created_at,
          user:user_profiles(name)
        )
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company details:', error);
      throw error;
    }

    return data;
  }

  async createCompanyWithInvitation(companyData, ownerEmail, ownerName) {
    try {
      // Start a transaction-like operation
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          slug: this.generateSlug(companyData.name),
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          subscription_plan_id: companyData.subscriptionPlanId,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create company invitation token
      const invitationToken = this.generateInvitationToken();

      const { data: invitation, error: invitationError } = await supabase
        .from('company_invitations')
        .insert({
          company_id: company.id,
          email: ownerEmail,
          role: 'company_owner',
          invited_by_super_admin: true,
          invitation_token: invitationToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invitation_data: {
            owner_name: ownerName,
            company_name: company.name,
            setup_instructions: true
          }
        })
        .select()
        .single();

      if (invitationError) {
        // Cleanup company if invitation fails
        await supabase.from('companies').delete().eq('id', company.id);
        throw invitationError;
      }

      // Send invitation email (implement with your email service)
      await this.sendCompanyInvitationEmail(ownerEmail, ownerName, company, invitationToken);

      return {
        company,
        invitation,
        invitationUrl: `${window.location.origin}/accept-company-invitation?token=${invitationToken}`
      };

    } catch (error) {
      console.error('Error creating company with invitation:', error);
      throw error;
    }
  }

  // Subscription management
  async getSubscriptionPlans() {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data;
  }

  async updateCompanySubscription(companyId, planId, status = 'active') {
    const { data, error } = await supabase
      .from('companies')
      .update({
        subscription_plan_id: planId,
        subscription_status: status,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: status === 'active'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company subscription:', error);
      throw error;
    }

    return data;
  }

  async suspendCompany(companyId, reason) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        is_suspended: true,
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error suspending company:', error);
      throw error;
    }

    return data;
  }

  async reactivateCompany(companyId) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        is_suspended: false,
        suspension_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error reactivating company:', error);
      throw error;
    }

    return data;
  }

  // Analytics and reporting
  async getPlatformAnalytics(dateRange = 30) {
    const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();

    const [companiesData, usersData, blockersData, subscriptionData] = await Promise.all([
      // Company metrics
      supabase
        .from('companies')
        .select('id, created_at, subscription_status')
        .gte('created_at', startDate),

      // User metrics
      supabase
        .from('user_profiles')
        .select('id, created_at, role, company_id')
        .gte('created_at', startDate),

      // Blocker metrics
      supabase
        .from('blockers')
        .select('id, created_at, status, company_id')
        .gte('created_at', startDate),

      // Subscription metrics
      supabase
        .from('companies')
        .select(`
          subscription_status,
          subscription_plan:subscription_plans(name, price_monthly)
        `)
    ]);

    if (companiesData.error || usersData.error || blockersData.error || subscriptionData.error) {
      throw new Error('Error fetching platform analytics');
    }

    return {
      companies: {
        total: companiesData.data.length,
        new: companiesData.data.length,
        byStatus: this.groupBy(companiesData.data, 'subscription_status')
      },
      users: {
        total: usersData.data.length,
        new: usersData.data.length,
        byRole: this.groupBy(usersData.data, 'role')
      },
      blockers: {
        total: blockersData.data.length,
        new: blockersData.data.length,
        byStatus: this.groupBy(blockersData.data, 'status')
      },
      revenue: {
        monthly: this.calculateMonthlyRevenue(subscriptionData.data),
        byPlan: this.groupRevenueBySuaPlan(subscriptionData.data)
      }
    };
  }

  // System announcements
  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcementData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }

    return data;
  }

  async getAnnouncements(includeInactive = false) {
    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }

    return data;
  }

  // GDPR and compliance
  async getGDPRRequests(companyId = null) {
    let query = supabase
      .from('gdpr_requests')
      .select(`
        *,
        company:companies(name),
        user:user_profiles(name, email),
        processed_by_user:user_profiles!processed_by(name)
      `)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching GDPR requests:', error);
      throw error;
    }

    return data;
  }

  async processGDPRRequest(requestId, action, notes = null) {
    const { data, error } = await supabase
      .from('gdpr_requests')
      .update({
        status: action === 'approve' ? 'completed' : 'rejected',
        processed_by: (await supabase.auth.getUser()).data.user?.id,
        processed_at: new Date().toISOString(),
        completion_notes: notes
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error processing GDPR request:', error);
      throw error;
    }

    return data;
  }

  // Utility methods
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  generateInvitationToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 64);
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  calculateMonthlyRevenue(subscriptionData) {
    return subscriptionData
      .filter(sub => sub.subscription_status === 'active')
      .reduce((total, sub) => {
        return total + (sub.subscription_plan?.price_monthly || 0);
      }, 0);
  }

  groupRevenueBySuaPlan(subscriptionData) {
    return subscriptionData
      .filter(sub => sub.subscription_status === 'active')
      .reduce((plans, sub) => {
        const planName = sub.subscription_plan?.name || 'Unknown';
        plans[planName] = (plans[planName] || 0) + (sub.subscription_plan?.price_monthly || 0);
        return plans;
      }, {});
  }

  async sendCompanyInvitationEmail(email, name, company, token) {
    // Implement with your email service (SendGrid, Mailgun, etc.)
    console.log('Sending company invitation email:', {
      to: email,
      subject: `You've been invited to set up ${company.name} on our platform`,
      company: company.name,
      token
    });

    // This would typically make an API call to your email service
    // For now, we'll just log it
    return Promise.resolve();
  }
}

// Create singleton instance
const superAdminAPI = new SuperAdminAPI();

export default superAdminAPI;