import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  TrendingUpIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const SubcontractorPerformanceAnalytics = ({ companyId, projectId = null, onBack }) => {
  const [analytics, setAnalytics] = useState({
    subcontractorMetrics: {},
    resolutionTimes: [],
    blockerVolume: [],
    successRates: [],
    responseTrends: [],
    performanceComparison: []
  });
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detailed'
  const [timeRange, setTimeRange] = useState('3months');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSubcontractorAnalytics();
  }, [companyId, projectId, timeRange]);

  const generateSubcontractorAnalytics = () => {
    setLoading(true);

    // Generate comprehensive subcontractor performance data
    const contractors = [
      {
        id: 'sc1',
        name: 'Elite Electrical Solutions',
        tradeType: 'electrical',
        contact: 'Mike Johnson',
        totalBlockers: projectId ? 25 : 87,
        resolvedBlockers: projectId ? 22 : 78,
        avgResolutionTime: 2.3,
        responseTime: 0.8,
        performanceScore: 92,
        onTimeCompletion: 88,
        qualityRating: 4.6
      },
      {
        id: 'sc2',
        name: 'Premier Plumbing Co.',
        tradeType: 'plumbing',
        contact: 'Sarah Chen',
        totalBlockers: projectId ? 18 : 64,
        resolvedBlockers: projectId ? 16 : 58,
        avgResolutionTime: 3.1,
        responseTime: 1.2,
        performanceScore: 85,
        onTimeCompletion: 78,
        qualityRating: 4.3
      },
      {
        id: 'sc3',
        name: 'Apex HVAC Systems',
        tradeType: 'hvac',
        contact: 'David Rodriguez',
        totalBlockers: projectId ? 22 : 73,
        resolvedBlockers: projectId ? 20 : 65,
        avgResolutionTime: 2.8,
        responseTime: 1.0,
        performanceScore: 89,
        onTimeCompletion: 82,
        qualityRating: 4.4
      },
      {
        id: 'sc4',
        name: 'Master Masonry Works',
        tradeType: 'masonry',
        contact: 'Lisa Thompson',
        totalBlockers: projectId ? 15 : 45,
        resolvedBlockers: projectId ? 13 : 39,
        avgResolutionTime: 4.2,
        responseTime: 1.5,
        performanceScore: 76,
        onTimeCompletion: 71,
        qualityRating: 4.1
      },
      {
        id: 'sc5',
        name: 'Steel Frame Specialists',
        tradeType: 'steel',
        contact: 'Robert Kim',
        totalBlockers: projectId ? 12 : 38,
        resolvedBlockers: projectId ? 11 : 34,
        avgResolutionTime: 3.5,
        responseTime: 1.1,
        performanceScore: 82,
        onTimeCompletion: 75,
        qualityRating: 4.2
      }
    ];

    // Generate resolution times trend data
    const resolutionTimes = contractors.map(contractor => ({
      contractorName: contractor.name,
      tradeType: contractor.tradeType,
      avgTime: contractor.avgResolutionTime,
      monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2024, new Date().getMonth() - 5 + i).toLocaleDateString('en-US', { month: 'short' }),
        time: contractor.avgResolutionTime + (Math.random() - 0.5) * 1.2
      }))
    }));

    // Generate blocker volume data
    const blockerVolume = contractors.map(contractor => ({
      contractorName: contractor.name,
      tradeType: contractor.tradeType,
      total: contractor.totalBlockers,
      resolved: contractor.resolvedBlockers,
      pending: contractor.totalBlockers - contractor.resolvedBlockers,
      critical: Math.floor(contractor.totalBlockers * 0.15),
      high: Math.floor(contractor.totalBlockers * 0.25),
      medium: Math.floor(contractor.totalBlockers * 0.35),
      low: Math.floor(contractor.totalBlockers * 0.25)
    }));

    // Generate success rates data
    const successRates = contractors.map(contractor => ({
      contractorName: contractor.name,
      tradeType: contractor.tradeType,
      successRate: (contractor.resolvedBlockers / contractor.totalBlockers) * 100,
      onTimeRate: contractor.onTimeCompletion,
      qualityScore: contractor.qualityRating * 20,
      performanceScore: contractor.performanceScore,
      monthlyRates: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2024, new Date().getMonth() - 5 + i).toLocaleDateString('en-US', { month: 'short' }),
        rate: contractor.onTimeCompletion + (Math.random() - 0.5) * 10
      }))
    }));

    // Generate response time trends
    const responseTrends = contractors.map(contractor => ({
      contractorName: contractor.name,
      tradeType: contractor.tradeType,
      avgResponseTime: contractor.responseTime,
      trend: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        responseTime: contractor.responseTime + (Math.random() - 0.5) * 0.6
      }))
    }));

    // Generate performance comparison
    const performanceComparison = contractors.map(contractor => ({
      contractorName: contractor.name,
      tradeType: contractor.tradeType,
      metrics: {
        resolutionTime: contractor.avgResolutionTime,
        responseTime: contractor.responseTime,
        successRate: (contractor.resolvedBlockers / contractor.totalBlockers) * 100,
        qualityRating: contractor.qualityRating,
        performanceScore: contractor.performanceScore,
        blockerVolume: contractor.totalBlockers
      }
    }));

    setAnalytics({
      subcontractorMetrics: {
        totalContractors: contractors.length,
        avgResolutionTime: contractors.reduce((sum, c) => sum + c.avgResolutionTime, 0) / contractors.length,
        avgResponseTime: contractors.reduce((sum, c) => sum + c.responseTime, 0) / contractors.length,
        avgSuccessRate: contractors.reduce((sum, c) => sum + (c.resolvedBlockers / c.totalBlockers), 0) / contractors.length * 100,
        totalBlockersHandled: contractors.reduce((sum, c) => sum + c.totalBlockers, 0),
        topPerformer: contractors.reduce((best, current) =>
          current.performanceScore > best.performanceScore ? current : best
        )
      },
      resolutionTimes,
      blockerVolume,
      successRates,
      responseTrends,
      performanceComparison
    });

    setLoading(false);
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-yellow-100 text-yellow-800';
    if (score >= 70) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Contractors</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.subcontractorMetrics.totalContractors}</p>
          </div>
          <UserGroupIcon className="h-8 w-8 text-construction-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Avg Resolution Time</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.subcontractorMetrics.avgResolutionTime?.toFixed(1)}d</p>
          </div>
          <ClockIcon className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Avg Success Rate</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.subcontractorMetrics.avgSuccessRate?.toFixed(1)}%</p>
          </div>
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Blockers</p>
            <p className="text-3xl font-bold text-slate-900">{analytics.subcontractorMetrics.totalBlockersHandled}</p>
          </div>
          <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
        </div>
      </div>
    </div>
  );

  const renderResolutionTimesChart = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Resolution Times by Contractor</h3>
      <div className="space-y-4">
        {analytics.resolutionTimes.map((contractor) => (
          <div key={contractor.contractorName} className="border-b border-slate-100 pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">{contractor.contractorName}</p>
                <p className="text-sm text-slate-600 capitalize">{contractor.tradeType}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{contractor.avgTime.toFixed(1)} days</p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-construction-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((contractor.avgTime / 5) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex space-x-2 mt-2">
              {contractor.monthlyTrend.map((month, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className="text-xs text-slate-500">{month.month}</div>
                  <div className="text-xs font-medium">{month.time.toFixed(1)}d</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBlockerVolumeChart = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Blocker Volume by Contractor</h3>
      <div className="space-y-6">
        {analytics.blockerVolume.map((contractor) => (
          <div key={contractor.contractorName} className="border-b border-slate-100 pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-slate-900">{contractor.contractorName}</p>
                <p className="text-sm text-slate-600 capitalize">{contractor.tradeType}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{contractor.total} total</p>
                <p className="text-sm text-green-600">{contractor.resolved} resolved</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center">
                <div className="w-full bg-red-200 rounded h-2 mb-1">
                  <div
                    className="bg-red-600 h-2 rounded"
                    style={{ width: `${(contractor.critical / contractor.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">Critical: {contractor.critical}</p>
              </div>
              <div className="text-center">
                <div className="w-full bg-orange-200 rounded h-2 mb-1">
                  <div
                    className="bg-orange-600 h-2 rounded"
                    style={{ width: `${(contractor.high / contractor.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">High: {contractor.high}</p>
              </div>
              <div className="text-center">
                <div className="w-full bg-yellow-200 rounded h-2 mb-1">
                  <div
                    className="bg-yellow-600 h-2 rounded"
                    style={{ width: `${(contractor.medium / contractor.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">Medium: {contractor.medium}</p>
              </div>
              <div className="text-center">
                <div className="w-full bg-green-200 rounded h-2 mb-1">
                  <div
                    className="bg-green-600 h-2 rounded"
                    style={{ width: `${(contractor.low / contractor.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600">Low: {contractor.low}</p>
              </div>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${(contractor.resolved / contractor.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Resolution Rate: {((contractor.resolved / contractor.total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceComparison = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-900">Contractor</th>
              <th className="text-left py-3 px-4 font-medium text-slate-900">Trade</th>
              <th className="text-center py-3 px-4 font-medium text-slate-900">Resolution Time</th>
              <th className="text-center py-3 px-4 font-medium text-slate-900">Response Time</th>
              <th className="text-center py-3 px-4 font-medium text-slate-900">Success Rate</th>
              <th className="text-center py-3 px-4 font-medium text-slate-900">Quality Rating</th>
              <th className="text-center py-3 px-4 font-medium text-slate-900">Performance Score</th>
            </tr>
          </thead>
          <tbody>
            {analytics.performanceComparison
              .sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore)
              .map((contractor, index) => (
                <tr key={contractor.contractorName} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900">{contractor.contractorName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">{contractor.tradeType}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium">{contractor.metrics.resolutionTime.toFixed(1)}d</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium">{contractor.metrics.responseTime.toFixed(1)}h</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium">{contractor.metrics.successRate.toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-medium">{contractor.metrics.qualityRating.toFixed(1)}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getPerformanceBadge(contractor.metrics.performanceScore)
                    }`}>
                      {contractor.metrics.performanceScore}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construction-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subcontractor Performance Analytics</h1>
            <p className="text-slate-600">
              {projectId ? 'Project-specific' : 'Company-wide'} contractor performance metrics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {renderOverviewMetrics()}

      {/* Top Performer Highlight */}
      {analytics.subcontractorMetrics.topPerformer && (
        <div className="bg-gradient-to-r from-construction-50 to-construction-100 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-construction-600 rounded-full flex items-center justify-center">
              <TrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-construction-900">Top Performer</h3>
              <p className="text-construction-800">
                <span className="font-medium">{analytics.subcontractorMetrics.topPerformer.name}</span> -
                Performance Score: {analytics.subcontractorMetrics.topPerformer.performanceScore}
              </p>
              <p className="text-sm text-construction-700">
                {analytics.subcontractorMetrics.topPerformer.resolvedBlockers} resolved out of {analytics.subcontractorMetrics.topPerformer.totalBlockers} total blockers
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Analytics */}
      {renderResolutionTimesChart()}
      {renderBlockerVolumeChart()}
      {renderPerformanceComparison()}
    </div>
  );
};

export default SubcontractorPerformanceAnalytics;