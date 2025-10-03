import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import companyLifecycleAPI from '../lib/companyLifecycleAPI';

const CompanySetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get('token');

  const [step, setStep] = useState('validate'); // validate, credentials, password, success
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyData, setCompanyData] = useState(null);

  const [credentialsForm, setCredentialsForm] = useState({
    email: '',
    tempPassword: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    adminName: '',
    phone: ''
  });

  const [showTempPassword, setShowTempPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  useEffect(() => {
    if (!resetToken) {
      setError('No setup token provided');
      setLoading(false);
      return;
    }

    validateToken();
  }, [resetToken]);

  useEffect(() => {
    if (passwordForm.newPassword) {
      const strength = calculatePasswordStrength(passwordForm.newPassword);
      setPasswordStrength(strength);
    }
  }, [passwordForm.newPassword]);

  const validateToken = async () => {
    try {
      setLoading(true);
      // For token validation, we'll try with dummy credentials first
      // In real implementation, this might be a separate token validation endpoint
      setStep('credentials');
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Invalid or expired setup token');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await companyLifecycleAPI.verifyTempCredentials(
        credentialsForm.email,
        credentialsForm.tempPassword,
        resetToken
      );

      if (!result.valid) {
        throw new Error('Invalid email or temporary password');
      }

      setCompanyData(result);
      setStep('password');

    } catch (err) {
      console.error('Error verifying credentials:', err);
      setError(err.message || 'Failed to verify credentials');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!passwordStrength.isStrong) {
        throw new Error('Password does not meet security requirements');
      }

      const result = await companyLifecycleAPI.completeCompanySetup(
        credentialsForm.email,
        resetToken,
        passwordForm.newPassword,
        passwordForm.adminName,
        passwordForm.phone
      );

      if (result.setupComplete) {
        setStep('success');
        // Redirect to login after a brief delay
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Company setup completed successfully! Please log in with your new credentials.',
              email: credentialsForm.email
            }
          });
        }, 3000);
      }

    } catch (err) {
      console.error('Error completing setup:', err);
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    const checks = [
      { test: password.length >= 8, message: 'At least 8 characters' },
      { test: /[a-z]/.test(password), message: 'Contains lowercase letter' },
      { test: /[A-Z]/.test(password), message: 'Contains uppercase letter' },
      { test: /\d/.test(password), message: 'Contains number' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), message: 'Contains special character' }
    ];

    const passed = checks.filter(check => check.test).length;
    const failed = checks.filter(check => !check.test).map(check => check.message);

    return {
      score: passed,
      feedback: failed,
      isStrong: passed >= 4
    };
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (loading && step === 'validate') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating setup token...</p>
        </div>
      </div>
    );
  }

  if (error && step === 'validate') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Token Invalid</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your company has been successfully set up. You can now log in with your new credentials.
            </p>
            <div className="animate-pulse text-blue-600">
              Redirecting to login...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Complete Company Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'credentials'
              ? 'Enter your temporary credentials to continue'
              : 'Set up your permanent password and profile'
            }
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <LockClosedIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Temporary Credentials Required</p>
                    <p>Use the email and temporary password provided in your setup email.</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={credentialsForm.email}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="tempPassword" className="block text-sm font-medium text-gray-700">
                  Temporary Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="tempPassword"
                    name="tempPassword"
                    type={showTempPassword ? 'text' : 'password'}
                    required
                    value={credentialsForm.tempPassword}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, tempPassword: e.target.value })}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter temporary password from email"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                  >
                    {showTempPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Verify Credentials'
                )}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <ShieldCheckIcon className="h-5 w-5 text-green-400 mr-2" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Credentials Verified</p>
                    <p>Now set up your permanent password and complete your profile.</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="adminName"
                  name="adminName"
                  type="text"
                  required
                  value={passwordForm.adminName}
                  onChange={(e) => setPasswordForm({ ...passwordForm, adminName: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={passwordForm.phone}
                  onChange={(e) => setPasswordForm({ ...passwordForm, phone: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score >= 4 ? 'text-green-600' :
                        passwordStrength.score >= 3 ? 'text-blue-600' :
                        passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.score >= 4 ? 'Strong' :
                         passwordStrength.score >= 3 ? 'Good' :
                         passwordStrength.score >= 2 ? 'Fair' : 'Weak'}
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>

                    {passwordStrength.feedback.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Requirements:</p>
                        <ul className="text-xs text-red-600 space-y-1">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index}>• {feedback}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {passwordForm.confirmPassword && (
                  <div className="mt-1">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <p className="text-xs text-green-600">✓ Passwords match</p>
                    ) : (
                      <p className="text-xs text-red-600">✗ Passwords do not match</p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passwordStrength.isStrong || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySetup;