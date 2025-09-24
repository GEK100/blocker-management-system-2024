import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { multitenant } from '../api/multitenant-api';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import './MobileInvitationAcceptance.css';

const MobileInvitationAcceptance = ({ onAccepted }) => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tempPassword = searchParams.get('temp_password');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [hasNativeApp, setHasNativeApp] = useState(false);

  const [formData, setFormData] = useState({
    password: tempPassword || '',
    confirmPassword: tempPassword || '',
    phone: '',
    acceptTerms: false,
    acceptPrivacyPolicy: false,
    marketingConsent: false,
    setupMobileApp: true
  });

  const [formErrors, setFormErrors] = useState({});

  const mobileAppLinks = {
    android: 'https://play.google.com/store/apps/details?id=com.blockerapp.mobile',
    ios: 'https://apps.apple.com/app/blockerapp/id123456789'
  };

  useEffect(() => {
    detectDevice();
    if (token) {
      loadInvitation();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const detectDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobileDevice(isMobile);

    // Check if user has the native app installed
    if (isMobile) {
      // Try to detect if the native app is available
      const isAndroid = /Android/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);

      if (isAndroid || isIOS) {
        // In a real app, you might use custom URL schemes or other methods to detect app installation
        setHasNativeApp(false); // Default to false, would be dynamically detected
      }
    }
  };

  const loadInvitation = async () => {
    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          *,
          company:companies(*),
          invited_by:user_profiles(full_name),
          projects:invitation_project_access(project:projects(name, status))
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

    // If temp password is provided, user doesn't need to create a new one
    if (!tempPassword) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
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
      const finalPassword = tempPassword || formData.password;

      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: finalPassword,
        options: {
          data: {
            full_name: invitation.full_name,
            invitation_id: invitation.id,
            mobile_invitation: true
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
          mobile_user: isMobileDevice,
          device_type: isMobileDevice ? (
            /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android'
          ) : 'web',
          gdpr_consent: {
            essential: { granted: true, timestamp: new Date().toISOString() },
            analytics: { granted: formData.marketingConsent, timestamp: new Date().toISOString() },
            marketing: { granted: formData.marketingConsent, timestamp: new Date().toISOString() },
            data_processing: { granted: true, timestamp: new Date().toISOString() }
          },
          privacy_policy_accepted: formData.acceptPrivacyPolicy,
          privacy_policy_version: '1.0',
          marketing_consent: formData.marketingConsent,
          onboarded_at: new Date().toISOString(),
          temp_password_used: !!tempPassword
        });

      if (profileError) throw profileError;

      // Add project access
      if (invitation.projects && invitation.projects.length > 0) {
        const projectAccess = invitation.projects.map(projectAccess => ({
          user_id: authData.user.id,
          project_id: projectAccess.project.id || projectAccess.project_id,
          role: invitation.role,
          granted_by: invitation.invited_by,
          granted_at: new Date().toISOString()
        }));

        const { error: accessError } = await supabase
          .from('project_access')
          .insert(projectAccess);

        if (accessError) {
          console.error('Error adding project access:', accessError);
        }
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: authData.user.id,
          accepted_from_mobile: isMobileDevice
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
      }

      // Log the acceptance
      await supabase
        .from('audit_logs')
        .insert({
          user_id: authData.user.id,
          action: 'mobile_invitation_accepted',
          resource_type: 'invitation',
          resource_id: invitation.id,
          details: {
            company_id: invitation.company_id,
            role: invitation.role,
            invited_by: invitation.invited_by,
            device_type: isMobileDevice ? (
              /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'android'
            ) : 'web',
            temp_password_used: !!tempPassword
          }
        });

      // Set up multitenant context
      await multitenant.setCurrentCompany(company);

      // If this is a mobile setup, show app download options
      if (formData.setupMobileApp && isMobileDevice && !hasNativeApp) {
        showMobileAppSetup();
      }

      // Call completion callback
      if (onAccepted) {
        onAccepted({
          user: authData.user,
          profile: {
            id: authData.user.id,
            email: invitation.email,
            full_name: invitation.full_name,
            role: invitation.role,
            company_id: invitation.company_id,
            mobile_user: isMobileDevice
          },
          company: company,
          isMobileDevice,
          setupMobileApp: formData.setupMobileApp
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const showMobileAppSetup = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const storeUrl = isIOS ? mobileAppLinks.ios : mobileAppLinks.android;
    const storeName = isIOS ? 'App Store' : 'Google Play Store';

    const message = `
      🎉 Welcome to ${company.name}!

      📱 For the best field experience, download our mobile app:

      • Optimized for construction sites
      • Offline capability
      • Camera integration for blocker photos
      • GPS location tracking
      • Push notifications

      Would you like to download the app from the ${storeName}?
    `;

    if (window.confirm(message)) {
      window.open(storeUrl, '_blank');
    }
  };

  const openMobileApp = () => {
    // Try to open the native app with deep link
    const deepLinkUrl = `blockerapp://invite?token=${token}&company=${company.slug}`;

    // Create a hidden iframe to try the deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLinkUrl;
    document.body.appendChild(iframe);

    // If app doesn't open in 2 seconds, redirect to store
    setTimeout(() => {
      document.body.removeChild(iframe);
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const storeUrl = isIOS ? mobileAppLinks.ios : mobileAppLinks.android;
      window.location.href = storeUrl;
    }, 2000);
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
      <div className="mobile-invitation-acceptance loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-invitation-acceptance error">
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
    <div className={`mobile-invitation-acceptance ${isMobileDevice ? 'mobile-optimized' : ''}`}>
      <div className="acceptance-container">
        <div className="acceptance-header">
          <div className="company-logo">🏗️</div>
          <div className="company-info">
            <h1>Join {company.name}</h1>
            <p>You've been invited to join the team</p>
            {isMobileDevice && (
              <div className="mobile-indicator">
                📱 Mobile-optimized setup
              </div>
            )}
          </div>
        </div>

        {isMobileDevice && hasNativeApp && (
          <div className="native-app-option">
            <div className="app-option-card">
              <div className="app-icon">📱</div>
              <div className="app-info">
                <h3>Open in BlockerApp</h3>
                <p>You have the BlockerApp installed. Open for the best experience!</p>
              </div>
              <button onClick={openMobileApp} className="btn-app">
                Open App
              </button>
            </div>
          </div>
        )}

        <div className="invitation-details">
          <div className="invitation-card">
            <div className="invitation-header">
              <h2>Invitation Details</h2>
              {invitation.mobile_invitation && (
                <span className="mobile-invitation-badge">📱 Mobile Invitation</span>
              )}
            </div>

            <div className="invitation-info">
              <div className="info-grid">
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
                  <span className="label">Device:</span>
                  <span className="value">{invitation.device_type?.toUpperCase() || 'Any'}</span>
                </div>
              </div>

              {invitation.projects && invitation.projects.length > 0 && (
                <div className="projects-access">
                  <h4>Project Access:</h4>
                  <div className="projects-list">
                    {invitation.projects.map((projectAccess, index) => (
                      <div key={index} className="project-item">
                        <span className="project-name">{projectAccess.project.name}</span>
                        <span className="project-status">{projectAccess.project.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invitation.custom_message && (
                <div className="custom-message">
                  <h4>Personal Message:</h4>
                  <p>"{invitation.custom_message}"</p>
                </div>
              )}

              {invitation.temp_credentials && (
                <div className="temp-credentials">
                  <h4>🔐 Login Information:</h4>
                  <p>We've set up temporary login credentials for you:</p>
                  <div className="credentials-info">
                    <div className="credential-item">
                      <span>Email:</span>
                      <span>{invitation.email}</span>
                    </div>
                    <div className="credential-item">
                      <span>Password:</span>
                      <span className="temp-password">{invitation.temp_credentials.tempPassword}</span>
                    </div>
                  </div>
                  <p className="credentials-note">
                    ⚠️ Please change this password after your first login.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="acceptance-form">
            <h2>Complete Your Setup</h2>

            {!tempPassword && (
              <div className="password-section">
                <p>Create a secure password for your account:</p>
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
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {isMobileDevice && !hasNativeApp && (
              <div className="mobile-app-section">
                <label className="checkbox-label mobile-setup">
                  <input
                    type="checkbox"
                    checked={formData.setupMobileApp}
                    onChange={(e) => handleInputChange('setupMobileApp', e.target.checked)}
                  />
                  📱 Help me set up the mobile app for field work
                </label>
                <p className="mobile-app-benefits">
                  Get offline access, camera integration, GPS tracking, and push notifications.
                </p>
              </div>
            )}

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
                  Send me product updates and construction industry tips
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={acceptInvitation}
                disabled={accepting}
                className={`btn-primary ${isMobileDevice ? 'mobile-optimized' : ''}`}
              >
                {accepting ? 'Setting Up Account...' : '🚀 Join Team & Get Started'}
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

export default MobileInvitationAcceptance;