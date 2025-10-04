import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  BellIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import subcontractorPerformanceAPI from '../../lib/subcontractorPerformanceAPI';

const SubcontractorRiskProfilingTab = ({ companyId }) => {
  const [loading, setLoading] = useState(true);
  const [subcontractors, setSubcontractors] = useState([]);
  const [companyStats, setCompanyStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState(null);

  // UI State
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonSubcontractors, setComparisonSubcontractors] = useState([]);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    grade: '',
    tradeType: '',
    recommendation: '',
    minScore: '',
    maxScore: '',
    searchTerm: ''
  });

  useEffect(() => {
    if (companyId) {
      loadSubcontractorData();
    }
  }, [companyId, filters]);

  const loadSubcontractorData = async () => {
    try {
      setLoading(true);

      const [profilesResult, statsResult, alertsResult, recommendationsResult] = await Promise.all([
        subcontractorPerformanceAPI.getSubcontractorProfiles(companyId, filters),
        subcontractorPerformanceAPI.getCompanyPerformanceStatistics(companyId),
        subcontractorPerformanceAPI.getPerformanceAlerts(companyId),
        subcontractorPerformanceAPI.getProcurementRecommendations(companyId)
      ]);

      if (profilesResult.success) {
        const filteredData = profilesResult.data.filter(sub =>
          !filters.searchTerm ||
          sub.company_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          sub.trade_type?.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
        setSubcontractors(filteredData);
      }

      if (statsResult.success) setCompanyStats(statsResult.data);
      if (alertsResult.success) setAlerts(alertsResult.data);
      if (recommendationsResult.success) setRecommendations(recommendationsResult.data);

    } catch (error) {
      console.error('Error loading subcontractor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (subcontractor) => {
    try {
      const result = await subcontractorPerformanceAPI.getSubcontractorPerformanceDetails(
        subcontractor.subcontractor_id,
        companyId
      );

      if (result.success) {
        setSelectedSubcontractor({ ...subcontractor, details: result.data });
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading subcontractor details:', error);
    }
  };

  const handleCompareSubcontractors = async () => {
    if (selectedForComparison.length < 2) {
      alert('Please select at least 2 subcontractors to compare');
      return;
    }

    try {
      const result = await subcontractorPerformanceAPI.compareSubcontractors(
        companyId,
        selectedForComparison
      );

      if (result.success) {
        setComparisonSubcontractors(result.data);
        setShowComparisonModal(true);
      }
    } catch (error) {
      console.error('Error comparing subcontractors:', error);
    }
  };

  const handleExportReport = async () => {
    try {
      const result = await subcontractorPerformanceAPI.exportPerformanceReport(companyId, filters, 'text');
      if (result.success) {
        // Create downloadable file
        const blob = new Blob([result.data], { type: result.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'subcontractor_performance_report.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getGradeBadge = (grade) => {
    const gradeConfig = {
      'A': { bg: 'bg-green-100', text: 'text-green-800', label: 'Preferred' },
      'B': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      'C': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Caution' },
      'D': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Monitor' },
      'F': { bg: 'bg-red-100', text: 'text-red-800', label: 'Avoid' }
    };

    const config = gradeConfig[grade] || gradeConfig['C'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {grade} - {config.label}
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    if (score >= 20) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'degrading':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderScoreGauge = (score, size = 'medium') => {
    const radius = size === 'large' ? 45 : size === 'medium' ? 35 : 25;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={`relative ${size === 'large' ? 'w-24 h-24' : size === 'medium' ? 'w-20 h-20' : 'w-16 h-16'}`}>
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-sm' : 'text-xs'} font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Company Statistics Cards */}
      {companyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Subcontractors</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.totalSubcontractors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Top Performers</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.topPerformers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.averageScore}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.activeAlertsCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Distribution */}
      {companyStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Grade Distribution</h3>
          <div className="grid grid-cols-5 gap-4">
            {['A', 'B', 'C', 'D', 'F'].map((grade) => (
              <div key={grade} className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(grade === 'A' ? 90 : grade === 'B' ? 70 : grade === 'C' ? 50 : grade === 'D' ? 30 : 10)}`}>
                  {companyStats.gradeDistribution[grade]}
                </div>
                <div className="text-sm text-gray-600">Grade {grade}</div>
                {getGradeBadge(grade)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top and Poor Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {subcontractors
              .filter(sub => sub.overall_risk_score >= 80)
              .slice(0, 5)
              .map((sub) => (
                <div key={sub.subcontractor_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{sub.company_name}</div>
                    <div className="text-sm text-gray-600">{sub.trade_type}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderScoreGauge(sub.overall_risk_score, 'small')}
                    {getGradeBadge(sub.performance_grade)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Poor Performers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            Needs Attention
          </h3>
          <div className="space-y-3">
            {subcontractors
              .filter(sub => sub.overall_risk_score < 40 || sub.blacklist_status)
              .slice(0, 5)
              .map((sub) => (
                <div key={sub.subcontractor_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{sub.company_name}</div>
                    <div className="text-sm text-gray-600">{sub.trade_type}</div>
                    {sub.blacklist_status && (
                      <div className="text-xs text-red-600 font-medium">BLACKLISTED</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderScoreGauge(sub.overall_risk_score, 'small')}
                    {getGradeBadge(sub.performance_grade)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfiles = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search subcontractors..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters({...filters, grade: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A (Preferred)</option>
              <option value="B">Grade B (Approved)</option>
              <option value="C">Grade C (Caution)</option>
              <option value="D">Grade D (Monitor)</option>
              <option value="F">Grade F (Avoid)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
            <select
              value={filters.tradeType}
              onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Trades</option>
              {[...new Set(subcontractors.map(s => s.trade_type).filter(Boolean))].map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters({...filters, minScore: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={(e) => setFilters({...filters, maxScore: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                grade: '',
                tradeType: '',
                recommendation: '',
                minScore: '',
                maxScore: '',
                searchTerm: ''
              })}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Actions */}
      {selectedForComparison.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {selectedForComparison.length} subcontractors selected for comparison
              </span>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setSelectedForComparison([])}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                Clear Selection
              </button>
              <button
                onClick={handleCompareSubcontractors}
                disabled={selectedForComparison.length < 2}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Compare Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcontractors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Subcontractor Profiles ({subcontractors.length})
          </h3>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedForComparison(subcontractors.map(s => s.subcontractor_id));
                      } else {
                        setSelectedForComparison([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score & Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects & Metrics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subcontractors.map((subcontractor) => (
                <tr key={subcontractor.subcontractor_id} className="hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedForComparison.includes(subcontractor.subcontractor_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForComparison([...selectedForComparison, subcontractor.subcontractor_id]);
                        } else {
                          setSelectedForComparison(selectedForComparison.filter(id => id !== subcontractor.subcontractor_id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subcontractor.company_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subcontractor.trade_type}
                      </div>
                      {subcontractor.blacklist_status && (
                        <div className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded mt-1">
                          BLACKLISTED
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {renderScoreGauge(subcontractor.overall_risk_score, 'medium')}
                      <div>
                        {getGradeBadge(subcontractor.performance_grade)}
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence: {subcontractor.confidence_level?.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Speed:</span>
                        <span className={`font-medium ${getScoreColor(subcontractor.speed_score)}`}>
                          {subcontractor.speed_score}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className={`font-medium ${getScoreColor(subcontractor.quality_score)}`}>
                          {subcontractor.quality_score}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reliability:</span>
                        <span className={`font-medium ${getScoreColor(subcontractor.reliability_score)}`}>
                          {subcontractor.reliability_score}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Communication:</span>
                        <span className={`font-medium ${getScoreColor(subcontractor.communication_score)}`}>
                          {subcontractor.communication_score}/100
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projects:</span>
                        <span className="font-medium">{subcontractor.projects_worked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">{subcontractor.resolution_success_rate?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Resolution:</span>
                        <span className="font-medium">{subcontractor.average_resolution_days?.toFixed(1)}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rejection Rate:</span>
                        <span className="font-medium">{subcontractor.rejection_rate?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(subcontractor.recent_trend)}
                      <div className="text-sm">
                        {subcontractor.recent_trend || 'stable'}
                      </div>
                    </div>
                    {subcontractor.active_alerts > 0 && (
                      <div className="text-xs text-red-600 mt-1 flex items-center">
                        <BellIcon className="w-3 h-3 mr-1" />
                        {subcontractor.active_alerts} alerts
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(subcontractor.last_assessment_date).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(subcontractor)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProcurement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Procurement Decision Support</h3>

        {recommendations && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Preferred */}
            <div className="space-y-4">
              <h4 className="font-medium text-green-800 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Preferred ({recommendations.preferred?.length || 0})
              </h4>
              <div className="space-y-3">
                {recommendations.preferred?.slice(0, 5).map((rec) => (
                  <div key={rec.recommendation_id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-gray-900">{rec.subcontractors?.company_name}</div>
                    <div className="text-sm text-gray-600">{rec.subcontractors?.trade_type}</div>
                    <div className="text-xs text-green-700 mt-2">{rec.reasoning}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-green-800">
                        Score: {rec.subcontractor_profiles?.overall_risk_score}/100
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {rec.confidence_score?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution */}
            <div className="space-y-4">
              <h4 className="font-medium text-yellow-800 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Caution ({recommendations.caution?.length || 0})
              </h4>
              <div className="space-y-3">
                {recommendations.caution?.slice(0, 5).map((rec) => (
                  <div key={rec.recommendation_id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-gray-900">{rec.subcontractors?.company_name}</div>
                    <div className="text-sm text-gray-600">{rec.subcontractors?.trade_type}</div>
                    <div className="text-xs text-yellow-700 mt-2">{rec.reasoning}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-yellow-800">
                        Score: {rec.subcontractor_profiles?.overall_risk_score}/100
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {rec.confidence_score?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid */}
            <div className="space-y-4">
              <h4 className="font-medium text-red-800 flex items-center">
                <ShieldExclamationIcon className="w-5 h-5 mr-2" />
                Avoid ({recommendations.avoid?.length || 0})
              </h4>
              <div className="space-y-3">
                {recommendations.avoid?.slice(0, 5).map((rec) => (
                  <div key={rec.recommendation_id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-gray-900">{rec.subcontractors?.company_name}</div>
                    <div className="text-sm text-gray-600">{rec.subcontractors?.trade_type}</div>
                    <div className="text-xs text-red-700 mt-2">{rec.reasoning}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-red-800">
                        Score: {rec.subcontractor_profiles?.overall_risk_score}/100
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {rec.confidence_score?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Performance Alerts ({alerts.length})
          </h3>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              All subcontractors are performing within expected parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.alert_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon
                        className={`h-6 w-6 ${
                          alert.severity >= 8 ? 'text-red-600' :
                          alert.severity >= 6 ? 'text-orange-600' :
                          alert.severity >= 4 ? 'text-yellow-600' : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {alert.subcontractors?.company_name} - {alert.subcontractors?.trade_type}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{alert.description}</p>
                      {alert.recommended_action && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <strong>Recommended Action:</strong> {alert.recommended_action}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center mt-3 text-xs text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Created: {new Date(alert.created_at).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        Severity: {alert.severity}/10
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Subcontractor Risk Profiling</h2>
          <p className="text-sm text-gray-600">
            Track and score subcontractor performance to support procurement decisions
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{companyStats?.averageScore || 0}</div>
          <div className="text-sm text-gray-600">Company Average</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'profiles', label: 'Subcontractor Profiles', icon: UserGroupIcon },
            { id: 'procurement', label: 'Procurement Support', icon: ShieldCheckIcon },
            { id: 'alerts', label: 'Performance Alerts', icon: BellIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'alerts' && alerts.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'profiles' && renderProfiles()}
        {selectedView === 'procurement' && renderProcurement()}
        {selectedView === 'alerts' && renderAlerts()}
      </div>

      {/* Details Modal would go here */}
      {/* Comparison Modal would go here */}
    </div>
  );
};

export default SubcontractorRiskProfilingTab;