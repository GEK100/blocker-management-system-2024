import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { multitenant } from '../lib/multitenant-api';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import './InvitationAcceptance.css';

const InvitationAcceptance = ({ onAccepted }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
    acceptPrivacyPolicy: false,
    marketingConsent: false
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          company:companies(*),
          invited_by:user_profiles(full_name)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !inviteData) {
        throw new Error('Invitation not found or has expired');
      }

      // Check if invitation has expired
      if (new Date() > new Date(inviteData.expires_at)) {
        throw new Error('This invitation has expired');
      }

      setInvitation(inviteData);
      setCompany(inviteData.company);
      setLoading(false);
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms of service';
    }

    if (!formData.acceptPrivacyPolicy) {
      errors.acceptPrivacyPolicy = 'You must accept the privacy policy';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const acceptInvitation = async () => {
    if (!validateForm()) return;

    setAccepting(true);
    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: invitation.full_name,
            invitation_id: invitation.id
          }
        }
      });

      if (authError) throw authError;

      // Wait for the user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: invitation.email,
          full_name: invitation.full_name,
          phone: formData.phone || null,
          role: invitation.role,
          company_id: invitation.company_id,
          status: 'active',
          gdpr_consent: {
            essential: { granted: true, timestamp: new Date().toISOString() },
            analytics: { granted: formData.marketingConsent, timestamp: new Date().toISOString() },
            marketing: { granted: formData.marketingConsent, timestamp: new Date().toISOString() },
            data_processing: { granted: true, timestamp: new Date().toISOString() }
          },
          privacy_policy_accepted: formData.acceptPrivacyPolicy,
          privacy_policy_version: '1.0',
          marketing_consent: formData.marketingConsent,
          onboarded_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Add project access if specified
      if (invitation.project_access && invitation.project_access.length > 0) {
        const projectAccess = invitation.project_access.map(projectId => ({
          user_id: authData.user.id,
          project_id: projectId,
          role: invitation.role,
          granted_by: invitation.invited_by,
          granted_at: new Date().toISOString()
        }));

        const { error: accessError } = await supabase
          .from('project_access')
          .insert(projectAccess);

        if (accessError) {
          console.error('Error adding project access:', accessError);
          // Don't throw here as the user is already created
        }
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: authData.user.id
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        // Don't throw here as the user is already created
      }

      // Log the acceptance
      await supabase
        .from('audit_logs')
        .insert({
          user_id: authData.user.id,
          action: 'invitation_accepted',
          resource_type: 'invitation',
          resource_id: invitation.id,
          details: {
            company_id: invitation.company_id,
            role: invitation.role,
            invited_by: invitation.invited_by
          }
        });

      // Set up multitenant context
      await multitenant.setCurrentCompany(company);

      // Call completion callback
      if (onAccepted) {
        onAccepted({
          user: authData.user,
          profile: {
            id: authData.user.id,
            email: invitation.email,
            full_name: invitation.full_name,
            role: invitation.role,
            company_id: invitation.company_id
          },
          company: company
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      company_admin: '#2563eb',
      project_manager: '#059669',
      supervisor: '#d97706',
      field_worker: '#6b7280'
    };

    const roleLabels = {
      company_admin: 'Company Admin',
      project_manager: 'Project Manager',
      supervisor: 'Supervisor',
      field_worker: 'Field Worker'
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

  if (loading) {
    return (
      <div className="invitation-acceptance loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-acceptance error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Invitation Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.href = '/'} className="btn-primary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-acceptance">
      <div className="acceptance-container">
        <div className="acceptance-header">
          <div className="company-info">
            <h1>Join {company.name}</h1>
            <p>You've been invited to join {company.name} as a team member</p>
          </div>
        </div>

        <div className="invitation-details">
          <div className="invitation-card">
            <div className="invitation-header">
              <h2>Invitation Details</h2>
            </div>

            <div className="invitation-info">
              <div className="info-item">
                <span className="label">Company:</span>
                <span className="value">{company.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Your Name:</span>
                <span className="value">{invitation.full_name}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{invitation.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Role:</span>
                <span className="value">{getRoleBadge(invitation.role)}</span>
              </div>
              <div className="info-item">
                <span className="label">Invited by:</span>
                <span className="value">{invitation.invited_by?.full_name || 'System Admin'}</span>
              </div>
              <div className="info-item">
                <span className="label">Expires:</span>
                <span className="value">{new Date(invitation.expires_at).toLocaleDateString()}</span>
              </div>

              {invitation.project_access && invitation.project_access.length > 0 && (
                <div className="info-item">
                  <span className="label">Project Access:</span>
                  <span className="value">{invitation.project_access.length} project(s)</span>
                </div>
              )}

              {invitation.message && (
                <div className="invitation-message">
                  <h3>Personal Message:</h3>
                  <p>"{invitation.message}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="acceptance-form">
            <h2>Complete Your Account</h2>
            <p>Set up your password and preferences to get started.</p>

            <div className="form-grid">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="At least 8 characters"
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={formErrors.confirmPassword ? 'error' : ''}
                />
                {formErrors.confirmPassword && <span className="error-text">{formErrors.confirmPassword}</span>}
              </div>

              <div className="form-group full-width">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="legal-agreements">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className={formErrors.acceptTerms ? 'error' : ''}
                  />
                  I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> *
                </label>
                {formErrors.acceptTerms && <span className="error-text">{formErrors.acceptTerms}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.acceptPrivacyPolicy}
                    onChange={(e) => handleInputChange('acceptPrivacyPolicy', e.target.checked)}
                    className={formErrors.acceptPrivacyPolicy ? 'error' : ''}
                  />
                  I accept the <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="link-button">Privacy Policy</button> *
                </label>
                {formErrors.acceptPrivacyPolicy && <span className="error-text">{formErrors.acceptPrivacyPolicy}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                  />
                  I'd like to receive product updates and tips via email
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={acceptInvitation}
                disabled={accepting}
                className="btn-primary"
              >
                {accepting ? 'Creating Account...' : 'Accept Invitation & Join'}
              </button>
            </div>
          </div>
        </div>

        {showPrivacyPolicy && (
          <PrivacyPolicyModal
            isOpen={showPrivacyPolicy}
            onClose={() => setShowPrivacyPolicy(false)}
            onAccept={() => {
              handleInputChange('acceptPrivacyPolicy', true);
              setShowPrivacyPolicy(false);
            }}
            companyName={company.name}
          />
        )}
      </div>
    </div>
  );
};

export default InvitationAcceptance;
