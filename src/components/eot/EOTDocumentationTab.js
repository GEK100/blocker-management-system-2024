import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyPoundIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import eotClaimsAPI from '../../lib/eotClaimsAPI';

const EOTDocumentationTab = ({ projectId, projectData }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [showClaimDetails, setShowClaimDetails] = useState(false);

  // Statistics
  const [claimStats, setClaimStats] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [contractFilter, setContractFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-generation state
  const [autoGenForm, setAutoGenForm] = useState({
    contractType: 'JCT_SBC',
    claimPeriodStart: '',
    claimPeriodEnd: '',
    selectedBlockers: [],
    generateNarrative: true,
    performCriticalPath: true
  });

  // Available blockers for auto-generation
  const [availableBlockers, setAvailableBlockers] = useState([]);

  useEffect(() => {
    if (projectId) {
      loadEOTData();
      loadAvailableBlockers();
    }
  }, [projectId]);

  const loadEOTData = async () => {
    try {
      setLoading(true);
      const [claimsData, statsData] = await Promise.all([
        eotClaimsAPI.getEOTClaimsForProject(projectId),
        eotClaimsAPI.getEOTClaimStatistics(projectId)
      ]);

      setClaims(claimsData);
      setClaimStats(statsData);
    } catch (err) {
      console.error('Error loading EOT data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBlockers = async () => {
    try {
      // This would integrate with your existing blockers API
      // For now, we'll simulate the API call
      const mockBlockers = [
        {
          id: '1',
          title: 'Late Design Information',
          category: 'Information',
          priority: 'HIGH',
          identified_date: '2024-01-15',
          resolution_date: '2024-02-20',
          description: 'Structural drawings delayed by 3 weeks'
        },
        {
          id: '2',
          title: 'Unforeseen Ground Conditions',
          category: 'Ground Conditions',
          priority: 'CRITICAL',
          identified_date: '2024-02-01',
          resolution_date: null,
          description: 'Rock encountered requiring additional excavation'
        }
      ];
      setAvailableBlockers(mockBlockers);
    } catch (err) {
      console.error('Error loading blockers:', err);
    }
  };

  const handleAutoGenerateClaim = async () => {
    if (!autoGenForm.claimPeriodStart || !autoGenForm.claimPeriodEnd || autoGenForm.selectedBlockers.length === 0) {
      alert('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      const result = await eotClaimsAPI.autoGenerateEOTClaim(
        projectId,
        autoGenForm.contractType,
        autoGenForm.claimPeriodStart,
        autoGenForm.claimPeriodEnd,
        autoGenForm.selectedBlockers,
        {
          generateNarrative: autoGenForm.generateNarrative,
          performCriticalPathAnalysis: autoGenForm.performCriticalPath
        }
      );

      if (result.success) {
        await loadEOTData();
        setShowAutoGenerateModal(false);
        setAutoGenForm({
          contractType: 'JCT_SBC',
          claimPeriodStart: '',
          claimPeriodEnd: '',
          selectedBlockers: [],
          generateNarrative: true,
          performCriticalPath: true
        });
        alert('EOT Claim generated successfully!');
      }
    } catch (err) {
      console.error('Error generating EOT claim:', err);
      alert('Error generating claim: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClaimDetails = async (claim) => {
    try {
      const detailedClaim = await eotClaimsAPI.getEOTClaimDetails(claim.claim_id);
      setSelectedClaim(detailedClaim);
      setShowClaimDetails(true);
    } catch (err) {
      console.error('Error loading claim details:', err);
      alert('Error loading claim details: ' + err.message);
    }
  };

  const handleExportClaim = async (claimId, format = 'PDF') => {
    try {
      const document = await eotClaimsAPI.exportClaimDocument(claimId, format);

      // Create downloadable document
      const content = document.content;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${document.metadata.claimReference}_EOT_Claim.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting claim:', err);
      alert('Error exporting claim: ' + err.message);
    }
  };

  const handleSubmitClaim = async (claimId) => {
    if (!confirm('Are you sure you want to submit this claim? This action cannot be undone.')) {
      return;
    }

    try {
      await eotClaimsAPI.submitEOTClaim(claimId);
      await loadEOTData();
      alert('Claim submitted successfully!');
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert('Error submitting claim: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-800', icon: PencilIcon },
      'SUBMITTED': { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon },
      'UNDER_REVIEW': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', icon: XMarkIcon },
      'PARTIALLY_APPROVED': { bg: 'bg-orange-100', text: 'text-orange-800', icon: ExclamationTriangleIcon }
    };

    const config = statusConfig[status] || statusConfig['DRAFT'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatContractType = (type) => {
    const types = {
      'JCT_SBC': 'JCT SBC',
      'JCT_DB': 'JCT D&B',
      'NEC4_ECC': 'NEC4 ECC',
      'FIDIC_RED': 'FIDIC Red',
      'FIDIC_YELLOW': 'FIDIC Yellow'
    };
    return types[type] || type;
  };

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
    const matchesContract = contractFilter === 'ALL' || claim.contract_type === contractFilter;
    const matchesSearch = searchTerm === '' ||
      claim.claim_reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claim_title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesContract && matchesSearch;
  });

  if (loading && claims.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">EOT Documentation</h2>
          <p className="text-sm text-gray-600">Generate and manage Extension of Time claims from blocker data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Manual Claim
          </button>
          <button
            onClick={() => setShowAutoGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Auto-Generate from Blockers
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {claimStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claimStats.totalClaims}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Days Claimed</p>
                <p className="text-2xl font-bold text-gray-900">{claimStats.totalDaysClaimed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyPoundIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{(claimStats.totalValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Claim</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(claimStats.averageClaimDays || 0)} days
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search claims..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Contracts</option>
              <option value="JCT_SBC">JCT SBC</option>
              <option value="JCT_DB">JCT D&B</option>
              <option value="NEC4_ECC">NEC4 ECC</option>
              <option value="FIDIC_RED">FIDIC Red</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setContractFilter('ALL');
                setSearchTerm('');
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Claims ({filteredClaims.length})
          </h3>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No EOT claims</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by auto-generating a claim from blocker data
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAutoGenerateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Auto-Generate Claim
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Claimed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.claim_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {claim.claim_reference_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {claim.claim_title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatContractType(claim.contract_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(claim.claim_period_start).toLocaleDateString()} -
                      {new Date(claim.claim_period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {claim.claimed_extension_days} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClaimDetails(claim)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {claim.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleSubmitClaim(claim.claim_id)}
                              className="text-green-600 hover:text-green-900"
                              title="Submit Claim"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit Claim"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleExportClaim(claim.claim_id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Export Document"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Generate Modal */}
      {showAutoGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Auto-Generate EOT Claim from Blockers
            </h3>

            <div className="space-y-4">
              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type *
                </label>
                <select
                  value={autoGenForm.contractType}
                  onChange={(e) => setAutoGenForm({...autoGenForm, contractType: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="JCT_SBC">JCT Standard Building Contract</option>
                  <option value="JCT_DB">JCT Design & Build</option>
                  <option value="NEC4_ECC">NEC4 Engineering & Construction Contract</option>
                  <option value="FIDIC_RED">FIDIC Red Book</option>
                  <option value="FIDIC_YELLOW">FIDIC Yellow Book</option>
                </select>
              </div>

              {/* Claim Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Period Start *
                  </label>
                  <input
                    type="date"
                    value={autoGenForm.claimPeriodStart}
                    onChange={(e) => setAutoGenForm({...autoGenForm, claimPeriodStart: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Period End *
                  </label>
                  <input
                    type="date"
                    value={autoGenForm.claimPeriodEnd}
                    onChange={(e) => setAutoGenForm({...autoGenForm, claimPeriodEnd: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Blocker Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Blockers to Include *
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                  {availableBlockers.map((blocker) => (
                    <div key={blocker.id} className="flex items-center space-x-3 py-2">
                      <input
                        type="checkbox"
                        id={`blocker-${blocker.id}`}
                        checked={autoGenForm.selectedBlockers.includes(blocker.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAutoGenForm({
                              ...autoGenForm,
                              selectedBlockers: [...autoGenForm.selectedBlockers, blocker.id]
                            });
                          } else {
                            setAutoGenForm({
                              ...autoGenForm,
                              selectedBlockers: autoGenForm.selectedBlockers.filter(id => id !== blocker.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`blocker-${blocker.id}`} className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{blocker.title}</div>
                        <div className="text-xs text-gray-500">
                          {blocker.category} • {blocker.priority} •
                          {blocker.resolution_date ?
                            ` Resolved ${new Date(blocker.resolution_date).toLocaleDateString()}` :
                            ' Ongoing'
                          }
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generation Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="generateNarrative"
                    checked={autoGenForm.generateNarrative}
                    onChange={(e) => setAutoGenForm({...autoGenForm, generateNarrative: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="generateNarrative" className="text-sm font-medium text-gray-700">
                    Auto-generate claim narrative
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="performCriticalPath"
                    checked={autoGenForm.performCriticalPath}
                    onChange={(e) => setAutoGenForm({...autoGenForm, performCriticalPath: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="performCriticalPath" className="text-sm font-medium text-gray-700">
                    Perform critical path analysis
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoGenerateClaim}
                disabled={!autoGenForm.claimPeriodStart || !autoGenForm.claimPeriodEnd || autoGenForm.selectedBlockers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {showClaimDetails && selectedClaim && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Claim Details: {selectedClaim.claim_reference_number}
              </h3>
              <button
                onClick={() => setShowClaimDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Claim Summary */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Claim Summary</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Reference:</span>
                    <div className="text-sm text-gray-900">{selectedClaim.claim_reference_number}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Contract:</span>
                    <div className="text-sm text-gray-900">{formatContractType(selectedClaim.contract_type)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Period:</span>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedClaim.claim_period_start).toLocaleDateString()} -
                      {new Date(selectedClaim.claim_period_end).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Days Claimed:</span>
                    <div className="text-lg font-bold text-blue-600">{selectedClaim.claimed_extension_days}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedClaim.status)}</div>
                  </div>
                </div>
              </div>

              {/* Related Blockers */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Related Blockers ({selectedClaim.blockers?.length || 0})</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedClaim.blockers?.map((eotBlocker) => (
                    <div key={eotBlocker.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {eotBlocker.blocker.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {eotBlocker.blocker.category} • {eotBlocker.delay_contribution_days} days
                      </div>
                      {eotBlocker.is_critical_path && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-2">
                          Critical Path
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Narrative Preview */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Generated Narrative</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {selectedClaim.auto_generated_narrative ? (
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedClaim.auto_generated_narrative.substring(0, 500)}...
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No narrative generated yet
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExportClaim(selectedClaim.claim_id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export Full Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EOTDocumentationTab;