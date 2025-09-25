import { supabase } from './supabase';

export const inviteAPI = {
  // Generate a secure invitation token
  generateInviteToken: () => {
    // Browser-compatible random token generation
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Generate a simple UUID for browser compatibility
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Create a company invitation
  async createCompanyInvitation({
    companyName,
    adminEmail,
    subscriptionPlan = 'trial',
    invitedBy,
    expiresInDays = 7
  }) {
    try {
      const token = inviteAPI.generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const invitation = {
        id: inviteAPI.generateUUID(),
        token,
        companyName,
        adminEmail,
        subscriptionPlan,
        invitedBy,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      };

      // In production, this would be stored in Supabase
      // For demo purposes, store in localStorage
      const existingInvites = JSON.parse(localStorage.getItem('companyInvitations') || '[]');
      existingInvites.push(invitation);
      localStorage.setItem('companyInvitations', JSON.stringify(existingInvites));

      // Generate invitation URL
      const inviteUrl = `${window.location.origin}/company-onboarding?token=${token}`;

      // In production, send email here
      console.log('Company invitation created:', {
        companyName,
        adminEmail,
        inviteUrl,
        expiresAt
      });

      return {
        success: true,
        invitation,
        inviteUrl
      };
    } catch (error) {
      console.error('Error creating company invitation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Validate invitation token
  async validateInviteToken(token) {
    try {
      const invitations = JSON.parse(localStorage.getItem('companyInvitations') || '[]');
      const invitation = invitations.find(inv => inv.token === token);

      if (!invitation) {
        return {
          valid: false,
          error: 'Invalid invitation token'
        };
      }

      if (invitation.status !== 'pending') {
        return {
          valid: false,
          error: 'Invitation has already been used'
        };
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        return {
          valid: false,
          error: 'Invitation has expired'
        };
      }

      return {
        valid: true,
        invitation
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  // Mark invitation as used
  async markInviteAsUsed(token, companyId) {
    try {
      const invitations = JSON.parse(localStorage.getItem('companyInvitations') || '[]');
      const inviteIndex = invitations.findIndex(inv => inv.token === token);

      if (inviteIndex === -1) {
        throw new Error('Invitation not found');
      }

      invitations[inviteIndex].status = 'used';
      invitations[inviteIndex].companyId = companyId;
      invitations[inviteIndex].usedAt = new Date().toISOString();

      localStorage.setItem('companyInvitations', JSON.stringify(invitations));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Send email verification
  async sendEmailVerification(email, verificationCode) {
    try {
      // In production, this would send an actual email
      console.log('Email verification sent:', {
        email,
        verificationCode,
        subject: 'Verify your email for construction management platform'
      });

      // Store verification code temporarily (in production, use a secure backend)
      const verifications = JSON.parse(localStorage.getItem('emailVerifications') || '{}');
      verifications[email] = {
        code: verificationCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
      localStorage.setItem('emailVerifications', JSON.stringify(verifications));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify email code
  async verifyEmailCode(email, code) {
    try {
      const verifications = JSON.parse(localStorage.getItem('emailVerifications') || '{}');
      const verification = verifications[email];

      if (!verification) {
        return {
          valid: false,
          error: 'No verification code found for this email'
        };
      }

      if (new Date() > new Date(verification.expiresAt)) {
        return {
          valid: false,
          error: 'Verification code has expired'
        };
      }

      if (verification.code !== code) {
        return {
          valid: false,
          error: 'Invalid verification code'
        };
      }

      // Remove used verification
      delete verifications[email];
      localStorage.setItem('emailVerifications', JSON.stringify(verifications));

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
};

export default inviteAPI;