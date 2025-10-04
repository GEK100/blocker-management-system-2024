import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  BellIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  LightBulbIcon,
  FlagIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import riskIntelligenceAPI from '../../lib/riskIntelligenceAPI';

const PredictiveRiskIntelligenceTab = ({ companyId, selectedProject }) => {
  const [loading, setLoading] = useState(true);
  const [companyStats, setCompanyStats] = useState(null);
  const [projectHealth, setProjectHealth] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [riskIndicators, setRiskIndicators] = useState([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState([]);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [patternAnalysis, setPatternAnalysis] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadRiskIntelligenceData();
    }
  }, [companyId, selectedProject]);

  const loadRiskIntelligenceData = async () => {
    try {
      setLoading(true);

      // Load company-wide statistics
      const statsResult = await riskIntelligenceAPI.getCompanyRiskStatistics(companyId);
      if (statsResult.success) {
        setCompanyStats(statsResult.data);
      }

      // If a specific project is selected, load project-specific data
      if (selectedProject?.project_id) {
        const [healthResult, historyResult, indicatorsResult, alertsResult, similarResult, patternResult] = await Promise.all([
          riskIntelligenceAPI.getProjectHealthScore(selectedProject.project_id),
          riskIntelligenceAPI.getProjectHealthHistory(selectedProject.project_id, 84), // 12 weeks
          riskIntelligenceAPI.getActiveRiskIndicators(selectedProject.project_id),
          riskIntelligenceAPI.getPredictiveAlerts(selectedProject.project_id),
          riskIntelligenceAPI.getSimilarProjectComparisons(selectedProject.project_id),
          riskIntelligenceAPI.generateRiskPatternAnalysis(selectedProject.project_id)
        ]);

        if (healthResult.success) setProjectHealth(healthResult.data);
        if (historyResult.success) setHealthHistory(historyResult.data);
        if (indicatorsResult.success) setRiskIndicators(indicatorsResult.data);
        if (alertsResult.success) setPredictiveAlerts(alertsResult.data);
        if (similarResult.success) setSimilarProjects(similarResult.data);
        if (patternResult.success) setPatternAnalysis(patternResult.data);
      }
    } catch (error) {
      console.error('Error loading risk intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeIndicator = async (indicatorId) => {
    try {
      const result = await riskIntelligenceAPI.acknowledgeRiskIndicator(indicatorId, 'current-user-id');
      if (result.success) {
        await loadRiskIntelligenceData();
      }
    } catch (error) {
      console.error('Error acknowledging risk indicator:', error);
    }
  };

  const handleResolveIndicator = async (indicatorId) => {
    try {
      const result = await riskIntelligenceAPI.resolveRiskIndicator(indicatorId);
      if (result.success) {
        await loadRiskIntelligenceData();
      }
    } catch (error) {
      console.error('Error resolving risk indicator:', error);
    }
  };

  const handleExportRiskReport = async () => {
    if (!selectedProject?.project_id) {
      alert('Please select a project to export report');
      return;
    }

    try {
      const result = await riskIntelligenceAPI.exportRiskReport(selectedProject.project_id, 'text');
      if (result.success) {
        // Create downloadable file
        const blob = new Blob([result.data], { type: result.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'risk_report.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting risk report:', error);
      alert('Error exporting report: ' + error.message);
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskLevelBadge = (riskLevel) => {
    const config = {
      low: { bg: 'bg-green-100', text: 'text-green-800', icon: ShieldCheckIcon },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', icon: ShieldExclamationIcon },
      critical: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon }
    };

    const style = config[riskLevel] || config.medium;
    const IconComponent = style.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {riskLevel?.toUpperCase()}
      </span>
    );
  };

  const renderHealthScoreGauge = (score, size = 'large') => {
    const radius = size === 'large' ? 45 : 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={`relative ${size === 'large' ? 'w-32 h-32' : 'w-20 h-20'}`}>
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${size === 'large' ? 'text-2xl' : 'text-lg'} font-bold ${getHealthScoreColor(score)}`}>
              {score}
            </div>
            <div className={`${size === 'large' ? 'text-sm' : 'text-xs'} text-gray-500`}>
              Health
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
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Projects at Risk</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.projectsAtRisk}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Projects</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.criticalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{companyStats.totalActiveAlerts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Health Section - Only if project selected */}
      {selectedProject && projectHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Project Health: {selectedProject.project_name}
            </h3>
            <button
              onClick={handleExportRiskReport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score Gauge */}
            <div className="text-center">
              {renderHealthScoreGauge(projectHealth.overall_health_score)}
              <div className="mt-4">
                {getRiskLevelBadge(projectHealth.risk_level)}
                <p className="text-sm text-gray-500 mt-1">
                  Confidence: {projectHealth.prediction_confidence?.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Component Scores */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Component Scores</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Blocker Velocity</span>
                  <span className={`text-sm font-medium ${getHealthScoreColor(projectHealth.blocker_velocity_score)}`}>
                    {projectHealth.blocker_velocity_score}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Resolution Trend</span>
                  <span className={`text-sm font-medium ${getHealthScoreColor(projectHealth.resolution_trend_score)}`}>
                    {projectHealth.resolution_trend_score}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Critical Blockers</span>
                  <span className={`text-sm font-medium ${getHealthScoreColor(projectHealth.critical_blocker_score)}`}>
                    {projectHealth.critical_blocker_score}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Repeat Issues</span>
                  <span className={`text-sm font-medium ${getHealthScoreColor(projectHealth.repeat_issue_score)}`}>
                    {projectHealth.repeat_issue_score}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Quick Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Risks</span>
                  <span className="text-sm font-bold text-gray-900">{riskIndicators.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Alerts</span>
                  <span className="text-sm font-bold text-gray-900">{predictiveAlerts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Predicted Delay</span>
                  <span className="text-sm font-bold text-gray-900">
                    {projectHealth.predicted_delay_days || 0} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects at Risk Table */}
      {companyStats?.projects && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Projects Ranked by Risk</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Risks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alerts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companyStats.projects
                  .sort((a, b) => (a.overall_health_score || 0) - (b.overall_health_score || 0))
                  .slice(0, 10)
                  .map((project) => (
                    <tr key={project.project_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Project {project.project_id?.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {renderHealthScoreGauge(project.overall_health_score || 0, 'small')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskLevelBadge(project.risk_level || 'low')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.active_risk_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.active_alert_count || 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderRiskIndicators = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Active Risk Indicators
          {selectedProject && ` - ${selectedProject.project_name}`}
        </h3>
        <span className="text-sm text-gray-500">{riskIndicators.length} active</span>
      </div>

      {riskIndicators.length === 0 ? (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Risk Indicators</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedProject
              ? 'This project shows no active risk indicators at this time.'
              : 'Select a project to view its risk indicators.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {riskIndicators.map((indicator) => (
            <div key={indicator.indicator_id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{indicator.title}</h4>
                    {getRiskLevelBadge(indicator.risk_level)}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Severity: {indicator.severity}/10
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">{indicator.description}</p>

                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-start">
                      <LightBulbIcon className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-medium text-blue-900">Recommendation</h5>
                        <p className="text-sm text-blue-700">{indicator.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <CalendarDaysIcon className="w-4 h-4 mr-1" />
                    Detected: {new Date(indicator.detected_date).toLocaleDateString()}
                    {indicator.confidence_score && (
                      <>
                        <span className="mx-2">•</span>
                        Confidence: {indicator.confidence_score.toFixed(1)}%
                      </>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedIndicator(indicator);
                      setShowIndicatorModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {!indicator.acknowledged_by && (
                    <button
                      onClick={() => handleAcknowledgeIndicator(indicator.indicator_id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Acknowledge"
                    >
                      <FlagIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleResolveIndicator(indicator.indicator_id)}
                    className="text-green-600 hover:text-green-900"
                    title="Mark Resolved"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHealthTrend = () => {
    if (!selectedProject || healthHistory.length === 0) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Health History</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedProject
              ? 'No health score history available for this project.'
              : 'Select a project to view its health trend.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Health Trend - {selectedProject.project_name}
        </h3>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Simple trend visualization */}
            <div className="h-64 flex items-end space-x-1">
              {healthHistory.slice(-12).map((score, index) => {
                const height = (score.overall_health_score / 100) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${getHealthScoreBgColor(score.overall_health_score)} border-2 ${
                        score.overall_health_score >= 70 ? 'border-green-300' :
                        score.overall_health_score >= 40 ? 'border-yellow-300' : 'border-red-300'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${score.overall_health_score}/100 on ${new Date(score.score_date).toLocaleDateString()}`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-top-left">
                      {new Date(score.score_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 border border-green-300 rounded mr-2"></div>
                <span>Healthy (70+)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded mr-2"></div>
                <span>At Risk (40-69)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 border border-red-300 rounded mr-2"></div>
                <span>Critical (&lt;40)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Analysis */}
        {patternAnalysis && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Pattern Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Blocker Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Blockers (90d):</span>
                    <span className="font-medium">{patternAnalysis.totalBlockers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Resolution:</span>
                    <span className="font-medium">{patternAnalysis.averageResolutionTime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Critical %:</span>
                    <span className="font-medium">{patternAnalysis.criticalBlockerPercentage}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Risk Assessment</h5>
                <div className="space-y-2">
                  {getRiskLevelBadge(patternAnalysis.insights.riskLevel)}
                  <p className="text-sm text-gray-600 mt-2">
                    Most Common: {patternAnalysis.mostCommonCategory}
                  </p>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                <div className="space-y-2">
                  {patternAnalysis.insights.recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index} className="text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        rec.priority === 'critical' ? 'bg-red-400' :
                        rec.priority === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
                      }`}></span>
                      {rec.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Predictive Risk Intelligence</h2>
          <p className="text-sm text-gray-600">
            AI-powered risk analysis and early warning system for project management
          </p>
        </div>
        {companyStats && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{companyStats.averageHealthScore}</div>
            <div className="text-sm text-gray-600">Avg Health Score</div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'indicators', label: 'Risk Indicators', icon: ExclamationTriangleIcon },
            { id: 'trends', label: 'Health Trends', icon: ArrowTrendingUpIcon }
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'indicators' && renderRiskIndicators()}
        {selectedView === 'trends' && renderHealthTrend()}
      </div>

      {/* Risk Indicator Details Modal */}
      {showIndicatorModal && selectedIndicator && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Risk Indicator Details</h3>
              <button
                onClick={() => setShowIndicatorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedIndicator.title}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  {getRiskLevelBadge(selectedIndicator.risk_level)}
                  <span className="text-sm text-gray-500">
                    Severity: {selectedIndicator.severity}/10
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900">Description</h5>
                <p className="text-sm text-gray-600 mt-1">{selectedIndicator.description}</p>
              </div>

              <div>
                <h5 className="font-medium text-gray-900">Recommendation</h5>
                <p className="text-sm text-gray-600 mt-1">{selectedIndicator.recommendation}</p>
              </div>

              {selectedIndicator.impact_assessment && (
                <div>
                  <h5 className="font-medium text-gray-900">Impact Assessment</h5>
                  <p className="text-sm text-gray-600 mt-1">{selectedIndicator.impact_assessment}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Detected:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedIndicator.detected_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {selectedIndicator.confidence_score?.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowIndicatorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleAcknowledgeIndicator(selectedIndicator.indicator_id);
                    setShowIndicatorModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveRiskIntelligenceTab;