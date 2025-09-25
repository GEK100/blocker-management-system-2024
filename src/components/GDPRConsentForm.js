import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { brandConfig } from '../design-system/brand';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const GDPRConsentForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consents, setConsents] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    personalization: false
  });
  const [loading, setLoading] = useState(false);

  const handleConsentChange = (type) => {
    if (type === 'essential') return; // Cannot be changed

    setConsents(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would typically save consent to your backend
      // For now, we'll just navigate to the dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const consentTypes = [
    {
      id: 'essential',
      title: 'Essential Services',
      description: 'Required for basic functionality, user authentication, and security.',
      icon: ShieldCheckIcon,
      required: true,
      details: 'These cookies and services are necessary for the website to function properly and cannot be disabled.'
    },
    {
      id: 'analytics',
      title: 'Analytics & Performance',
      description: 'Help us understand how you use our platform to improve your experience.',
      icon: ChartBarIcon,
      required: false,
      details: 'We use analytics to track page views, user interactions, and performance metrics to improve our services.'
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive updates about new features, industry insights, and special offers.',
      icon: DocumentTextIcon,
      required: false,
      details: 'We may send you emails about product updates, construction industry news, and promotional content.'
    },
    {
      id: 'personalization',
      title: 'Personalization',
      description: 'Customize your dashboard and experience based on your preferences.',
      icon: UserGroupIcon,
      required: false,
      details: 'We use this data to personalize your dashboard, recommend relevant content, and tailor your experience.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-construction-100 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-10 w-10 text-construction-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Privacy & Data Consent
          </h2>
          <p className="mt-2 text-slate-600 max-w-lg mx-auto">
            We respect your privacy. Please choose which data processing activities you consent to.
            You can change these preferences anytime in your account settings.
          </p>
        </div>

        {/* Welcome Message */}
        <Card className="p-6 bg-construction-50 border-construction-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-construction-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-construction-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-construction-900">
                Welcome to {brandConfig.name}!
              </h3>
              <p className="text-construction-700 mt-1">
                {user?.email ? `Hi ${user.email}! ` : ''}
                Before you start using our platform, we need your consent for certain data processing activities
                to ensure we comply with GDPR and other privacy regulations.
              </p>
            </div>
          </div>
        </Card>

        {/* Consent Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {consentTypes.map((consentType) => {
                const Icon = consentType.icon;
                return (
                  <div key={consentType.id} className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          id={consentType.id}
                          checked={consents[consentType.id]}
                          onChange={() => handleConsentChange(consentType.id)}
                          disabled={consentType.required}
                          className="h-5 w-5 text-construction-600 focus:ring-construction-500 border-slate-300 rounded disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="h-6 w-6 text-construction-600" />
                          <div>
                            <label
                              htmlFor={consentType.id}
                              className="text-lg font-semibold text-slate-900 cursor-pointer"
                            >
                              {consentType.title}
                              {consentType.required && (
                                <span className="ml-2 text-xs bg-construction-100 text-construction-800 px-2 py-1 rounded-full">
                                  Required
                                </span>
                              )}
                            </label>
                          </div>
                        </div>
                        <p className="text-slate-600 mb-2">
                          {consentType.description}
                        </p>
                        <details className="text-sm text-slate-500">
                          <summary className="cursor-pointer hover:text-slate-700">
                            View details
                          </summary>
                          <p className="mt-2 pl-4 border-l-2 border-slate-200">
                            {consentType.details}
                          </p>
                        </details>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Your Rights
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      You have the right to access, rectify, erase, restrict processing, or port your data.
                      You can also withdraw consent at any time. Contact us at privacy@{brandConfig.name.toLowerCase()}.com
                      for any privacy-related requests.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="flex-1"
                  disabled={loading}
                >
                  I'll decide later
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving Preferences...' : 'Save Preferences & Continue'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-x-6 text-sm text-slate-600">
          <a href="#" className="hover:text-slate-900">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900">Terms of Service</a>
          <a href="#" className="hover:text-slate-900">Cookie Policy</a>
        </div>
      </div>
    </div>
  );
};

export default GDPRConsentForm;