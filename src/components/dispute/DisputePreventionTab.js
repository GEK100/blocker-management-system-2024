import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../../hooks/useSmartAuth';
import disputePreventionAPI from '../../lib/disputePreventionAPI';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ShieldExclamationIcon,
  BellAlertIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ScaleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const DisputePreventionTab = ({ companyId }) => {
  const { user, userProfile, companyId: authCompanyId } = useSmartAuth();
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [disputeRisks, setDisputeRisks] = useState([]);
  const [contractualDeadlines, setContractualDeadlines] = useState([]);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [evidencePackages, setEvidencePackages] = useState([]);
  const [communicationData, setCommunicationData] = useState([]);
  const [filters, setFilters] = useState({
    riskLevel: '',
    disputeType: '',
    projectId: '',
    status: 'active',
    timeframe: '30'
  });

  useEffect(() => {
    const currentCompanyId = companyId || authCompanyId || userProfile?.company_id || user?.user_metadata?.company_id;
    if (currentCompanyId) {
      loadDashboardData();
    }
  }, [user, userProfile, companyId, authCompanyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const currentCompanyId = companyId || authCompanyId || userProfile?.company_id || user?.user_metadata?.company_id || 'demo-company';

      const [
        overviewData,
        risksData,
        deadlinesData,
        warningsData,
        evidenceData,
        commData
      ] = await Promise.all([
        disputePreventionAPI.getDashboardOverview(currentCompanyId),
        disputePreventionAPI.getDisputeRisks(currentCompanyId, filters),
        disputePreventionAPI.getContractualDeadlines(currentCompanyId, { status: 'pending' }),
        disputePreventionAPI.getEarlyWarnings(currentCompanyId, { recent: true }),
        disputePreventionAPI.getEvidencePackages(currentCompanyId),
        disputePreventionAPI.getCommunicationMonitoring(currentCompanyId, { recent: true })
      ]);

      setOverview(overviewData);
      setDisputeRisks(risksData || []);
      setContractualDeadlines(deadlinesData || []);
      setEarlyWarnings(warningsData || []);
      setEvidencePackages(evidenceData || []);
      setCommunicationData(commData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeWarning = async (warningId, actionTaken) => {
    try {
      await disputePreventionAPI.acknowledgeEarlyWarning(warningId, actionTaken);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging warning:', error);
    }
  };

  const generateEvidencePackage = async (disputeRiskId) => {
    try {
      await disputePreventionAPI.generateEvidencePackage(disputeRiskId);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error generating evidence package:', error);
    }
  };

  const exportReport = async (format) => {
    try {
      const companyId = user.user_metadata.company_id;
      const exportData = await disputePreventionAPI.exportDisputePreventionReport(companyId, format);

      const blob = new Blob([exportData.data], { type: exportData.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (daysRemaining) => {
    if (daysRemaining < 0) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 1) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 3) return 'bg-orange-100 text-orange-800';
    if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityColor = (severity) => {
    if (severity >= 5) return 'bg-red-100 text-red-800';
    if (severity >= 4) return 'bg-orange-100 text-orange-800';
    if (severity >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const renderMetricCard = (title, value, subValue, icon, color = 'blue') => {
    const colorClasses = {
      blue: 'text-blue-500',
      red: 'text-red-500',
      green: 'text-green-500',
      orange: 'text-orange-500',
      yellow: 'text-yellow-500'
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
          </div>
          {React.createElement(icon, { className: `h-8 w-8 ${colorClasses[color]}` })}
        </div>
      </div>
    );
  };

  const renderRiskScoreGauge = (score) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getScoreColor = (score) => {
      if (score >= 80) return '#dc2626'; // red
      if (score >= 60) return '#ea580c'; // orange
      if (score >= 40) return '#ca8a04'; // yellow
      return '#16a34a'; // green
    };

    return (
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={getScoreColor(score)}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Active Risks',
          overview?.active_dispute_risks || 0,
          'Disputes being monitored',
          ExclamationTriangleIcon,
          'red'
        )}
        {renderMetricCard(
          'Critical Risks',
          overview?.critical_risks || 0,
          'Requiring immediate action',
          FireIcon,
          'red'
        )}
        {renderMetricCard(
          'Urgent Deadlines',
          overview?.urgent_deadlines || 0,
          'Due within 7 days',
          ClockIcon,
          'orange'
        )}
        {renderMetricCard(
          'Recent Warnings',
          overview?.recent_warnings || 0,
          'Last 30 days',
          BellAlertIcon,
          'yellow'
        )}
      </div>

      {/* Risk Radar and Critical Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispute Risk Radar */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ShieldExclamationIcon className="h-5 w-5 text-red-500 mr-2" />
              Dispute Risk Radar
            </h3>
          </div>
          <div className="p-6">
            {disputeRisks.slice(0, 5).map((risk) => (
              <div key={risk.risk_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {risk.project?.name} - {risk.dispute_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {risk.subcontractor?.company_name || 'Multiple parties'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {renderRiskScoreGauge(risk.risk_score)}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(risk.risk_level)}`}>
                    {risk.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            {disputeRisks.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active dispute risks</p>
            )}
          </div>
        </div>

        {/* Critical Deadlines */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 text-orange-500 mr-2" />
              Critical Deadlines
            </h3>
          </div>
          <div className="p-6">
            {contractualDeadlines.slice(0, 5).map((deadline) => {
              const daysRemaining = Math.ceil((new Date(deadline.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={deadline.deadline_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {deadline.deadline_type.replace('_', ' ')} - {deadline.project?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(deadline.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(daysRemaining)}`}>
                    {daysRemaining < 0 ? 'OVERDUE' : `${daysRemaining} days`}
                  </span>
                </div>
              );
            })}
            {contractualDeadlines.length === 0 && (
              <p className="text-gray-500 text-center py-4">No critical deadlines</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Warnings and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Early Warnings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BellAlertIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Recent Early Warnings
            </h3>
          </div>
          <div className="p-6">
            {earlyWarnings.slice(0, 5).map((warning) => (
              <div key={warning.warning_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {warning.warning_type.replace('_', ' ')} - {warning.project?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(warning.detection_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                    Level {warning.severity}
                  </span>
                  {!warning.acknowledged_by && (
                    <button
                      onClick={() => acknowledgeWarning(warning.warning_id, 'Acknowledged from dashboard')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {earlyWarnings.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent warnings</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={() => setActiveView('risk-analysis')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ChartBarIcon className="h-5 w-5 text-red-500 mr-2" />
                Analyze Dispute Risks
              </button>
              <button
                onClick={() => setActiveView('deadlines')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
                Check Deadlines
              </button>
              <button
                onClick={() => setActiveView('evidence')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FolderIcon className="h-5 w-5 text-blue-500 mr-2" />
                Review Evidence
              </button>
              <button
                onClick={() => exportReport('legal')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-5 w-5 text-green-500 mr-2" />
                Export Legal Package
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskAnalysis = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Dispute Risks</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.disputeType}
            onChange={(e) => setFilters({ ...filters, disputeType: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Dispute Types</option>
            <option value="payment">Payment</option>
            <option value="delay">Delay</option>
            <option value="quality">Quality</option>
            <option value="scope">Scope</option>
            <option value="variation">Variation</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Risk Analysis Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Dispute Risk Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project / Subcontractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispute Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Escalation Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disputeRisks.map((risk) => (
                <tr key={risk.risk_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {risk.project?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {risk.subcontractor?.company_name || 'Multiple parties'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderRiskScoreGauge(risk.risk_score)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {risk.dispute_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(risk.risk_level)}`}>
                      {risk.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.escalation_stage.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{risk.estimated_value?.toLocaleString() || 'TBD'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => generateEvidencePackage(risk.risk_id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Generate Evidence
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {disputeRisks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No dispute risks found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDeadlines = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Contractual Deadline Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Clause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contractualDeadlines.map((deadline) => {
                const daysRemaining = Math.ceil((new Date(deadline.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={deadline.deadline_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {deadline.project?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {deadline.deadline_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(deadline.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(daysRemaining)}`}>
                        {daysRemaining < 0 ? 'OVERDUE' : `${daysRemaining} days`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deadline.contract_clause_reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deadline.responsible_party || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deadline.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : deadline.status === 'met' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {deadline.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {contractualDeadlines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No active contractual deadlines</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEarlyWarnings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Early Warning System</h3>
        </div>
        <div className="p-6">
          {earlyWarnings.map((warning) => (
            <div key={warning.warning_id} className="border border-gray-200 rounded-lg p-6 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                      Severity {warning.severity}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {warning.warning_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {warning.project?.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Detected: {new Date(warning.detection_date).toLocaleDateString()}
                  </p>
                  {warning.recommended_actions && warning.recommended_actions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {warning.recommended_actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {warning.days_to_critical && (
                    <p className="text-sm text-orange-600 font-medium">
                      Estimated {warning.days_to_critical} days until critical escalation
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!warning.acknowledged_by ? (
                    <button
                      onClick={() => acknowledgeWarning(warning.warning_id, 'Acknowledged - action taken')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Acknowledge
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100">
                      <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {earlyWarnings.length === 0 && (
            <div className="text-center py-12">
              <BellAlertIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No early warnings detected</p>
              <p className="text-sm text-gray-400">This is good - your projects are running smoothly</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Evidence Package Management</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evidencePackages.map((pkg) => (
              <div key={pkg.package_id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {pkg.evidence_type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center">
                    <div className="w-12 h-12">
                      {renderRiskScoreGauge(pkg.legal_readiness_score)}
                    </div>
                  </div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {pkg.package_name}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Project: {pkg.dispute_risk?.project?.name || 'Unknown'}
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Blockers:</span> {pkg.blocker_ids?.length || 0}
                  </p>
                  <p>
                    <span className="font-medium">Photos:</span> {pkg.photo_references?.length || 0}
                  </p>
                  <p>
                    <span className="font-medium">Documents:</span> {pkg.document_references?.length || 0}
                  </p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-1" />
                    Review
                  </button>
                  <button
                    onClick={() => exportReport('legal')}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            ))}
          </div>
          {evidencePackages.length === 0 && (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No evidence packages compiled</p>
              <p className="text-sm text-gray-400">Evidence packages will be automatically generated when dispute risks are detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: ExclamationTriangleIcon },
    { id: 'deadlines', label: 'Deadlines', icon: ClockIcon },
    { id: 'early-warnings', label: 'Early Warnings', icon: BellAlertIcon },
    { id: 'evidence', label: 'Evidence', icon: FolderIcon }
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispute Prevention & Resolution</h2>
          <p className="text-gray-600">Early warning system and evidence compilation for contractual disputes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportReport('json')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export JSON
          </button>
          <button
            onClick={() => exportReport('legal')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ScaleIcon className="h-4 w-4 mr-2" />
            Legal Package
          </button>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'risk-analysis' && renderRiskAnalysis()}
      {activeView === 'deadlines' && renderDeadlines()}
      {activeView === 'early-warnings' && renderEarlyWarnings()}
      {activeView === 'evidence' && renderEvidence()}
    </div>
  );
};

export default DisputePreventionTab;