import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { multitenant } from '../lib/multitenant-api';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import './CompanyOnboarding.css';

const CompanyOnboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [formData, setFormData] = useState({
    // Company Owner Information
    ownerFullName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerConfirmPassword: '',
    ownerPhone: '',

    // Company Information
    companyName: '',
    companySlug: '',
    companyIndustry: 'construction',
    companySize: '1-10',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZipCode: '',
    companyCountry: 'United States',
    companyWebsite: '',
    companyDescription: '',

    // Subscription Plan
    subscriptionPlan: 'free',

    // Legal Agreements
    termsAccepted: false,
    privacyPolicyAccepted: false,
    marketingConsent: false,

    // Initial Project (Optional)
    createInitialProject: false,
    initialProjectName: '',
    initialProjectDescription: '',
    initialProjectAddress: ''
  });

  const [errors, setErrors] = useState({});
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);

  const steps = [
    { id: 1, title: 'Owner Account', description: 'Create your admin account' },
    { id: 2, title: 'Company Details', description: 'Tell us about your company' },
    { id: 3, title: 'Subscription Plan', description: 'Choose your plan' },
    { id: 4, title: 'Initial Setup', description: 'Optional project setup' },
    { id: 5, title: 'Review & Complete', description: 'Confirm your details' }
  ];

  const industries = [
    'construction', 'architecture', 'engineering', 'real_estate',
    'facility_management', 'consulting', 'other'
  ];

  const companySizes = [
    '1-10', '11-50', '51-200', '201-1000', '1000+'
  ];

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '$0',
      period: '30 days',
      features: ['Up to 5 users', '3 projects', '100 blockers', 'Basic support'],
      recommended: false
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$29',
      period: 'per month',
      features: ['Up to 25 users', 'Unlimited projects', '1000 blockers/month', 'Email support'],
      recommended: true
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$99',
      period: 'per month',
      features: ['Unlimited users', 'Unlimited projects', 'Unlimited blockers', 'Priority support', 'Analytics dashboard'],
      recommended: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Contact us',
      period: 'custom pricing',
      features: ['Everything in Professional', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
      recommended: false
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }

    // Auto-generate company slug from company name
    if (field === 'companyName' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      setFormData(prev => ({
        ...prev,
        companySlug: slug
      }));

      if (slug.length >= 3) {
        checkSlugAvailability(slug);
      }
    }

    // Check slug availability when manually changed
    if (field === 'companySlug' && value && value.length >= 3) {
      checkSlugAvailability(value);
    }
  };

  const checkSlugAvailability = async (slug) => {
    if (slugChecking) return;

    setSlugChecking(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single();

      setSlugAvailable(error && error.code === 'PGRST116'); // Not found = available
    } catch (error) {
      setSlugAvailable(true);
    } finally {
      setSlugChecking(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.ownerFullName.trim()) newErrors.ownerFullName = 'Full name is required';
        if (!formData.ownerEmail.trim()) newErrors.ownerEmail = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) newErrors.ownerEmail = 'Invalid email format';
        if (!formData.ownerPassword) newErrors.ownerPassword = 'Password is required';
        else if (formData.ownerPassword.length < 8) newErrors.ownerPassword = 'Password must be at least 8 characters';
        if (formData.ownerPassword !== formData.ownerConfirmPassword) newErrors.ownerConfirmPassword = 'Passwords do not match';
        break;

      case 2:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.companySlug.trim()) newErrors.companySlug = 'Company slug is required';
        else if (formData.companySlug.length < 3) newErrors.companySlug = 'Slug must be at least 3 characters';
        else if (!/^[a-z0-9-]+$/.test(formData.companySlug)) newErrors.companySlug = 'Slug can only contain lowercase letters, numbers, and hyphens';
        else if (slugAvailable === false) newErrors.companySlug = 'This slug is already taken';
        if (!formData.companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
        if (!formData.companyCity.trim()) newErrors.companyCity = 'City is required';
        break;

      case 5:
        if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms of service';
        if (!formData.privacyPolicyAccepted) newErrors.privacyPolicyAccepted = 'You must accept the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      // Register the company and owner
      const result = await multitenant.registerCompany(
        {
          name: formData.ownerFullName,
          email: formData.ownerEmail,
          password: formData.ownerPassword,
          phone: formData.ownerPhone
        },
        {
          name: formData.companyName,
          slug: formData.companySlug,
          industry: formData.companyIndustry,
          size: formData.companySize,
          address: formData.companyAddress,
          city: formData.companyCity,
          state: formData.companyState,
          zip_code: formData.companyZipCode,
          country: formData.companyCountry,
          website: formData.companyWebsite,
          description: formData.companyDescription,
          subscription_plan: formData.subscriptionPlan,
          marketing_consent: formData.marketingConsent
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      // Create initial project if requested
      if (formData.createInitialProject && formData.initialProjectName) {
        await multitenant.projectAPI.create({
          company_id: result.company.id,
          name: formData.initialProjectName,
          description: formData.initialProjectDescription,
          address: formData.initialProjectAddress,
          status: 'planning'
        });
      }

      // Log successful onboarding
      await supabase
        .from('audit_logs')
        .insert({
          user_id: result.user.id,
          action: 'company_onboarded',
          resource_type: 'company',
          resource_id: result.company.id,
          details: {
            company_name: formData.companyName,
            subscription_plan: formData.subscriptionPlan,
            initial_project: formData.createInitialProject
          }
        });

      // Show success and redirect
      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      setErrors({ submit: error.message || 'Failed to create company. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Create Your Admin Account</h2>
            <p>As the company owner, you'll have full access to manage your organization.</p>

            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.ownerFullName}
                  onChange={(e) => handleInputChange('ownerFullName', e.target.value)}
                  placeholder="John Doe"
                  className={errors.ownerFullName ? 'error' : ''}
                />
                {errors.ownerFullName && <span className="error-text">{errors.ownerFullName}</span>}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                  placeholder="john@company.com"
                  className={errors.ownerEmail ? 'error' : ''}
                />
                {errors.ownerEmail && <span className="error-text">{errors.ownerEmail}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.ownerPassword}
                  onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                  placeholder="At least 8 characters"
                  className={errors.ownerPassword ? 'error' : ''}
                />
                {errors.ownerPassword && <span className="error-text">{errors.ownerPassword}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={formData.ownerConfirmPassword}
                  onChange={(e) => handleInputChange('ownerConfirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={errors.ownerConfirmPassword ? 'error' : ''}
                />
                {errors.ownerConfirmPassword && <span className="error-text">{errors.ownerConfirmPassword}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Company Information</h2>
            <p>Tell us about your company to set up your workspace.</p>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Acme Construction Ltd"
                  className={errors.companyName ? 'error' : ''}
                />
                {errors.companyName && <span className="error-text">{errors.companyName}</span>}
              </div>

              <div className="form-group full-width">
                <label>Company URL Slug *</label>
                <div className="slug-input">
                  <span className="slug-prefix">blockerapp.com/</span>
                  <input
                    type="text"
                    value={formData.companySlug}
                    onChange={(e) => handleInputChange('companySlug', e.target.value)}
                    placeholder="acme-construction"
                    className={errors.companySlug ? 'error' : ''}
                  />
                  {slugChecking && <span className="slug-status checking">Checking...</span>}
                  {!slugChecking && slugAvailable === true && <span className="slug-status available">✓ Available</span>}
                  {!slugChecking && slugAvailable === false && <span className="slug-status taken">✗ Taken</span>}
                </div>
                {errors.companySlug && <span className="error-text">{errors.companySlug}</span>}
              </div>

              <div className="form-group">
                <label>Industry</label>
                <select
                  value={formData.companyIndustry}
                  onChange={(e) => handleInputChange('companyIndustry', e.target.value)}
                >
                  <option value="construction">Construction</option>
                  <option value="architecture">Architecture</option>
                  <option value="engineering">Engineering</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="facility_management">Facility Management</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Company Size</label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  placeholder="123 Main Street"
                  className={errors.companyAddress ? 'error' : ''}
                />
                {errors.companyAddress && <span className="error-text">{errors.companyAddress}</span>}
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.companyCity}
                  onChange={(e) => handleInputChange('companyCity', e.target.value)}
                  placeholder="New York"
                  className={errors.companyCity ? 'error' : ''}
                />
                {errors.companyCity && <span className="error-text">{errors.companyCity}</span>}
              </div>

              <div className="form-group">
                <label>State/Province</label>
                <input
                  type="text"
                  value={formData.companyState}
                  onChange={(e) => handleInputChange('companyState', e.target.value)}
                  placeholder="NY"
                />
              </div>

              <div className="form-group">
                <label>ZIP/Postal Code</label>
                <input
                  type="text"
                  value={formData.companyZipCode}
                  onChange={(e) => handleInputChange('companyZipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <select
                  value={formData.companyCountry}
                  onChange={(e) => handleInputChange('companyCountry', e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>

              <div className="form-group full-width">
                <label>Company Description</label>
                <textarea
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  placeholder="Brief description of your company..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Choose Your Plan</h2>
            <p>Select the plan that best fits your needs. You can change this later.</p>

            <div className="plans-grid">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${formData.subscriptionPlan === plan.id ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
                  onClick={() => handleInputChange('subscriptionPlan', plan.id)}
                >
                  {plan.recommended && <div className="recommended-badge">Recommended</div>}
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price">{plan.price}</span>
                      <span className="period">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Initial Setup</h2>
            <p>Optionally create your first project to get started quickly.</p>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.createInitialProject}
                  onChange={(e) => handleInputChange('createInitialProject', e.target.checked)}
                />
                Create an initial project
              </label>
            </div>

            {formData.createInitialProject && (
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={formData.initialProjectName}
                    onChange={(e) => handleInputChange('initialProjectName', e.target.value)}
                    placeholder="Downtown Office Complex"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Project Address</label>
                  <input
                    type="text"
                    value={formData.initialProjectAddress}
                    onChange={(e) => handleInputChange('initialProjectAddress', e.target.value)}
                    placeholder="456 Business Ave, City, State"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Project Description</label>
                  <textarea
                    value={formData.initialProjectDescription}
                    onChange={(e) => handleInputChange('initialProjectDescription', e.target.value)}
                    placeholder="Brief description of the project..."
                    rows="3"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Review & Complete</h2>
            <p>Please review your information and accept our terms to complete registration.</p>

            <div className="review-sections">
              <div className="review-section">
                <h3>Account Information</h3>
                <div className="review-item">
                  <span>Owner:</span>
                  <span>{formData.ownerFullName} ({formData.ownerEmail})</span>
                </div>
              </div>

              <div className="review-section">
                <h3>Company Details</h3>
                <div className="review-item">
                  <span>Company:</span>
                  <span>{formData.companyName}</span>
                </div>
                <div className="review-item">
                  <span>URL:</span>
                  <span>blockerapp.com/{formData.companySlug}</span>
                </div>
                <div className="review-item">
                  <span>Industry:</span>
                  <span>{formData.companyIndustry}</span>
                </div>
                <div className="review-item">
                  <span>Size:</span>
                  <span>{formData.companySize} employees</span>
                </div>
              </div>

              <div className="review-section">
                <h3>Subscription</h3>
                <div className="review-item">
                  <span>Plan:</span>
                  <span>{subscriptionPlans.find(p => p.id === formData.subscriptionPlan)?.name}</span>
                </div>
              </div>

              {formData.createInitialProject && (
                <div className="review-section">
                  <h3>Initial Project</h3>
                  <div className="review-item">
                    <span>Project:</span>
                    <span>{formData.initialProjectName}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="legal-agreements">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                    className={errors.termsAccepted ? 'error' : ''}
                  />
                  I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> *
                </label>
                {errors.termsAccepted && <span className="error-text">{errors.termsAccepted}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.privacyPolicyAccepted}
                    onChange={(e) => handleInputChange('privacyPolicyAccepted', e.target.checked)}
                    className={errors.privacyPolicyAccepted ? 'error' : ''}
                  />
                  I accept the <button type="button" onClick={() => setShowPrivacyPolicy(true)} className="link-button">Privacy Policy</button> *
                </label>
                {errors.privacyPolicyAccepted && <span className="error-text">{errors.privacyPolicyAccepted}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
                  />
                  I'd like to receive product updates and marketing communications
                </label>
              </div>
            </div>

            {errors.submit && <div className="error-banner">{errors.submit}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="company-onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to BlockerApp</h1>
          <p>Let's set up your company workspace</p>
        </div>

        <div className="progress-bar">
          {steps.map((step, index) => (
            <div key={step.id} className="progress-step-container">
              <div className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}>
                <div className="step-number">{step.id}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-line ${currentStep > step.id ? 'active' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="onboarding-form">
          {renderStepContent()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button onClick={prevStep} className="btn-secondary" disabled={loading}>
                Previous
              </button>
            )}

            {currentStep < steps.length && (
              <button onClick={nextStep} className="btn-primary" disabled={loading}>
                Next
              </button>
            )}

            {currentStep === steps.length && (
              <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                {loading ? 'Creating Company...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPrivacyPolicy && (
        <PrivacyPolicyModal
          isOpen={showPrivacyPolicy}
          onClose={() => setShowPrivacyPolicy(false)}
          onAccept={() => {
            handleInputChange('privacyPolicyAccepted', true);
            setShowPrivacyPolicy(false);
          }}
          companyName="BlockerApp"
        />
      )}
    </div>
  );
};

export default CompanyOnboarding;
