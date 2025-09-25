import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './GDPRConsentManager.css';

const GDPRConsentManager = ({ user, onConsentUpdate }) => {
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);

  const consentTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      description: 'Required for basic site functionality and security',
      required: true
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Help us improve our service by collecting usage data',
      required: false
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive updates about new features and company news',
      required: false
    },
    {
      id: 'data_processing',
      title: 'Data Processing',
      description: 'Process your data for service delivery and improvement',
      required: true
    }
  ];

  useEffect(() => {
    if (user) {
      loadUserConsents();
      checkConsentStatus();
    }
  }, [user]);

  const loadUserConsents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gdpr_consent, data_retention_days')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data.gdpr_consent) {
        setConsents(data.gdpr_consent);
        setDataRetentionDays(data.data_retention_days || 365);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading consents:', error);
      setLoading(false);
    }
  };

  const checkConsentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gdpr_consent, updated_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data.gdpr_consent || Object.keys(data.gdpr_consent).length === 0) {
        setShowBanner(true);
      } else {
        const lastUpdated = new Date(data.updated_at);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (lastUpdated < sixMonthsAgo) {
          setShowBanner(true);
        }
      }
    } catch (error) {
      console.error('Error checking consent status:', error);
    }
  };

  const updateConsent = async (consentId, granted) => {
    const newConsents = {
      ...consents,
      [consentId]: {
        granted,
        timestamp: new Date().toISOString()
      }
    };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          gdpr_consent: newConsents,
          data_retention_days: dataRetentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setConsents(newConsents);

      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'consent_updated',
          resource_type: 'gdpr_consent',
          resource_id: user.id,
          details: { consent_type: consentId, granted, retention_days: dataRetentionDays }
        });

      if (onConsentUpdate) {
        onConsentUpdate(newConsents);
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      alert('Failed to update consent preferences. Please try again.');
    }
  };

  const acceptAllConsents = async () => {
    const newConsents = {};
    consentTypes.forEach(type => {
      newConsents[type.id] = {
        granted: true,
        timestamp: new Date().toISOString()
      };
    });

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          gdpr_consent: newConsents,
          data_retention_days: dataRetentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setConsents(newConsents);
      setShowBanner(false);

      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'consent_all_accepted',
          resource_type: 'gdpr_consent',
          resource_id: user.id,
          details: { retention_days: dataRetentionDays }
        });

      if (onConsentUpdate) {
        onConsentUpdate(newConsents);
      }
    } catch (error) {
      console.error('Error accepting all consents:', error);
      alert('Failed to update consent preferences. Please try again.');
    }
  };

  const rejectNonEssential = async () => {
    const newConsents = {};
    consentTypes.forEach(type => {
      newConsents[type.id] = {
        granted: type.required,
        timestamp: new Date().toISOString()
      };
    });

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          gdpr_consent: newConsents,
          data_retention_days: dataRetentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setConsents(newConsents);
      setShowBanner(false);

      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'consent_essential_only',
          resource_type: 'gdpr_consent',
          resource_id: user.id,
          details: { retention_days: dataRetentionDays }
        });

      if (onConsentUpdate) {
        onConsentUpdate(newConsents);
      }
    } catch (error) {
      console.error('Error updating consents:', error);
      alert('Failed to update consent preferences. Please try again.');
    }
  };

  const requestDataExport = async () => {
    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: user.id,
          request_type: 'export',
          status: 'pending'
        });

      if (error) throw error;

      alert('Data export request submitted. You will receive an email within 30 days with your data.');
    } catch (error) {
      console.error('Error requesting data export:', error);
      alert('Failed to submit data export request. Please try again.');
    }
  };

  const requestDataDeletion = async () => {
    if (!window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: user.id,
          request_type: 'deletion',
          status: 'pending'
        });

      if (error) throw error;

      alert('Data deletion request submitted. Your data will be deleted within 30 days. You will receive a confirmation email.');
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      alert('Failed to submit data deletion request. Please try again.');
    }
  };

  if (loading) {
    return <div className="gdpr-loading">Loading privacy settings...</div>;
  }

  return (
    <div className="gdpr-consent-manager">
      {showBanner && (
        <div className="gdpr-banner">
          <div className="gdpr-banner-content">
            <div className="gdpr-banner-text">
              <h3>We value your privacy</h3>
              <p>We use cookies and similar technologies to provide, protect and improve our services.
                 By clicking "Accept All", you consent to our use of cookies for analytics and marketing.</p>
            </div>
            <div className="gdpr-banner-actions">
              <button onClick={rejectNonEssential} className="btn-secondary">
                Essential Only
              </button>
              <button onClick={() => setShowBanner(false)} className="btn-outline">
                Customize
              </button>
              <button onClick={acceptAllConsents} className="btn-primary">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="gdpr-settings">
        <h2>Privacy & Data Settings</h2>

        <div className="gdpr-section">
          <h3>Consent Preferences</h3>
          <p>Manage how we use your data to improve your experience.</p>

          <div className="consent-list">
            {consentTypes.map(type => (
              <div key={type.id} className="consent-item">
                <div className="consent-info">
                  <h4>{type.title}</h4>
                  <p>{type.description}</p>
                </div>
                <div className="consent-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={consents[type.id]?.granted || false}
                      onChange={(e) => updateConsent(type.id, e.target.checked)}
                      disabled={type.required}
                    />
                    <span className="slider"></span>
                  </label>
                  {type.required && <span className="required-label">Required</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gdpr-section">
          <h3>Data Retention</h3>
          <p>Choose how long we keep your data after account deletion.</p>
          <div className="retention-setting">
            <label>
              Data Retention Period:
              <select
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
              </select>
            </label>
          </div>
        </div>

        <div className="gdpr-section">
          <h3>Your Rights</h3>
          <p>You have the right to access, export, or delete your personal data.</p>

          <div className="gdpr-actions">
            <button onClick={requestDataExport} className="btn-outline">
              Export My Data
            </button>
            <button onClick={requestDataDeletion} className="btn-danger">
              Delete My Account
            </button>
          </div>
        </div>

        <div className="gdpr-section">
          <h3>Legal Information</h3>
          <div className="legal-links">
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
              Cookie Policy
            </a>
          </div>
        </div>

        <div className="gdpr-footer">
          <p>
            Last updated: {consents.essential?.timestamp ?
              new Date(consents.essential.timestamp).toLocaleDateString() :
              'Never'
            }
          </p>
          <p>
            For questions about our privacy practices, contact us at privacy@blockerapp.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default GDPRConsentManager;
