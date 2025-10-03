import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartAuth } from '../hooks/useSmartAuth';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import emailService from '../lib/emailService';

const MandatoryPasswordChange = ({ userProfile: propUserProfile, onPasswordChanged }) => {
  const { user, userProfile: authUserProfile } = useSmartAuth();
  const userProfile = propUserProfile || authUserProfile;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  useEffect(() => {
    if (formData.newPassword) {
      const strength = calculatePasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
    }
  }, [formData.newPassword]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (!passwordStrength.isStrong) {
        throw new Error('Password does not meet security requirements');
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) throw updateError;

      // Update user profile to clear mandatory password change flag
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          password_must_change: false,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // Log password change in history
      await supabase
        .from('password_history')
        .insert({
          user_id: userProfile.id,
          password_hash: 'CHANGED_MANDATORY',
          changed_reason: 'mandatory',
          ip_address: null, // Would be captured from request
          user_agent: navigator.userAgent
        });

      // Send confirmation email
      await emailService.sendPasswordChangeNotification({
        to: userProfile.email,
        userName: userProfile.name,
        companyName: userProfile.company?.name || 'Your Company'
      });

      setSuccess(true);

      // Call callback to update parent component
      if (onPasswordChanged) {
        onPasswordChanged();
      }

      // Redirect after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const getPasswordStrengthText = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Updated Successfully</h2>
            <p className="text-gray-600 mb-6">
              Your password has been changed and you can now access the application.
            </p>
            <div className="animate-pulse text-blue-600">
              Redirecting to dashboard...
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Password Change Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            For security reasons, you must change your password before accessing the application.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Security Notice</p>
                <p>You are required to set a new secure password. This ensures your account remains protected.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password - Only if not first login */}
            {!userProfile.first_login_at && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your current password"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Create a new secure password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.score >= 4 ? 'text-green-600' :
                      passwordStrength.score >= 3 ? 'text-blue-600' :
                      passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>

                  {/* Password Requirements */}
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Requirements not met:</p>
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your new password"
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

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.newPassword === formData.confirmPassword ? (
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

            <div>
              <button
                type="submit"
                disabled={loading || !passwordStrength.isStrong || formData.newPassword !== formData.confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Password Security Tips:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Use a unique password you don't use elsewhere</li>
                <li>• Include a mix of letters, numbers, and symbols</li>
                <li>• Avoid personal information like names or birthdays</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandatoryPasswordChange;