import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSmartAuth } from '../hooks/useSmartAuth';
import { brandConfig } from '../design-system/brand';
import Button from '../design-system/components/Button';
import Card from '../design-system/components/Card';
import {
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useSmartAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await login(formData.email, formData.password);

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
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
            Sign in to {brandConfig.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

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
                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200 touch-manipulation"
                placeholder="Enter your email"
              />
            </div>

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
                  className="w-full px-3 py-3 sm:py-2 pr-10 text-base sm:text-sm border border-slate-300 rounded-lg focus:ring-construction-500 focus:border-construction-500 transition-colors duration-200 touch-manipulation"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 touch-manipulation"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 sm:h-4 sm:w-4 text-construction-600 focus:ring-construction-500 border-slate-300 rounded touch-manipulation"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 touch-manipulation">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-construction-600 hover:text-construction-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="h-12"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-construction-600 hover:text-construction-500"
              >
                Create a new account
              </Link>
            </div>
          </div>
        </Card>

        {/* Demo Credentials */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-3">Demo Accounts</h3>
          <div className="space-y-2 text-xs text-blue-700">
            <div><strong>Super Admin:</strong> admin@example.com / password</div>
            <div><strong>Company Admin:</strong> company@example.com / password</div>
            <div><strong>Field Worker:</strong> worker@example.com / password</div>
          </div>
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

export default LoginForm;