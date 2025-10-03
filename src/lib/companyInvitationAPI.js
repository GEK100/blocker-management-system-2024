/**
 * Company Invitation API
 * Handles company-level invitations and user onboarding for multi-tenant platform
 */

import { supabase } from './supabase';

class CompanyInvitationAPI {
  // Company invitation management (Super Admin functions)
  async createCompanyInvitation(companyId, email, role = 'company_owner', personalMessage = null) {
    try {
      const { data, error } = await supabase
        .rpc('create_company_invitation', {
          company_uuid: companyId,
          invitation_email: email,
          invitation_role: role,
          super_admin_invite: true
        });

      if (error) throw error;

      const invitation = data[0];

      // Get company details for email
      const { data: company } = await supabase
        .from('companies')
        .select('name, email')
        .eq('id', companyId)
        .single();

      // Send invitation email
      await this.sendCompanyInvitationEmail(email, company, invitation.token);

      return {
        invitationId: invitation.invitation_id,
        token: invitation.token,
        invitationUrl: `${window.location.origin}/accept-company-invitation?token=${invitation.token}`
      };

    } catch (error) {
      console.error('Error creating company invitation:', error);
      throw error;
    }
  }

  async getCompanyInvitations(companyId = null) {
    let query = supabase
      .from('company_invitations')
      .select(`
        *,
        company:companies(name, email),
        invited_by_user:user_profiles(name)
      `)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching company invitations:', error);
      throw error;
    }

    return data;
  }

  // User invitation management (Company Admin functions)
  async createUserInvitation(email, role = 'field_worker', projectId = null, personalMessage = null) {
    try {
      // Get current user's company
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile?.company_id) {
        throw new Error('User not associated with a company');
      }

      const { data, error } = await supabase
        .rpc('create_user_invitation', {
          company_uuid: userProfile.company_id,
          invitation_email: email,
          invitation_role: role,
          project_uuid: projectId,
          personal_msg: personalMessage
        });

      if (error) throw error;

      const invitation = data[0];

      // Get company and inviter details for email
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userProfile.company_id)
        .single();

      const { data: inviter } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Send invitation email
      await this.sendUserInvitationEmail(email, company, inviter, invitation.token, personalMessage, role);

      return {
        invitationId: invitation.invitation_id,
        token: invitation.token,
        invitationUrl: `${window.location.origin}/accept-invitation?token=${invitation.token}`
      };

    } catch (error) {
      console.error('Error creating user invitation:', error);
      throw error;
    }
  }

  async getUserInvitations() {
    try {
      // Get current user's company
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile?.company_id) {
        throw new Error('User not associated with a company');
      }

      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          invited_by_user:user_profiles(name),
          project:projects(name)
        `)
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error fetching user invitations:', error);
      throw error;
    }
  }

  async resendInvitation(invitationId, type = 'user') {
    try {
      const table = type === 'company' ? 'company_invitations' : 'user_invitations';

      const { data: invitation, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', invitationId)
        .single();

      if (error) throw error;

      if (invitation.is_accepted) {
        throw new Error('Invitation has already been accepted');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Update reminder count for user invitations
      if (type === 'user') {
        await supabase
          .from('user_invitations')
          .update({
            reminder_count: invitation.reminder_count + 1,
            last_reminder_at: new Date().toISOString()
          })
          .eq('id', invitationId);
      }

      // Resend email
      if (type === 'company') {
        const { data: company } = await supabase
          .from('companies')
          .select('name, email')
          .eq('id', invitation.company_id)
          .single();

        await this.sendCompanyInvitationEmail(invitation.email, company, invitation.invitation_token);
      } else {
        // Get context for user invitation
        const { data: context } = await supabase
          .from('user_invitations')
          .select(`
            *,
            company:companies(name),
            invited_by_user:user_profiles(name)
          `)
          .eq('id', invitationId)
          .single();

        await this.sendUserInvitationEmail(
          invitation.email,
          context.company,
          context.invited_by_user,
          invitation.invitation_token,
          invitation.personal_message,
          invitation.role
        );
      }

      return { success: true };

    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  async cancelInvitation(invitationId, type = 'user') {
    try {
      const table = type === 'company' ? 'company_invitations' : 'user_invitations';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', invitationId)
        .eq('is_accepted', false);

      if (error) throw error;

      // Also clean up registration token
      const { data: invitation } = await supabase
        .from(table)
        .select('invitation_token')
        .eq('id', invitationId)
        .single();

      if (invitation) {
        await supabase
          .from('registration_tokens')
          .delete()
          .eq('token', invitation.invitation_token)
          .eq('is_used', false);
      }

      return { success: true };

    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  }

  // Invitation acceptance and user registration
  async validateInvitationToken(token) {
    try {
      const { data, error } = await supabase
        .from('registration_tokens')
        .select(`
          *,
          company:companies(name, slug)
        `)
        .eq('token', token)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { valid: false, expired: true };
      }

      return {
        valid: true,
        expired: false,
        tokenData: data
      };

    } catch (error) {
      console.error('Error validating invitation token:', error);
      return { valid: false, expired: true };
    }
  }

  async acceptInvitation(token, userData) {
    try {
      const { name, phone = null } = userData;

      const { data, error } = await supabase
        .rpc('accept_invitation_and_create_profile', {
          invitation_token: token,
          user_name: name,
          user_phone: phone
        });

      if (error) throw error;

      const result = data[0];

      if (!result.success) {
        throw new Error('Invalid or expired invitation token');
      }

      // Get complete user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      return {
        success: true,
        userProfile,
        companyId: result.company_id,
        userRole: result.user_role
      };

    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Invitation analytics
  async getInvitationAnalytics(companyId = null) {
    try {
      // Get current user's company if not provided
      if (!companyId) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        companyId = userProfile?.company_id;
      }

      if (!companyId) {
        throw new Error('Company ID not available');
      }

      const [userInvitations, companyInvitations] = await Promise.all([
        supabase
          .from('user_invitations')
          .select('id, is_accepted, created_at, expires_at')
          .eq('company_id', companyId),

        supabase
          .from('company_invitations')
          .select('id, is_accepted, created_at, expires_at')
          .eq('company_id', companyId)
      ]);

      const userStats = this.calculateInvitationStats(userInvitations.data || []);
      const companyStats = this.calculateInvitationStats(companyInvitations.data || []);

      return {
        userInvitations: userStats,
        companyInvitations: companyStats,
        combined: {
          total: userStats.total + companyStats.total,
          accepted: userStats.accepted + companyStats.accepted,
          pending: userStats.pending + companyStats.pending,
          expired: userStats.expired + companyStats.expired,
          acceptanceRate: ((userStats.accepted + companyStats.accepted) /
                          (userStats.total + companyStats.total)) * 100
        }
      };

    } catch (error) {
      console.error('Error fetching invitation analytics:', error);
      throw error;
    }
  }

  // Email sending functions (integrate with your email service)
  async sendCompanyInvitationEmail(email, company, token) {
    const invitationUrl = `${window.location.origin}/accept-company-invitation?token=${token}`;

    console.log('Sending company invitation email:', {
      to: email,
      subject: `You've been invited to set up ${company.name}`,
      invitationUrl,
      company: company.name
    });

    // Implement with your email service (SendGrid, Mailgun, etc.)
    // This is a placeholder implementation
    return Promise.resolve();
  }

  async sendUserInvitationEmail(email, company, inviter, token, personalMessage, role) {
    const invitationUrl = `${window.location.origin}/accept-invitation?token=${token}`;

    console.log('Sending user invitation email:', {
      to: email,
      subject: `${inviter.name} invited you to join ${company.name}`,
      invitationUrl,
      company: company.name,
      inviter: inviter.name,
      role,
      personalMessage
    });

    // Implement with your email service
    return Promise.resolve();
  }

  // Utility functions
  calculateInvitationStats(invitations) {
    const now = new Date();

    return invitations.reduce((stats, invitation) => {
      stats.total++;

      if (invitation.is_accepted) {
        stats.accepted++;
      } else if (new Date(invitation.expires_at) < now) {
        stats.expired++;
      } else {
        stats.pending++;
      }

      return stats;
    }, {
      total: 0,
      accepted: 0,
      pending: 0,
      expired: 0
    });
  }

  // Bulk operations
  async createBulkUserInvitations(invitations) {
    try {
      const results = [];

      for (const invitation of invitations) {
        const result = await this.createUserInvitation(
          invitation.email,
          invitation.role,
          invitation.projectId,
          invitation.personalMessage
        );
        results.push({ ...invitation, ...result });
      }

      return {
        success: true,
        results,
        created: results.length
      };

    } catch (error) {
      console.error('Error creating bulk invitations:', error);
      throw error;
    }
  }

  async getExpiredInvitations() {
    try {
      const now = new Date().toISOString();

      const [userInvitations, companyInvitations] = await Promise.all([
        supabase
          .from('user_invitations')
          .select('*')
          .eq('is_accepted', false)
          .lt('expires_at', now),

        supabase
          .from('company_invitations')
          .select('*')
          .eq('is_accepted', false)
          .lt('expires_at', now)
      ]);

      return {
        userInvitations: userInvitations.data || [],
        companyInvitations: companyInvitations.data || []
      };

    } catch (error) {
      console.error('Error fetching expired invitations:', error);
      throw error;
    }
  }

  async cleanupExpiredInvitations() {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_invitations');

      if (error) throw error;

      return { cleaned: data };

    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
      throw error;
    }
  }
}

// Create singleton instance
const companyInvitationAPI = new CompanyInvitationAPI();

export default companyInvitationAPI;