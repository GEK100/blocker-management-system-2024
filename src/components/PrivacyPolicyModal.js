import React, { useState } from 'react';
import './PrivacyPolicyModal.css';

const PrivacyPolicyModal = ({ isOpen, onClose, onAccept, companyName = "BlockerApp" }) => {
  const [accepted, setAccepted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  if (!isOpen) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  const privacySections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: `
        <p>We collect information you provide directly to us, such as:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, company details</li>
          <li><strong>Project Data:</strong> Construction project details, site drawings, blocker reports</li>
          <li><strong>Usage Data:</strong> How you use our service, features accessed, time spent</li>
          <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
          <li><strong>Communication Data:</strong> Messages, support requests, feedback</li>
        </ul>
        <p>We automatically collect certain information when you use our service through cookies and similar technologies.</p>
      `
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      content: `
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our construction management services</li>
          <li>Process transactions and manage your account</li>
          <li>Send you technical notices, updates, and support messages</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Monitor and analyze trends, usage, and activities</li>
          <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
          <li>Comply with legal obligations and enforce our terms of service</li>
        </ul>
        <p>We will only use your information for marketing communications if you have explicitly consented.</p>
      `
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      content: `
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
        <ul>
          <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
          <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our service</li>
          <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
          <li><strong>Company Team Members:</strong> Within your company organization as necessary for project management</li>
        </ul>
        <p>All third-party service providers are bound by confidentiality agreements and data protection requirements.</p>
      `
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `
        <p>We implement appropriate technical and organizational measures to protect your information:</p>
        <ul>
          <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard protocols</li>
          <li><strong>Access Controls:</strong> Strict access controls and authentication requirements</li>
          <li><strong>Regular Audits:</strong> Regular security assessments and vulnerability testing</li>
          <li><strong>Employee Training:</strong> Staff trained on data protection and privacy requirements</li>
          <li><strong>Incident Response:</strong> Procedures for detecting and responding to security incidents</li>
        </ul>
        <p>While we strive to protect your information, no method of transmission over the Internet is 100% secure.</p>
      `
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: `
        <p>We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
        <ul>
          <li><strong>Account Data:</strong> Retained while your account is active</li>
          <li><strong>Project Data:</strong> Retained for the duration of project lifecycle plus retention period you specify</li>
          <li><strong>Usage Data:</strong> Typically retained for 2 years for analytics and service improvement</li>
          <li><strong>Communication Data:</strong> Retained as needed for customer support and legal compliance</li>
          <li><strong>Audit Logs:</strong> Retained for up to 7 years for compliance and security purposes</li>
        </ul>
        <p>You can customize your data retention preferences in your account settings.</p>
      `
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      content: `
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
          <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete information</li>
          <li><strong>Erasure:</strong> Request deletion of your personal information</li>
          <li><strong>Portability:</strong> Request export of your data in a machine-readable format</li>
          <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Consent Withdrawal:</strong> Withdraw consent for processing where applicable</li>
        </ul>
        <p>To exercise these rights, contact us at privacy@blockerapp.com or use the tools in your account settings.</p>
      `
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      content: `
        <p>We use cookies and similar technologies to improve your experience:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for basic site functionality and security</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how you use our service (with your consent)</li>
          <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
          <li><strong>Marketing Cookies:</strong> Used for advertising and marketing (with your consent)</li>
        </ul>
        <p>You can manage your cookie preferences through your browser settings or our consent management tool.</p>
      `
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      content: `
        <p>Your information may be transferred to and processed in countries other than your own:</p>
        <ul>
          <li>We use cloud service providers with global infrastructure</li>
          <li>All transfers comply with applicable data protection laws</li>
          <li>We implement appropriate safeguards including standard contractual clauses</li>
          <li>Data processing agreements ensure adequate protection levels</li>
        </ul>
      `
    },
    {
      id: 'children-privacy',
      title: 'Children\'s Privacy',
      content: `
        <p>Our service is not intended for use by children under 16 years of age:</p>
        <ul>
          <li>We do not knowingly collect personal information from children under 16</li>
          <li>If we learn we have collected information from a child under 16, we will delete it promptly</li>
          <li>Parents or guardians who believe we may have collected information from their child should contact us</li>
        </ul>
      `
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      content: `
        <p>We may update this privacy policy from time to time:</p>
        <ul>
          <li>Material changes will be notified via email or prominent notice in our service</li>
          <li>Continued use of our service after changes constitutes acceptance</li>
          <li>You can review the full history of changes in your account settings</li>
          <li>We encourage you to review this policy periodically</li>
        </ul>
      `
    }
  ];

  return (
    <div className="privacy-modal-overlay">
      <div className="privacy-modal">
        <div className="privacy-modal-header">
          <h2>Privacy Policy</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="privacy-modal-content">
          <div className="privacy-intro">
            <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
            <p>
              At {companyName}, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our construction blocker management service.
            </p>
            <p>
              By using our service, you agree to the collection and use of information in accordance with this policy.
              Please read this policy carefully and contact us if you have any questions.
            </p>
          </div>

          <div className="privacy-sections">
            {privacySections.map((section) => (
              <div key={section.id} className="privacy-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <h3>{section.title}</h3>
                  <span className={`expand-icon ${expandedSections[section.id] ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>

                {expandedSections[section.id] && (
                  <div
                    className="section-content"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="privacy-contact">
            <h3>Contact Information</h3>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@blockerapp.com</li>
              <li><strong>Address:</strong> [Your Company Address]</li>
              <li><strong>Phone:</strong> [Your Company Phone]</li>
            </ul>
            <p>
              For GDPR-related inquiries, our Data Protection Officer can be reached at dpo@blockerapp.com.
            </p>
          </div>
        </div>

        <div className="privacy-modal-footer">
          <div className="acceptance-checkbox">
            <label>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              I have read and agree to the Privacy Policy
            </label>
          </div>

          <div className="modal-actions">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className={`btn-primary ${!accepted ? 'disabled' : ''}`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;