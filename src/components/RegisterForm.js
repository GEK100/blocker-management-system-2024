import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { brandConfig } from '../design-system/brand';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import {
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    role: 'company_admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.companyName.trim()) return 'Company name is required';
    return null;
  };

  const handleNext = () => {
    const error = validateStep1();
    if (error) {
      setError(error);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await register(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        role: formData.role
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        navigate('/consent');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-construction-100 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-10 w-10 text-construction-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join {brandConfig.name} and streamline your construction management
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
            step >= 1 ? 'bg-construction-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            1
          </div>
          <div className={`w-8 h-1 ${step >= 2 ? 'bg-construction-600' : 'bg-slate-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
            step >= 2 ? 'bg-construction-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            2
          </div>
        </div>

        {/* Registration Form */}
        <Card className="p-8">
          <form className="space-y-6" onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                    placeholder="john@company.com"
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth className="h-12">
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                      placeholder="Create a secure password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200"
                    placeholder="Your Construction Company"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="flex-1 h-12"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="font-medium text-construction-600 hover:text-construction-500"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;