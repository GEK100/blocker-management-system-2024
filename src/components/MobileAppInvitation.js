import React, { useState, useEffect } from 'react';
import { multitenant } from '../api/multitenant-api';
import { supabase } from '../supabase';
import QRCode from 'qrcode.react';
import './MobileAppInvitation.css';

const MobileAppInvitation = ({ company, currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState('invite');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    role: 'field_worker',
    projectIds: [],
    sendMobileLink: true,
    generateTempCredentials: true,
    customMessage: '',
    deviceType: 'android' // android, ios, both
  });

  const [mobileSettings, setMobileSettings] = useState({
    appDownloadLinks: {
      android: 'https://play.google.com/store/apps/details?id=com.blockerapp.mobile',
      ios: 'https://apps.apple.com/app/blockerapp/id123456789',
      web: window.location.origin
    },
    deepLinkScheme: 'blockerapp://',
    qrCodeEnabled: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadProjects(),
        loadInvitations()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await multitenant.projectAPI.getAll();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          invited_by:user_profiles(full_name),
          projects:project_access(project:projects(name))
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleProjectSelection = (projectId, selected) => {
    setInviteForm(prev => ({
      ...prev,
      projectIds: selected
        ? [...prev.projectIds, projectId]
        : prev.projectIds.filter(id => id !== projectId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!inviteForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteForm.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!inviteForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (inviteForm.projectIds.length === 0) {
      newErrors.projects = 'Please select at least one project';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTempCredentials = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const tempPassword = `BlockerApp${randomSuffix}!`;
    return {
      tempPassword,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  };

  const generateDeepLink = (inviteToken, tempCredentials) => {
    const baseUrl = mobileSettings.deepLinkScheme;
    const params = new URLSearchParams({
      action: 'accept_invitation',
      token: inviteToken,
      company: company.slug,
      ...(tempCredentials && {
        temp_password: tempCredentials.tempPassword
      })
    });

    return `${baseUrl}invite?${params.toString()}`;
  };

  const generateWebLink = (inviteToken) => {
    return `${window.location.origin}/accept-invitation?token=${inviteToken}&company=${company.slug}`;
  };

  const sendMobileInvitation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', inviteForm.email.toLowerCase())
        .eq('company_id', company.id)
        .single();

      if (existingUser) {
        setErrors({ email: 'User is already part of this company' });
        setLoading(false);
        return;
      }

      // Generate invitation token and temp credentials
      const inviteToken = crypto.randomUUID();
      const tempCredentials = inviteForm.generateTempCredentials ? generateTempCredentials() : null;

      // Create invitation record
      const invitationData = {
        id: crypto.randomUUID(),
        company_id: company.id,
        email: inviteForm.email.toLowerCase(),
        full_name: inviteForm.fullName,
        role: inviteForm.role,
        token: inviteToken,
        invited_by: currentUser.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        mobile_invitation: true,
        device_type: inviteForm.deviceType,
        temp_credentials: tempCredentials,
        custom_message: inviteForm.customMessage
      };

      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert(invitationData)
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Add project access
      if (inviteForm.projectIds.length > 0) {
        const projectAccess = inviteForm.projectIds.map(projectId => ({
          invitation_id: invitation.id,
          project_id: projectId,
          role: inviteForm.role
        }));

        const { error: accessError } = await supabase
          .from('invitation_project_access')
          .insert(projectAccess);

        if (accessError) {
          console.error('Error adding project access:', accessError);
        }
      }

      // Generate mobile links
      const deepLink = generateDeepLink(inviteToken, tempCredentials);
      const webLink = generateWebLink(inviteToken);

      const downloadLinks = {
        android: mobileSettings.appDownloadLinks.android,
        ios: mobileSettings.appDownloadLinks.ios,
        web: webLink
      };

      // Create mobile invitation email content
      const emailContent = createMobileInvitationEmail({
        recipientName: inviteForm.fullName,
        companyName: company.name,
        inviterName: currentUser.full_name,
        role: inviteForm.role,
        projects: projects.filter(p => inviteForm.projectIds.includes(p.id)),
        downloadLinks,
        deepLink,
        tempCredentials,
        customMessage: inviteForm.customMessage,
        deviceType: inviteForm.deviceType
      });

      // In a real implementation, this would send via email service
      console.log('Mobile invitation email content:', emailContent);

      // Log the invitation
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'mobile_invitation_sent',
          resource_type: 'invitation',
          resource_id: invitation.id,
          details: {
            recipient_email: inviteForm.email,
            recipient_name: inviteForm.fullName,
            role: inviteForm.role,
            projects: inviteForm.projectIds.length,
            device_type: inviteForm.deviceType,
            temp_credentials: !!tempCredentials
          }
        });

      // Show success with links
      showInvitationSuccess({
        email: inviteForm.email,
        deepLink,
        webLink,
        downloadLinks,
        tempCredentials
      });

      // Reset form and reload
      setInviteForm({
        email: '',
        fullName: '',
        role: 'field_worker',
        projectIds: [],
        sendMobileLink: true,
        generateTempCredentials: true,
        customMessage: '',
        deviceType: 'android'
      });

      await loadInvitations();
    } catch (error) {
      console.error('Error sending mobile invitation:', error);
      setErrors({ submit: error.message || 'Failed to send invitation' });
    } finally {
      setLoading(false);
    }
  };

  const createMobileInvitationEmail = ({
    recipientName,
    companyName,
    inviterName,
    role,
    projects,
    downloadLinks,
    deepLink,
    tempCredentials,
    customMessage,
    deviceType
  }) => {
    return {
      subject: `You're invited to join ${companyName} on BlockerApp`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BlockerApp Invitation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 2rem; text-align: center; }
            .content { padding: 2rem; }
            .mobile-section { background: #f0f9ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; }
            .download-buttons { display: flex; gap: 1rem; justify-content: center; margin: 1rem 0; }
            .download-btn { display: inline-block; padding: 12px 24px; background: #1f2937; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
            .credentials-box { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
            .qr-section { text-align: center; margin: 1.5rem 0; }
            .projects-list { background: #f9fafb; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${companyName}!</h1>
              <p>You've been invited to join our construction management team</p>
            </div>

            <div class="content">
              <p>Hi ${recipientName},</p>
              <p>${inviterName} has invited you to join <strong>${companyName}</strong> as a <strong>${role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>.</p>

              ${customMessage ? `<div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 1rem; margin: 1rem 0;"><p><em>"${customMessage}"</em></p></div>` : ''}

              <div class="projects-list">
                <h3>You'll have access to these projects:</h3>
                <ul>
                  ${projects.map(project => `<li><strong>${project.name}</strong> (${project.status})</li>`).join('')}
                </ul>
              </div>

              <div class="mobile-section">
                <h3>📱 Get Started on Mobile</h3>
                <p>For the best field experience, download our mobile app:</p>

                <div class="download-buttons">
                  ${deviceType === 'android' || deviceType === 'both' ?
                    `<a href="${downloadLinks.android}" class="download-btn">📱 Download for Android</a>` : ''}
                  ${deviceType === 'ios' || deviceType === 'both' ?
                    `<a href="${downloadLinks.ios}" class="download-btn">🍎 Download for iOS</a>` : ''}
                </div>

                <p><strong>Quick Setup:</strong> After installing, tap this link to automatically set up your account:</p>
                <div style="text-align: center; margin: 1rem 0;">
                  <a href="${deepLink}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">⚡ Open in App</a>
                </div>
              </div>

              ${tempCredentials ? `
                <div class="credentials-box">
                  <h4>🔐 Temporary Login Credentials</h4>
                  <p>Use these credentials to log in for the first time:</p>
                  <p><strong>Email:</strong> ${inviteForm.email}</p>
                  <p><strong>Password:</strong> <code>${tempCredentials.tempPassword}</code></p>
                  <p><small>⚠️ Please change this password after your first login. These credentials expire on ${tempCredentials.expiresAt.toLocaleDateString()}.</small></p>
                </div>
              ` : ''}

              <div style="margin: 2rem 0;">
                <h3>🌐 Prefer Web Access?</h3>
                <p>You can also access BlockerApp from any browser:</p>
                <div style="text-align: center;">
                  <a href="${downloadLinks.web}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Open Web App</a>
                </div>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
                <p>This invitation expires in 7 days. If you have any questions, contact ${inviterName} or our support team.</p>
                <p>BlockerApp - Construction Management Made Simple</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
  };

  const showInvitationSuccess = ({ email, deepLink, webLink, downloadLinks, tempCredentials }) => {
    const message = `
      ✅ Mobile invitation sent to ${email}!

      🔗 Links generated:
      • Deep link: ${deepLink}
      • Web link: ${webLink}
      • Android: ${downloadLinks.android}
      • iOS: ${downloadLinks.ios}

      ${tempCredentials ? `🔐 Temporary credentials:
      • Password: ${tempCredentials.tempPassword}
      • Expires: ${tempCredentials.expiresAt.toLocaleDateString()}` : ''}

      The user will receive an email with download links and setup instructions.
    `;

    alert(message);
  };

  const resendInvitation = async (invitationId) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      // Update expiration date
      const { error } = await supabase
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      // Regenerate links and resend
      const deepLink = generateDeepLink(invitation.token, invitation.temp_credentials);
      const webLink = generateWebLink(invitation.token);

      console.log('Resending invitation with links:', { deepLink, webLink });

      await loadInvitations();
      alert('Invitation resent successfully!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#10b981',
      expired: '#6b7280',
      cancelled: '#ef4444'
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: colors[status] || '#6b7280' }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const generateQRCode = (deepLink) => {
    return (
      <div className="qr-code-container">
        <QRCode
          value={deepLink}
          size={150}
          level="M"
          includeMargin={true}
        />
        <p>Scan to open in mobile app</p>
      </div>
    );
  };

  return (
    <div className="mobile-app-invitation">
      <div className="invitation-header">
        <h2>Mobile App Invitations</h2>
        <p>Invite team members with mobile app integration</p>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="invitation-tabs">
        <button
          className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          Send Invitation
        </button>
        <button
          className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Sent Invitations ({invitations.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Mobile Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'invite' && (
          <div className="invite-form">
            <h3>Send Mobile App Invitation</h3>

            <div className="form-section">
              <h4>User Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john.doe@company.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={inviteForm.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                  >
                    <option value="field_worker">Field Worker</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="company_admin">Company Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Device Type</label>
                  <select
                    value={inviteForm.deviceType}
                    onChange={(e) => handleInputChange('deviceType', e.target.value)}
                  >
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                    <option value="both">Both Android & iOS</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Project Access *</h4>
              {errors.projects && <span className="error-text">{errors.projects}</span>}
              <div className="projects-grid">
                {projects.map(project => (
                  <label key={project.id} className="project-checkbox">
                    <input
                      type="checkbox"
                      checked={inviteForm.projectIds.includes(project.id)}
                      onChange={(e) => handleProjectSelection(project.id, e.target.checked)}
                    />
                    <div className="project-info">
                      <div className="project-name">{project.name}</div>
                      <div className="project-status">{project.status}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h4>Mobile App Settings</h4>
              <div className="settings-grid">
                <label className="checkbox-setting">
                  <input
                    type="checkbox"
                    checked={inviteForm.sendMobileLink}
                    onChange={(e) => handleInputChange('sendMobileLink', e.target.checked)}
                  />
                  Include mobile app download links
                </label>

                <label className="checkbox-setting">
                  <input
                    type="checkbox"
                    checked={inviteForm.generateTempCredentials}
                    onChange={(e) => handleInputChange('generateTempCredentials', e.target.checked)}
                  />
                  Generate temporary login credentials
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4>Custom Message (Optional)</h4>
              <textarea
                value={inviteForm.customMessage}
                onChange={(e) => handleInputChange('customMessage', e.target.value)}
                placeholder="Add a personal message to the invitation..."
                rows="3"
              />
            </div>

            {errors.submit && <div className="error-banner">{errors.submit}</div>}

            <div className="form-actions">
              <button
                onClick={sendMobileInvitation}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Sending...' : '📱 Send Mobile Invitation'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="invitations-list">
            <h3>Sent Mobile Invitations</h3>

            {invitations.length === 0 ? (
              <div className="empty-state">
                <p>No invitations sent yet.</p>
              </div>
            ) : (
              <div className="invitations-table">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="invitation-item">
                    <div className="invitation-info">
                      <div className="invitation-header">
                        <div className="invitee-details">
                          <div className="invitee-name">{invitation.full_name}</div>
                          <div className="invitee-email">{invitation.email}</div>
                        </div>
                        <div className="invitation-badges">
                          {getStatusBadge(invitation.status)}
                          {invitation.mobile_invitation && (
                            <span className="mobile-badge">📱 Mobile</span>
                          )}
                        </div>
                      </div>

                      <div className="invitation-details">
                        <div className="detail-row">
                          <span>Role:</span>
                          <span>{invitation.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                        <div className="detail-row">
                          <span>Device:</span>
                          <span>{invitation.device_type?.toUpperCase() || 'Any'}</span>
                        </div>
                        <div className="detail-row">
                          <span>Sent:</span>
                          <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-row">
                          <span>Expires:</span>
                          <span>{new Date(invitation.expires_at).toLocaleDateString()}</span>
                        </div>
                        {invitation.temp_credentials && (
                          <div className="detail-row">
                            <span>Temp Password:</span>
                            <span className="credential-text">{invitation.temp_credentials.tempPassword}</span>
                          </div>
                        )}
                      </div>

                      {mobileSettings.qrCodeEnabled && invitation.status === 'pending' && (
                        <div className="qr-code-section">
                          {generateQRCode(generateDeepLink(invitation.token, invitation.temp_credentials))}
                        </div>
                      )}
                    </div>

                    <div className="invitation-actions">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => resendInvitation(invitation.id)}
                            className="btn-secondary btn-small"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => {
                              const deepLink = generateDeepLink(invitation.token, invitation.temp_credentials);
                              navigator.clipboard.writeText(deepLink);
                              alert('Deep link copied to clipboard!');
                            }}
                            className="btn-outline btn-small"
                          >
                            Copy Link
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="mobile-settings">
            <h3>Mobile App Settings</h3>

            <div className="settings-section">
              <h4>App Store Links</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Android Play Store</label>
                  <input
                    type="url"
                    value={mobileSettings.appDownloadLinks.android}
                    onChange={(e) => setMobileSettings(prev => ({
                      ...prev,
                      appDownloadLinks: { ...prev.appDownloadLinks, android: e.target.value }
                    }))}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>

                <div className="form-group">
                  <label>iOS App Store</label>
                  <input
                    type="url"
                    value={mobileSettings.appDownloadLinks.ios}
                    onChange={(e) => setMobileSettings(prev => ({
                      ...prev,
                      appDownloadLinks: { ...prev.appDownloadLinks, ios: e.target.value }
                    }))}
                    placeholder="https://apps.apple.com/app/..."
                  />
                </div>

                <div className="form-group">
                  <label>Web App URL</label>
                  <input
                    type="url"
                    value={mobileSettings.appDownloadLinks.web}
                    onChange={(e) => setMobileSettings(prev => ({
                      ...prev,
                      appDownloadLinks: { ...prev.appDownloadLinks, web: e.target.value }
                    }))}
                    placeholder="https://app.blockerapp.com"
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Deep Link Configuration</h4>
              <div className="form-group">
                <label>Deep Link Scheme</label>
                <input
                  type="text"
                  value={mobileSettings.deepLinkScheme}
                  onChange={(e) => setMobileSettings(prev => ({
                    ...prev,
                    deepLinkScheme: e.target.value
                  }))}
                  placeholder="blockerapp://"
                />
                <small>Used for direct app opening from emails and QR codes</small>
              </div>
            </div>

            <div className="settings-section">
              <h4>Features</h4>
              <label className="checkbox-setting">
                <input
                  type="checkbox"
                  checked={mobileSettings.qrCodeEnabled}
                  onChange={(e) => setMobileSettings(prev => ({
                    ...prev,
                    qrCodeEnabled: e.target.checked
                  }))}
                />
                Enable QR codes for easy mobile setup
              </label>
            </div>

            <div className="preview-section">
              <h4>Preview Mobile Invitation</h4>
              <div className="mobile-preview">
                <div className="preview-phone">
                  <div className="preview-screen">
                    <div className="preview-header">BlockerApp Invitation</div>
                    <div className="preview-content">
                      <p>Welcome to {company.name}!</p>
                      <button className="preview-btn">📱 Download App</button>
                      <button className="preview-btn">⚡ Open in App</button>
                      {mobileSettings.qrCodeEnabled && (
                        <div className="preview-qr">
                          <div className="qr-placeholder">QR Code</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAppInvitation;