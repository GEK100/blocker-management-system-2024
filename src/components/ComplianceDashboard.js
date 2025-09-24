import React, { useState, useEffect } from 'react';
import { gdprAPI } from '../api/gdpr-api';
import { supabase } from '../supabase';
import GDPRConsentManager from './GDPRConsentManager';
import DataExportTool from './DataExportTool';
import './ComplianceDashboard.css';

const ComplianceDashboard = ({ user, company, userRole }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [gdprRequests, setGdprRequests] = useState([]);
  const [companyCompliance, setCompanyCompliance] = useState({});

  const [showConsentManager, setShowConsentManager] = useState(false);
  const [showExportTool, setShowExportTool] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, [user, company]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserCompliance(),
        loadAuditLogs(),
        loadGDPRRequests(),
        loadCompanyCompliance()
      ]);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCompliance = async () => {
    try {
      const data = await gdprAPI.getUserConsent(user.id);
      setComplianceData(data);
    } catch (error) {
      console.error('Error loading user compliance:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadGDPRRequests = async () => {
    try {
      const requests = await gdprAPI.getUserGDPRRequests(user.id);
      setGdprRequests(requests);
    } catch (error) {
      console.error('Error loading GDPR requests:', error);
    }
  };

  const loadCompanyCompliance = async () => {
    if (!company || !['company_owner', 'company_admin'].includes(userRole)) return;

    try {
      const complianceStatus = await gdprAPI.getCompanyGDPRStatus(company.id);
      setCompanyCompliance(complianceStatus);
    } catch (error) {
      console.error('Error loading company compliance:', error);
    }
  };

  const handleDataRetentionUpdate = async (days) => {
    try {
      await gdprAPI.updateUserConsent(user.id, complianceData.gdpr_consent, days);
      await loadUserCompliance();
      alert('Data retention period updated successfully!');
    } catch (error) {
      console.error('Error updating data retention:', error);
      alert('Failed to update data retention period.');
    }
  };

  const requestAccountDeletion = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to request account deletion? This action cannot be undone.\n\n' +
      'Your account and all associated data will be permanently deleted within 30 days.'
    );

    if (!confirmation) return;

    try {
      await gdprAPI.submitGDPRRequest(user.id, 'deletion', {
        reason: 'User requested account deletion',
        confirmation: true
      });

      alert('Account deletion request submitted successfully. You will receive a confirmation email.');
      await loadGDPRRequests();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      alert('Failed to submit account deletion request. Please try again.');
    }
  };

  const getComplianceScore = () => {
    if (!complianceData.gdpr_consent) return 0;

    const consents = complianceData.gdpr_consent;
    const hasEssential = consents.essential?.granted;
    const hasDataProcessing = consents.data_processing?.granted;
    const hasRecentUpdate = complianceData.updated_at &&
      new Date(complianceData.updated_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 months

    let score = 0;
    if (hasEssential) score += 40;
    if (hasDataProcessing) score += 30;
    if (hasRecentUpdate) score += 30;

    return score;
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getActionBadge = (action) => {
    const actionColors = {
      consent_updated: '#2563eb',
      privacy_policy_accepted: '#059669',
      data_exported: '#7c3aed',
      invitation_accepted: '#0891b2',
      company_onboarded: '#dc2626',
      user_role_updated: '#ea580c'
    };

    return (
      <span
        className="action-badge"
        style={{ backgroundColor: actionColors[action] || '#6b7280' }}
      >
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      cancelled: '#6b7280'
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#6b7280' }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="compliance-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-dashboard">
      <div className="compliance-header">
        <h2>Privacy & Compliance</h2>
        <p>Manage your privacy settings and view compliance status</p>
      </div>

      <div className="compliance-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy Rights
        </button>
        <button
          className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Activity Log
        </button>
        {['company_owner', 'company_admin'].includes(userRole) && (
          <button
            className={`tab-button ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Company Compliance
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="compliance-score">
              <div className="score-card">
                <div className="score-header">
                  <h3>Your Compliance Score</h3>
                  <div className="score-actions">
                    <button
                      onClick={() => setShowConsentManager(true)}
                      className="btn-primary btn-small"
                    >
                      Update Preferences
                    </button>
                  </div>
                </div>
                <div className="score-display">
                  <div className="score-circle">
                    <div
                      className="score-fill"
                      style={{
                        background: `conic-gradient(${getComplianceColor(getComplianceScore())} ${getComplianceScore() * 3.6}deg, #e5e7eb 0deg)`
                      }}
                    >
                      <div className="score-inner">
                        <span className="score-number">{getComplianceScore()}</span>
                        <span className="score-label">Score</span>
                      </div>
                    </div>
                  </div>
                  <div className="score-details">
                    <div className="score-item">
                      <span className={`score-indicator ${complianceData.gdpr_consent?.essential?.granted ? 'active' : ''}`}>
                        ✓
                      </span>
                      <span>Essential cookies accepted</span>
                    </div>
                    <div className="score-item">
                      <span className={`score-indicator ${complianceData.gdpr_consent?.data_processing?.granted ? 'active' : ''}`}>
                        ✓
                      </span>
                      <span>Data processing consent</span>
                    </div>
                    <div className="score-item">
                      <span className={`score-indicator ${complianceData.updated_at && new Date(complianceData.updated_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? 'active' : ''}`}>
                        ✓
                      </span>
                      <span>Recent consent update</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="compliance-summary">
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">🔒</div>
                  <div className="summary-content">
                    <h4>Data Retention</h4>
                    <p>{complianceData.data_retention_days || 365} days</p>
                    <small>Your data will be kept for this period after deletion</small>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">📊</div>
                  <div className="summary-content">
                    <h4>GDPR Requests</h4>
                    <p>{gdprRequests.length} total</p>
                    <small>Export and deletion requests made</small>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">🔍</div>
                  <div className="summary-content">
                    <h4>Audit Logs</h4>
                    <p>{auditLogs.length} entries</p>
                    <small>Recent privacy-related activities</small>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">⚡</div>
                  <div className="summary-content">
                    <h4>Last Update</h4>
                    <p>{complianceData.updated_at ? new Date(complianceData.updated_at).toLocaleDateString() : 'Never'}</p>
                    <small>When you last updated your privacy settings</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button
                  onClick={() => setShowExportTool(true)}
                  className="action-button"
                >
                  <div className="action-icon">📥</div>
                  <div className="action-text">
                    <h4>Export My Data</h4>
                    <p>Download all your personal data</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowConsentManager(true)}
                  className="action-button"
                >
                  <div className="action-icon">⚙️</div>
                  <div className="action-text">
                    <h4>Privacy Settings</h4>
                    <p>Manage consent and cookies</p>
                  </div>
                </button>

                <button
                  onClick={requestAccountDeletion}
                  className="action-button danger"
                >
                  <div className="action-icon">🗑️</div>
                  <div className="action-text">
                    <h4>Delete Account</h4>
                    <p>Permanently remove your data</p>
                  </div>
                </button>

                <button
                  onClick={() => window.open('/privacy-policy', '_blank')}
                  className="action-button"
                >
                  <div className="action-icon">📄</div>
                  <div className="action-text">
                    <h4>Privacy Policy</h4>
                    <p>Read our privacy practices</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="privacy-content">
            <div className="privacy-section">
              <h3>Your Privacy Rights</h3>
              <p>Under GDPR and other privacy laws, you have the following rights regarding your personal data:</p>

              <div className="rights-list">
                <div className="right-item">
                  <div className="right-icon">🔍</div>
                  <div className="right-content">
                    <h4>Right to Access</h4>
                    <p>You can request a copy of all personal data we hold about you.</p>
                    <button onClick={() => setShowExportTool(true)} className="btn-secondary btn-small">
                      Export Data
                    </button>
                  </div>
                </div>

                <div className="right-item">
                  <div className="right-icon">✏️</div>
                  <div className="right-content">
                    <h4>Right to Rectification</h4>
                    <p>You can correct inaccurate or incomplete personal data.</p>
                    <button onClick={() => window.location.href = '/profile'} className="btn-secondary btn-small">
                      Edit Profile
                    </button>
                  </div>
                </div>

                <div className="right-item">
                  <div className="right-icon">🗑️</div>
                  <div className="right-content">
                    <h4>Right to Erasure</h4>
                    <p>You can request deletion of your personal data under certain conditions.</p>
                    <button onClick={requestAccountDeletion} className="btn-danger btn-small">
                      Delete Account
                    </button>
                  </div>
                </div>

                <div className="right-item">
                  <div className="right-icon">📤</div>
                  <div className="right-content">
                    <h4>Right to Portability</h4>
                    <p>You can receive your data in a structured, machine-readable format.</p>
                    <button onClick={() => setShowExportTool(true)} className="btn-secondary btn-small">
                      Export Data
                    </button>
                  </div>
                </div>

                <div className="right-item">
                  <div className="right-icon">⚙️</div>
                  <div className="right-content">
                    <h4>Right to Consent Management</h4>
                    <p>You can withdraw or modify your consent for data processing at any time.</p>
                    <button onClick={() => setShowConsentManager(true)} className="btn-secondary btn-small">
                      Manage Consent
                    </button>
                  </div>
                </div>

                <div className="right-item">
                  <div className="right-icon">⏸️</div>
                  <div className="right-content">
                    <h4>Right to Restrict Processing</h4>
                    <p>You can limit how we process your personal data in certain situations.</p>
                    <button onClick={() => window.open('/contact', '_blank')} className="btn-secondary btn-small">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="data-retention-section">
              <h3>Data Retention Settings</h3>
              <p>Choose how long we keep your data after account deletion:</p>

              <div className="retention-options">
                {[30, 90, 180, 365].map(days => (
                  <button
                    key={days}
                    onClick={() => handleDataRetentionUpdate(days)}
                    className={`retention-option ${complianceData.data_retention_days === days ? 'active' : ''}`}
                  >
                    <div className="retention-days">{days}</div>
                    <div className="retention-label">days</div>
                  </button>
                ))}
              </div>

              <div className="retention-info">
                <p><strong>Current setting:</strong> {complianceData.data_retention_days || 365} days</p>
                <small>
                  After this period, all your personal data will be permanently deleted from our systems.
                  Some data may be retained longer if required by law.
                </small>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-content">
            <div className="audit-header">
              <h3>Privacy Activity Log</h3>
              <p>Track all privacy-related actions on your account</p>
            </div>

            <div className="audit-list">
              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No audit logs found.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="audit-item">
                    <div className="audit-info">
                      <div className="audit-header">
                        <div className="audit-action">
                          {getActionBadge(log.action)}
                        </div>
                        <div className="audit-date">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="audit-details">
                        <div className="audit-resource">
                          Resource: {log.resource_type} ({log.resource_id})
                        </div>
                        {log.details && (
                          <div className="audit-metadata">
                            <details>
                              <summary>View Details</summary>
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="gdpr-requests-section">
              <h3>GDPR Requests History</h3>

              {gdprRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No GDPR requests found.</p>
                </div>
              ) : (
                <div className="requests-list">
                  {gdprRequests.map((request) => (
                    <div key={request.id} className="request-item">
                      <div className="request-header">
                        <div className="request-type">
                          {request.request_type === 'export' ? '📥' : '🗑️'} {request.request_type.toUpperCase()}
                        </div>
                        <div className="request-status">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="request-details">
                        <div>Requested: {new Date(request.created_at).toLocaleString()}</div>
                        {request.completed_at && (
                          <div>Completed: {new Date(request.completed_at).toLocaleString()}</div>
                        )}
                        {request.additional_info && Object.keys(request.additional_info).length > 0 && (
                          <details>
                            <summary>Additional Info</summary>
                            <pre>{JSON.stringify(request.additional_info, null, 2)}</pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'company' && ['company_owner', 'company_admin'].includes(userRole) && (
          <div className="company-compliance-content">
            <div className="company-overview">
              <h3>Company GDPR Compliance</h3>
              <div className="compliance-stats">
                <div className="stat-card">
                  <div className="stat-number">{companyCompliance.totalUsers || 0}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{companyCompliance.compliantUsers || 0}</div>
                  <div className="stat-label">Compliant Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{Math.round(companyCompliance.complianceRate || 0)}%</div>
                  <div className="stat-label">Compliance Rate</div>
                </div>
              </div>
            </div>

            <div className="user-compliance-list">
              <h4>User Compliance Status</h4>
              {companyCompliance.users?.map((user) => (
                <div key={user.id} className="user-compliance-item">
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="compliance-indicators">
                    <span className={`indicator ${user.hasConsent ? 'compliant' : 'non-compliant'}`}>
                      Consent: {user.hasConsent ? '✓' : '✗'}
                    </span>
                    <span className={`indicator ${user.hasPrivacyPolicy ? 'compliant' : 'non-compliant'}`}>
                      Privacy: {user.hasPrivacyPolicy ? '✓' : '✗'}
                    </span>
                    <span className={`indicator ${!user.needsUpdate ? 'compliant' : 'non-compliant'}`}>
                      Updated: {!user.needsUpdate ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="last-updated">
                    Last updated: {user.lastUpdated ? new Date(user.lastUpdated).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showConsentManager && (
        <div className="modal-overlay">
          <div className="modal-container">
            <GDPRConsentManager
              user={user}
              onConsentUpdate={() => {
                loadUserCompliance();
                setShowConsentManager(false);
              }}
            />
            <button
              onClick={() => setShowConsentManager(false)}
              className="modal-close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showExportTool && (
        <div className="modal-overlay">
          <div className="modal-container large">
            <DataExportTool
              user={user}
              onClose={() => setShowExportTool(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard;