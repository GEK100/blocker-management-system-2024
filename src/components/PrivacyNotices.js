import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './PrivacyNotices.css';

const PrivacyNotices = ({ user, onClose }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNotice, setActiveNotice] = useState(null);

  const privacyNoticeTypes = {
    'data_collection': {
      title: 'Data Collection Notice',
      icon: '🔍',
      description: 'Information about what personal data we collect and how.',
      content: `
        <h3>What Personal Data We Collect</h3>
        <p>We collect the following types of personal information:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, phone number, company details</li>
          <li><strong>Project Data:</strong> Construction project details, site drawings, blocker reports you create</li>
          <li><strong>Usage Data:</strong> How you interact with our service, features you use, time spent</li>
          <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers</li>
          <li><strong>Communication Data:</strong> Messages you send, support requests, feedback</li>
          <li><strong>Location Data:</strong> GPS coordinates when you create site reports (with your permission)</li>
        </ul>

        <h3>How We Collect This Data</h3>
        <p>We collect personal data through:</p>
        <ul>
          <li>Information you provide directly when registering or using our service</li>
          <li>Automated collection through cookies and similar technologies</li>
          <li>From third parties like your company administrator who invites you</li>
          <li>When you upload files, create reports, or interact with our platform</li>
        </ul>

        <h3>Legal Basis for Processing</h3>
        <p>We process your personal data based on:</p>
        <ul>
          <li><strong>Contract:</strong> To provide the services you've signed up for</li>
          <li><strong>Consent:</strong> For marketing communications and optional features</li>
          <li><strong>Legitimate Interest:</strong> To improve our service and prevent fraud</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
        </ul>
      `
    },
    'data_processing': {
      title: 'Data Processing Notice',
      icon: '⚙️',
      description: 'How we use and process your personal data.',
      content: `
        <h3>How We Use Your Personal Data</h3>
        <p>We process your personal information for the following purposes:</p>

        <h4>Service Delivery</h4>
        <ul>
          <li>Providing access to our construction management platform</li>
          <li>Creating and managing your user account</li>
          <li>Processing and storing your project data and reports</li>
          <li>Enabling collaboration with your team members</li>
        </ul>

        <h4>Communication</h4>
        <ul>
          <li>Sending you service-related notifications and updates</li>
          <li>Responding to your support requests and inquiries</li>
          <li>Providing customer service and technical support</li>
          <li>Sending important security and account notifications</li>
        </ul>

        <h4>Service Improvement</h4>
        <ul>
          <li>Analyzing usage patterns to improve our platform</li>
          <li>Developing new features and functionality</li>
          <li>Conducting research and analytics</li>
          <li>Monitoring service performance and reliability</li>
        </ul>

        <h4>Security and Compliance</h4>
        <ul>
          <li>Detecting and preventing fraud and abuse</li>
          <li>Monitoring for security threats</li>
          <li>Complying with legal obligations</li>
          <li>Enforcing our terms of service</li>
        </ul>

        <h4>Marketing (with your consent)</h4>
        <ul>
          <li>Sending promotional emails about new features</li>
          <li>Providing product recommendations</li>
          <li>Inviting you to participate in surveys or beta programs</li>
          <li>Sharing relevant industry news and updates</li>
        </ul>
      `
    },
    'data_sharing': {
      title: 'Data Sharing Notice',
      icon: '🤝',
      description: 'When and how we share your data with third parties.',
      content: `
        <h3>When We Share Your Personal Data</h3>
        <p>We may share your personal information in the following circumstances:</p>

        <h4>Within Your Organization</h4>
        <ul>
          <li>With other members of your company who have appropriate access levels</li>
          <li>With project team members for collaboration purposes</li>
          <li>With company administrators for account management</li>
        </ul>

        <h4>Service Providers</h4>
        <p>We work with trusted third-party service providers who help us operate our business:</p>
        <ul>
          <li><strong>Cloud Infrastructure:</strong> Supabase, AWS for data hosting and processing</li>
          <li><strong>Email Services:</strong> For sending notifications and communications</li>
          <li><strong>Analytics:</strong> To understand how our service is used (only with your consent)</li>
          <li><strong>Payment Processing:</strong> To handle subscription payments securely</li>
          <li><strong>Customer Support:</strong> To provide help and technical assistance</li>
        </ul>

        <h4>Legal Requirements</h4>
        <p>We may disclose your information when required by law or to:</p>
        <ul>
          <li>Comply with legal processes, court orders, or government requests</li>
          <li>Protect our rights, property, or safety</li>
          <li>Protect the rights, property, or safety of our users</li>
          <li>Investigate potential violations of our terms of service</li>
        </ul>

        <h4>Business Transfers</h4>
        <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.</p>

        <h3>Data Protection Measures</h3>
        <p>All third parties we work with are required to:</p>
        <ul>
          <li>Maintain appropriate security measures</li>
          <li>Process data only as instructed by us</li>
          <li>Comply with applicable data protection laws</li>
          <li>Delete or return data when no longer needed</li>
        </ul>
      `
    },
    'cookies': {
      title: 'Cookie Notice',
      icon: '🍪',
      description: 'Information about cookies and tracking technologies we use.',
      content: `
        <h3>What Are Cookies?</h3>
        <p>Cookies are small text files that are placed on your device when you visit our website or use our application. They help us provide you with a better experience and allow certain features to work properly.</p>

        <h3>Types of Cookies We Use</h3>

        <h4>Essential Cookies (Always Active)</h4>
        <p>These cookies are necessary for our service to function properly:</p>
        <ul>
          <li><strong>Authentication:</strong> Keep you logged in to your account</li>
          <li><strong>Security:</strong> Prevent fraud and protect against attacks</li>
          <li><strong>Functionality:</strong> Remember your preferences and settings</li>
          <li><strong>Load Balancing:</strong> Ensure optimal service performance</li>
        </ul>

        <h4>Analytics Cookies (With Your Consent)</h4>
        <p>Help us understand how our service is used:</p>
        <ul>
          <li>Track which features are most popular</li>
          <li>Identify areas for improvement</li>
          <li>Monitor service performance</li>
          <li>Understand user behavior patterns</li>
        </ul>

        <h4>Functional Cookies (With Your Consent)</h4>
        <p>Enhance your experience with our service:</p>
        <ul>
          <li>Remember your language and region preferences</li>
          <li>Save your dashboard layout and settings</li>
          <li>Pre-fill forms with previously entered information</li>
          <li>Remember your notification preferences</li>
        </ul>

        <h4>Marketing Cookies (With Your Consent)</h4>
        <p>Used to deliver relevant advertising and marketing content:</p>
        <ul>
          <li>Track which marketing campaigns are effective</li>
          <li>Prevent showing you the same ads repeatedly</li>
          <li>Personalize content based on your interests</li>
          <li>Measure the effectiveness of our marketing efforts</li>
        </ul>

        <h3>Managing Cookie Preferences</h3>
        <p>You can control cookie settings through:</p>
        <ul>
          <li>Your browser settings (blocks all cookies)</li>
          <li>Our cookie consent banner (granular control)</li>
          <li>Your account privacy settings</li>
        </ul>

        <p><strong>Note:</strong> Disabling essential cookies may prevent certain features from working properly.</p>

        <h3>Third-Party Cookies</h3>
        <p>Some cookies are set by third-party services we use:</p>
        <ul>
          <li>Google Analytics (if analytics consent is given)</li>
          <li>Customer support chat widgets</li>
          <li>Payment processing services</li>
        </ul>

        <p>These third parties have their own privacy policies and cookie practices.</p>
      `
    },
    'retention': {
      title: 'Data Retention Notice',
      icon: '📅',
      description: 'How long we keep your personal data and why.',
      content: `
        <h3>Data Retention Periods</h3>
        <p>We keep your personal data for different periods depending on the type of information and legal requirements:</p>

        <h4>Account Data</h4>
        <ul>
          <li><strong>Active accounts:</strong> Retained while your account is active</li>
          <li><strong>Deleted accounts:</strong> Personal data deleted within 30-365 days (your choice)</li>
          <li><strong>Legal hold:</strong> May be retained longer if required by law</li>
        </ul>

        <h4>Project and Business Data</h4>
        <ul>
          <li><strong>Project records:</strong> Retained for the project lifecycle plus your chosen retention period</li>
          <li><strong>Construction reports:</strong> May be retained longer for regulatory compliance</li>
          <li><strong>Financial records:</strong> 7 years for tax and accounting purposes</li>
          <li><strong>Contract documents:</strong> Retained per legal requirements</li>
        </ul>

        <h4>Communication Data</h4>
        <ul>
          <li><strong>Support tickets:</strong> 3 years for service improvement</li>
          <li><strong>Email communications:</strong> 2 years unless you opt out</li>
          <li><strong>Chat logs:</strong> 1 year for quality assurance</li>
        </ul>

        <h4>Technical Data</h4>
        <ul>
          <li><strong>Usage analytics:</strong> 2 years in aggregated form</li>
          <li><strong>Security logs:</strong> 1 year for security monitoring</li>
          <li><strong>Error logs:</strong> 90 days for troubleshooting</li>
          <li><strong>Backup data:</strong> 30 days for disaster recovery</li>
        </ul>

        <h3>Automatic Deletion</h3>
        <p>We have automated systems that:</p>
        <ul>
          <li>Delete expired data according to retention schedules</li>
          <li>Remove personal identifiers from analytics data</li>
          <li>Purge temporary files and caches regularly</li>
          <li>Clean up test and development environments</li>
        </ul>

        <h3>Your Control Over Data Retention</h3>
        <p>You can:</p>
        <ul>
          <li>Choose your data retention period (30-365 days)</li>
          <li>Request immediate deletion of specific data</li>
          <li>Download your data before deletion</li>
          <li>Update retention preferences in your account settings</li>
        </ul>

        <h3>Legal and Regulatory Requirements</h3>
        <p>Some data may be retained longer to comply with:</p>
        <ul>
          <li>Construction industry regulations</li>
          <li>Tax and accounting laws</li>
          <li>Employment and labor laws</li>
          <li>Data protection and privacy laws</li>
        </ul>

        <h3>Secure Deletion</h3>
        <p>When we delete your data, we:</p>
        <ul>
          <li>Use secure deletion methods that make recovery impossible</li>
          <li>Remove data from all systems including backups</li>
          <li>Provide confirmation when deletion is complete</li>
          <li>Maintain audit logs of deletion activities</li>
        </ul>
      `
    },
    'rights': {
      title: 'Your Privacy Rights',
      icon: '⚖️',
      description: 'Your rights regarding your personal data under privacy laws.',
      content: `
        <h3>Your Data Protection Rights</h3>
        <p>Under GDPR and other privacy laws, you have the following rights regarding your personal data:</p>

        <h4>Right to Access (Article 15)</h4>
        <p>You have the right to request:</p>
        <ul>
          <li>Confirmation that we are processing your personal data</li>
          <li>A copy of your personal data in our systems</li>
          <li>Information about how we use your data</li>
          <li>Details about data sharing with third parties</li>
          <li>Information about data retention periods</li>
        </ul>

        <h4>Right to Rectification (Article 16)</h4>
        <p>You can:</p>
        <ul>
          <li>Correct inaccurate personal data</li>
          <li>Complete incomplete personal data</li>
          <li>Update outdated information</li>
          <li>Request verification of data accuracy</li>
        </ul>

        <h4>Right to Erasure (Article 17)</h4>
        <p>You can request deletion of your data when:</p>
        <ul>
          <li>The data is no longer necessary for the original purpose</li>
          <li>You withdraw consent and there's no other legal basis</li>
          <li>You object to processing and there are no overriding grounds</li>
          <li>The data has been unlawfully processed</li>
        </ul>

        <h4>Right to Restrict Processing (Article 18)</h4>
        <p>You can limit how we process your data when:</p>
        <ul>
          <li>You contest the accuracy of the data</li>
          <li>Processing is unlawful but you don't want deletion</li>
          <li>We no longer need the data but you need it for legal claims</li>
          <li>You've objected to processing pending verification</li>
        </ul>

        <h4>Right to Data Portability (Article 20)</h4>
        <p>You can:</p>
        <ul>
          <li>Receive your data in a structured, machine-readable format</li>
          <li>Transfer your data to another service provider</li>
          <li>Request direct transfer when technically feasible</li>
        </ul>

        <h4>Right to Object (Article 21)</h4>
        <p>You can object to processing based on:</p>
        <ul>
          <li>Legitimate interests (unless we have compelling grounds)</li>
          <li>Direct marketing (we will stop immediately)</li>
          <li>Scientific/historical research or statistics</li>
        </ul>

        <h4>Rights Related to Automated Decision Making</h4>
        <p>You have the right not to be subject to decisions based solely on automated processing, including profiling, that significantly affect you.</p>

        <h3>How to Exercise Your Rights</h3>
        <p>You can exercise these rights by:</p>
        <ul>
          <li>Using the privacy controls in your account settings</li>
          <li>Contacting our Data Protection Officer at dpo@blockerapp.com</li>
          <li>Submitting a request through our support system</li>
          <li>Writing to us at our registered address</li>
        </ul>

        <h3>Response Times</h3>
        <ul>
          <li>We will acknowledge your request within 72 hours</li>
          <li>We will fulfill most requests within 1 month</li>
          <li>Complex requests may take up to 3 months</li>
          <li>We will inform you of any delays and reasons</li>
        </ul>

        <h3>Verification Process</h3>
        <p>To protect your privacy, we may need to verify your identity before processing requests. This may involve:</p>
        <ul>
          <li>Confirming your email address</li>
          <li>Asking for additional identification</li>
          <li>Using multi-factor authentication</li>
        </ul>

        <h3>Right to Lodge a Complaint</h3>
        <p>If you're not satisfied with how we handle your request, you can:</p>
        <ul>
          <li>Contact our Data Protection Officer</li>
          <li>File a complaint with your local data protection authority</li>
          <li>Seek legal remedies through the courts</li>
        </ul>
      `
    }
  };

  useEffect(() => {
    loadNotices();
  }, [user]);

  const loadNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_notices')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`) // User-specific or global notices
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add default notices that should always be available
      const defaultNotices = Object.keys(privacyNoticeTypes).map(type => ({
        id: `default_${type}`,
        type: type,
        title: privacyNoticeTypes[type].title,
        is_active: true,
        created_at: new Date().toISOString(),
        is_default: true
      }));

      setNotices([...defaultNotices, ...(data || [])]);
    } catch (error) {
      console.error('Error loading privacy notices:', error);
      // If there's an error, show default notices
      const defaultNotices = Object.keys(privacyNoticeTypes).map(type => ({
        id: `default_${type}`,
        type: type,
        title: privacyNoticeTypes[type].title,
        is_active: true,
        created_at: new Date().toISOString(),
        is_default: true
      }));
      setNotices(defaultNotices);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (noticeId) => {
    try {
      // Only mark custom notices as read, not default ones
      if (!noticeId.startsWith('default_')) {
        await supabase
          .from('privacy_notice_reads')
          .upsert({
            notice_id: noticeId,
            user_id: user.id,
            read_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error marking notice as read:', error);
    }
  };

  const handleNoticeClick = (notice) => {
    setActiveNotice(notice);
    markAsRead(notice.id);
  };

  if (loading) {
    return (
      <div className="privacy-notices loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading privacy notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-notices">
      <div className="notices-header">
        <h2>Privacy Notices</h2>
        <p>Important information about how we handle your personal data</p>
        {onClose && (
          <button onClick={onClose} className="close-btn">×</button>
        )}
      </div>

      <div className="notices-content">
        {!activeNotice ? (
          <div className="notices-list">
            {notices
              .filter(notice => notice.is_active)
              .map((notice) => {
                const noticeType = privacyNoticeTypes[notice.type];
                if (!noticeType) return null;

                return (
                  <div
                    key={notice.id}
                    className="notice-card"
                    onClick={() => handleNoticeClick(notice)}
                  >
                    <div className="notice-icon">
                      {noticeType.icon}
                    </div>
                    <div className="notice-content">
                      <h3>{noticeType.title}</h3>
                      <p>{noticeType.description}</p>
                      <div className="notice-meta">
                        <span className="notice-date">
                          {new Date(notice.created_at).toLocaleDateString()}
                        </span>
                        {notice.is_default && (
                          <span className="notice-badge">System Notice</span>
                        )}
                      </div>
                    </div>
                    <div className="notice-arrow">→</div>
                  </div>
                );
              })}

            <div className="contact-section">
              <h3>Questions About Your Privacy?</h3>
              <p>If you have any questions about our privacy practices or these notices, please contact us:</p>
              <div className="contact-options">
                <div className="contact-item">
                  <strong>Email:</strong> privacy@blockerapp.com
                </div>
                <div className="contact-item">
                  <strong>Data Protection Officer:</strong> dpo@blockerapp.com
                </div>
                <div className="contact-item">
                  <strong>Address:</strong> [Your Company Address]
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="notice-detail">
            <div className="detail-header">
              <button
                onClick={() => setActiveNotice(null)}
                className="back-btn"
              >
                ← Back to Notices
              </button>
              <h2>{privacyNoticeTypes[activeNotice.type]?.title}</h2>
            </div>

            <div className="detail-content">
              <div
                className="notice-content"
                dangerouslySetInnerHTML={{
                  __html: privacyNoticeTypes[activeNotice.type]?.content || ''
                }}
              />

              <div className="detail-footer">
                <div className="notice-info">
                  <p><strong>Last updated:</strong> {new Date(activeNotice.created_at).toLocaleDateString()}</p>
                  <p><strong>Effective date:</strong> {new Date(activeNotice.created_at).toLocaleDateString()}</p>
                </div>

                <div className="detail-actions">
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary"
                  >
                    Print Notice
                  </button>
                  <button
                    onClick={() => setActiveNotice(null)}
                    className="btn-primary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyNotices;