import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const CompanyAccessDenied = ({
  companyStatus = 'suspended',
  companyName = 'Your Company',
  message,
  reason
}) => {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    switch (companyStatus) {
      case 'suspended':
        return <ShieldExclamationIcon className="h-16 w-16 text-red-500" />;
      case 'cancelled':
        return <XMarkIcon className="h-16 w-16 text-gray-500" />;
      case 'archived':
        return <ArchiveBoxIcon className="h-16 w-16 text-purple-500" />;
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (companyStatus) {
      case 'suspended':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      case 'archived':
        return 'text-purple-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusTitle = () => {
    switch (companyStatus) {
      case 'suspended':
        return 'Account Suspended';
      case 'cancelled':
        return 'Account Cancelled';
      case 'archived':
        return 'Account Archived';
      case 'pending':
        return 'Setup Pending';
      default:
        return 'Access Denied';
    }
  };

  const getDefaultMessage = () => {
    switch (companyStatus) {
      case 'suspended':
        return `${companyName} account is temporarily suspended. Please contact your administrator or support for assistance.`;
      case 'cancelled':
        return `${companyName} account has been cancelled. Please contact support if you believe this is an error.`;
      case 'archived':
        return `${companyName} account is archived and no longer active.`;
      case 'pending':
        return `${companyName} is still completing their setup. Please contact your administrator.`;
      default:
        return 'Access denied. Please contact support for assistance.';
    }
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@constructionblocker.com?subject=Account Access Issue';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6">
            {getStatusIcon()}
          </div>
          <h2 className={`text-3xl font-extrabold ${getStatusColor()}`}>
            {getStatusTitle()}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {message || getDefaultMessage()}
          </p>

          {reason && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Reason:</p>
                  <p>{reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {companyStatus === 'suspended' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">What happens during suspension:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your data is preserved and secure</li>
                  <li>• Access is temporarily restricted</li>
                  <li>• Service will resume once issues are resolved</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleContactSupport}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Support
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need immediate assistance? Email{' '}
              <a
                href="mailto:support@constructionblocker.com"
                className="text-blue-600 hover:text-blue-800"
              >
                support@constructionblocker.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAccessDenied;