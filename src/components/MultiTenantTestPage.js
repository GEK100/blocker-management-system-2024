import React, { useState, useEffect } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import multiTenantTestSuite from '../utils/multiTenantTesting';
import authMiddleware from '../lib/authMiddleware';

const MultiTenantTestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    // Get current user context
    const context = authMiddleware.getCurrentUser();
    setUserContext(context);
  }, []);

  const runTests = async () => {
    try {
      setIsRunning(true);
      setTestResults(null);

      console.log('🧪 Starting multi-tenant test suite...');
      const results = await multiTenantTestSuite.runAllTests();

      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
      setTestResults({
        summary: { total: 0, passed: 0, failed: 1, successRate: 0 },
        results: [],
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportTestResults = () => {
    if (!testResults) return;

    const report = multiTenantTestSuite.generateReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `multitenant-test-report-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getTestStatusIcon = (passed) => {
    return passed ? (
      <CheckCircleIcon className="w-5 h-5 text-green-600" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-600" />
    );
  };

  const getTestStatusColor = (passed) => {
    return passed ? 'text-green-800 bg-green-100 border-green-200' : 'text-red-800 bg-red-100 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BeakerIcon className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Testing Suite</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            This page runs comprehensive tests to verify that Row Level Security (RLS) policies are working correctly
            and that complete data isolation is maintained between companies. Only users can see data from their own company,
            with super admins having platform-wide access.
          </p>
        </div>

        {/* User Context */}
        {userContext && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Current User Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">User:</span>
                <p className="text-gray-900">{userContext.profile?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{userContext.profile?.email || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Role:</span>
                <p className="text-gray-900 capitalize">{userContext.profile?.role?.replace('_', ' ') || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Company:</span>
                <p className="text-gray-900">{userContext.company?.name || 'No Company'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Test Controls</h2>
              <p className="text-sm text-gray-600 mt-1">
                Run the complete test suite to verify multi-tenant data isolation
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Tests...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Run Tests
                  </>
                )}
              </button>

              {testResults && (
                <button
                  onClick={exportTestResults}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h2>

              {testResults.error ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <span className="text-red-800 font-medium">Test Suite Failed</span>
                  </div>
                  <p className="text-red-700 mt-2">{testResults.error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{testResults.summary.total}</div>
                    <div className="text-sm text-gray-500">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testResults.summary.passed}</div>
                    <div className="text-sm text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{testResults.summary.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Success Rate</div>
                  </div>
                </div>
              )}
            </div>

            {/* Individual Test Results */}
            {testResults.results && testResults.results.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h2>
                <div className="space-y-4">
                  {testResults.results.map((result, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getTestStatusColor(result.passed)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          {getTestStatusIcon(result.passed)}
                          <div className="ml-3">
                            <h3 className="font-medium">{result.testName}</h3>
                            <p className="text-sm mt-1">{result.message}</p>
                            {result.timestamp && (
                              <p className="text-xs mt-2 opacity-75">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {result.data && (
                        <div className="mt-4 pl-8">
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium">Test Data</summary>
                            <pre className="mt-2 p-3 bg-white bg-opacity-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Coverage Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">What These Tests Verify</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Company Data Isolation:</strong> Users can only access data from their own company</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Project Isolation:</strong> Projects are properly filtered by company membership</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Blocker Isolation:</strong> Blockers are only visible within the same company</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>User Profile Security:</strong> User profiles are company-scoped</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Contractor Access:</strong> Contractors are isolated by company</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Drawing Security:</strong> Site drawings are project and company scoped</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Super Admin Access:</strong> Platform administrators can access all data</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Role-Based Permissions:</strong> User permissions match their assigned role</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Subscription Features:</strong> Feature access respects subscription limits</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!testResults && !isRunning && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
            <p className="text-gray-600 mb-6">
              Click "Run Tests" to verify that multi-tenant data isolation is working correctly
            </p>
            <button
              onClick={runTests}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Run Multi-Tenant Tests
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiTenantTestPage;