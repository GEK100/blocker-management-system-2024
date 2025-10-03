import React, { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  BanknotesIcon,
  ShieldExclamationIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import superAdminAPI from '../lib/superAdminAPI';
import companyInvitationAPI from '../lib/companyInvitationAPI';
import companyLifecycleAPI from '../lib/companyLifecycleAPI';
import authMiddleware from '../lib/authMiddleware';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [companies, setCompanies] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Company creation modal state
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    subscriptionPlanId: ''
  });

  // Company management state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [reactivationReason, setReactivationReason] = useState('Payment issues resolved');
  const [actionLoading, setActionLoading] = useState(false);
  const [companyAuditTrail, setCompanyAuditTrail] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [companiesData, statsData, plansData] = await Promise.all([
        companyLifecycleAPI.getAllCompaniesWithStatus(),
        superAdminAPI.getPlatformAnalytics(),
        superAdminAPI.getSubscriptionPlans()
      ]);

      setCompanies(companiesData);
      setPlatformStats(statsData);
      setSubscriptionPlans(plansData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const result = await companyLifecycleAPI.createCompanyWithCredentials(
        {
          name: newCompanyData.name,
          email: newCompanyData.email,
          phone: newCompanyData.phone,
          address: newCompanyData.address,
          subscription_plan_id: newCompanyData.subscriptionPlanId
        },
        newCompanyData.ownerEmail,
        newCompanyData.ownerName
      );

      await loadDashboardData();
      setShowCreateCompany(false);
      setNewCompanyData({
        name: '',
        email: '',
        phone: '',
        address: '',
        ownerName: '',
        ownerEmail: '',
        subscriptionPlanId: ''
      });

      alert(`Company created successfully! Setup email sent to ${newCompanyData.ownerEmail}\nSetup URL: ${result.setupUrl}`);
    } catch (err) {
      console.error('Error creating company:', err);
      alert('Error creating company: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendCompany = async () => {
    if (!suspensionReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    setActionLoading(true);
    try {
      await companyLifecycleAPI.suspendCompany(selectedCompany.id, suspensionReason);
      await loadDashboardData();
      setShowSuspendModal(false);
      setSuspensionReason('');
      setSelectedCompany(null);
      alert('Company suspended successfully');
    } catch (err) {
      console.error('Error suspending company:', err);
      alert('Error suspending company: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateCompany = async () => {
    setActionLoading(true);
    try {
      await companyLifecycleAPI.reactivateCompany(selectedCompany.id, reactivationReason);
      await loadDashboardData();
      setShowReactivateModal(false);
      setReactivationReason('Payment issues resolved');
      setSelectedCompany(null);
      alert('Company reactivated successfully');
    } catch (err) {
      console.error('Error reactivating company:', err);
      alert('Error reactivating company: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowCompanyDetails = async (company) => {
    setSelectedCompany(company);
    try {
      const auditTrail = await companyLifecycleAPI.getCompanyAuditTrail(company.id);
      setCompanyAuditTrail(auditTrail);
      setShowCompanyDetails(true);
    } catch (err) {
      console.error('Error loading company details:', err);
      alert('Error loading company details: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Setup' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
      archived: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Archived' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'suspended': return <ShieldExclamationIcon className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <XMarkIcon className="h-4 w-4 text-gray-600" />;
      case 'archived': return <ArchiveBoxIcon className="h-4 w-4 text-purple-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Platform management and analytics</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.companies.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.users.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Blockers</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.blockers.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${platformStats.revenue.monthly}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'companies', name: 'Companies', icon: BuildingOfficeIcon },
                { id: 'subscriptions', name: 'Subscriptions', icon: CreditCardIcon },
                { id: 'settings', name: 'Settings', icon: CogIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Companies Tab */}
            {activeTab === 'companies' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Company Management</h2>
                  <button
                    onClick={() => setShowCreateCompany(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Company
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{company.name}</div>
                              <div className="text-sm text-gray-500">{company.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(company.status)}
                              {getStatusBadge(company.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{company.subscription_plan?.name || 'No Plan'}</div>
                            <div className="text-sm text-gray-500">{company.subscription_status}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {company.user_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleShowCompanyDetails(company)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>

                              {company.status === 'suspended' ? (
                                <button
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setShowReactivateModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Reactivate Company"
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                </button>
                              ) : company.status === 'active' ? (
                                <button
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setShowSuspendModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Suspend Company"
                                >
                                  <ShieldExclamationIcon className="h-5 w-5" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && platformStats && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Platform Overview</h2>

                {/* Company Status Distribution */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Status Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(platformStats.companies.byStatus).map(([status, count]) => (
                      <div key={status} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-500 capitalize">{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Role Distribution */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(platformStats.users.byRole).map(([role, count]) => (
                      <div key={role} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-sm text-gray-500 capitalize">{role.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue by Plan */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(platformStats.revenue.byPlan).map(([plan, revenue]) => (
                      <div key={plan} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">${revenue}</div>
                        <div className="text-sm text-gray-500">{plan}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 mt-2">{plan.description}</p>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-gray-900">${plan.price_monthly}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                      <div className="mt-4">
                        <span className="text-lg font-bold text-gray-900">${plan.price_yearly}</span>
                        <span className="text-gray-500">/year</span>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900">Features:</h4>
                        <ul className="mt-2 text-sm text-gray-600">
                          {Object.entries(plan.features).map(([feature, value]) => (
                            <li key={feature} className="capitalize">
                              {feature.replace('_', ' ')}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend Company Modal */}
      {showSuspendModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Suspend Company</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to suspend <strong>{selectedCompany.name}</strong>.
              All users from this company will immediately lose access to the application.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension *
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="e.g., Payment overdue, Terms violation, Security concerns..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendCompany}
                disabled={actionLoading || !suspensionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Suspend Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Company Modal */}
      {showReactivateModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reactivate Company</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to reactivate <strong>{selectedCompany.name}</strong>.
              All users from this company will regain access to the application.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Reactivation
              </label>
              <input
                type="text"
                value={reactivationReason}
                onChange={(e) => setReactivationReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Payment received, Issue resolved..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowReactivateModal(false);
                  setReactivationReason('Payment issues resolved');
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReactivateCompany}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Reactivate Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {showCompanyDetails && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Company Details: {selectedCompany.name}</h3>
              <button
                onClick={() => {
                  setShowCompanyDetails(false);
                  setSelectedCompany(null);
                  setCompanyAuditTrail([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Company Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      {getStatusIcon(selectedCompany.status)}
                      {getStatusBadge(selectedCompany.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <div className="text-sm text-gray-900">{selectedCompany.email}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <div className="text-sm text-gray-900">{selectedCompany.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Created:</span>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedCompany.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Subscription:</span>
                    <div className="text-sm text-gray-900">
                      {selectedCompany.subscription_plan?.name || 'No Plan'}
                    </div>
                  </div>
                  {selectedCompany.status === 'suspended' && selectedCompany.suspended_at && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Suspended:</span>
                        <div className="text-sm text-gray-900">
                          {new Date(selectedCompany.suspended_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Suspension Reason:</span>
                        <div className="text-sm text-gray-900">
                          {selectedCompany.suspension_reason || 'No reason provided'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Audit Trail</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {companyAuditTrail.length > 0 ? (
                    <div className="space-y-3">
                      {companyAuditTrail.map((audit, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-3">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {audit.action.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(audit.created_at).toLocaleString()}
                          </div>
                          {audit.reason && (
                            <div className="text-xs text-gray-700 mt-1">
                              Reason: {audit.reason}
                            </div>
                          )}
                          {audit.performed_by_user?.name && (
                            <div className="text-xs text-gray-600">
                              By: {audit.performed_by_user.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No audit trail available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {selectedCompany.status === 'suspended' ? (
                <button
                  onClick={() => {
                    setShowCompanyDetails(false);
                    setShowReactivateModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Reactivate Company
                </button>
              ) : selectedCompany.status === 'active' ? (
                <button
                  onClick={() => {
                    setShowCompanyDetails(false);
                    setShowSuspendModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                  <ShieldExclamationIcon className="h-4 w-4 mr-2" />
                  Suspend Company
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Company</h3>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={newCompanyData.name}
                  onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Company Email</label>
                <input
                  type="email"
                  value={newCompanyData.email}
                  onChange={(e) => setNewCompanyData({...newCompanyData, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                <input
                  type="text"
                  value={newCompanyData.ownerName}
                  onChange={(e) => setNewCompanyData({...newCompanyData, ownerName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                <input
                  type="email"
                  value={newCompanyData.ownerEmail}
                  onChange={(e) => setNewCompanyData({...newCompanyData, ownerEmail: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                <select
                  value={newCompanyData.subscriptionPlanId}
                  onChange={(e) => setNewCompanyData({...newCompanyData, subscriptionPlanId: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a plan</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;