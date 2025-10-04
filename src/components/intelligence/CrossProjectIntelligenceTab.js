import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import crossProjectIntelligenceAPI from '../../lib/crossProjectIntelligenceAPI';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  FireIcon,
  TrophyIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

const CrossProjectIntelligenceTab = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [recurringIssues, setRecurringIssues] = useState([]);
  const [designFlaws, setDesignFlaws] = useState([]);
  const [bestPractices, setBestPractices] = useState([]);
  const [successPatterns, setSuccessPatterns] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [tradePerformance, setTradePerformance] = useState([]);
  const [projectBenchmarks, setProjectBenchmarks] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    minOccurrences: '',
    timeframe: '12'
  });

  useEffect(() => {
    if (user?.user_metadata?.company_id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const companyId = user.user_metadata.company_id;

      const [
        overviewData,
        recurringData,
        designData,
        practicesData,
        patternsData,
        correlationData,
        tradeData,
        benchmarkData
      ] = await Promise.all([
        crossProjectIntelligenceAPI.getDashboardOverview(companyId),
        crossProjectIntelligenceAPI.getRecurringIssues(companyId),
        crossProjectIntelligenceAPI.getDesignFlaws(companyId),
        crossProjectIntelligenceAPI.getBestPractices(companyId),
        crossProjectIntelligenceAPI.getSuccessPatterns(companyId),
        crossProjectIntelligenceAPI.getCorrelationAnalysis(companyId),
        crossProjectIntelligenceAPI.getTradePerformanceAnalysis(companyId),
        crossProjectIntelligenceAPI.getProjectBenchmarks(companyId)
      ]);

      setOverview(overviewData);
      setRecurringIssues(recurringData || []);
      setDesignFlaws(designData || []);
      setBestPractices(practicesData || []);
      setSuccessPatterns(patternsData || []);
      setCorrelations(correlationData || []);
      setTradePerformance(tradeData || []);
      setProjectBenchmarks(benchmarkData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const companyId = user.user_metadata.company_id;
      const exportData = await crossProjectIntelligenceAPI.exportLearningReport(companyId, format);

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

  const renderMetricCard = (title, value, subValue, icon, trend) => {
    const TrendIcon = trend === 'up' ? ArrowTrendingUpIcon :
                    trend === 'down' ? ArrowTrendingDownIcon : MinusIcon;
    const trendColor = trend === 'up' ? 'text-green-500' :
                      trend === 'down' ? 'text-red-500' : 'text-gray-500';

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
          </div>
          <div className="flex items-center space-x-2">
            {React.createElement(icon, { className: "h-8 w-8 text-blue-500" })}
            {trend && <TrendIcon className={`h-5 w-5 ${trendColor}`} />}
          </div>
        </div>
      </div>
    );
  };

  const renderSeverityBadge = (severity) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-yellow-100 text-yellow-800',
      5: 'bg-orange-100 text-orange-800',
      6: 'bg-orange-100 text-orange-800',
      7: 'bg-red-100 text-red-800',
      8: 'bg-red-100 text-red-800',
      9: 'bg-red-100 text-red-800',
      10: 'bg-red-100 text-red-800'
    };

    const severityText = {
      1: 'Very Low', 2: 'Low', 3: 'Low-Med', 4: 'Medium', 5: 'Med-High',
      6: 'High', 7: 'Critical', 8: 'Critical', 9: 'Severe', 10: 'Severe'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[severity] || 'bg-gray-100 text-gray-800'}`}>
        {severityText[severity] || severity}
      </span>
    );
  };

  const renderGradeBadge = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[grade] || 'bg-gray-100 text-gray-800'}`}>
        Grade {grade}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderMetricCard(
          'Projects Analyzed',
          overview?.analyzed_projects || 0,
          'Total company projects',
          ChartBarIcon
        )}
        {renderMetricCard(
          'Critical Issues',
          overview?.critical_recurring_issues || 0,
          'Requiring immediate attention',
          ExclamationTriangleIcon,
          'down'
        )}
        {renderMetricCard(
          'Success Patterns',
          overview?.identified_success_patterns || 0,
          'Proven strategies identified',
          TrophyIcon,
          'up'
        )}
        {renderMetricCard(
          'Best Practices',
          overview?.total_best_practices || 0,
          'Documented and validated',
          LightBulbIcon,
          'up'
        )}
      </div>

      {/* Top Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recurring Issues */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FireIcon className="h-5 w-5 text-red-500 mr-2" />
              Top Recurring Issues
            </h3>
          </div>
          <div className="p-6">
            {recurringIssues.slice(0, 5).map((issue, index) => (
              <div key={issue.issue_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {issue.issue_description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {issue.occurrence_count} occurrences • £{issue.total_cost_impact?.toLocaleString()}
                  </p>
                </div>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  #{index + 1}
                </span>
              </div>
            ))}
            {recurringIssues.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recurring issues identified</p>
            )}
          </div>
        </div>

        {/* Success Correlations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrophyIcon className="h-5 w-5 text-green-500 mr-2" />
              Success Correlations
            </h3>
          </div>
          <div className="p-6">
            {correlations.slice(0, 5).map((correlation, index) => (
              <div key={index} className="py-3 border-b border-gray-100 last:border-b-0">
                <p className="text-sm font-medium text-gray-900">
                  {correlation.factor}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {correlation.insight}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-green-600 font-medium">
                    {correlation.improvement > 0 ? '+' : ''}{correlation.improvement.toFixed(1)}% improvement
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({correlation.confidence}% confidence)
                  </span>
                </div>
              </div>
            ))}
            {correlations.length === 0 && (
              <p className="text-gray-500 text-center py-4">Insufficient data for correlation analysis</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveView('recurring-issues')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              Analyze Issues
            </button>
            <button
              onClick={() => setActiveView('best-practices')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
              View Best Practices
            </button>
            <button
              onClick={() => exportReport('json')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 text-blue-500 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecurringIssues = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="structural">Structural</option>
            <option value="mechanical">Mechanical</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="coordination">Coordination</option>
            <option value="design">Design</option>
          </select>
          <select
            value={filters.minOccurrences}
            onChange={(e) => setFilters({ ...filters, minOccurrences: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Occurrences</option>
            <option value="3">3+ Occurrences</option>
            <option value="5">5+ Occurrences</option>
            <option value="10">10+ Occurrences</option>
          </select>
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recurring Issues Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occurrences
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Root Cause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prevention
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recurringIssues.map((issue) => (
                <tr key={issue.issue_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {issue.issue_description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {issue.issue_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-bold text-red-600">{issue.occurrence_count}</span>
                    <span className="text-gray-500 ml-1">times</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{issue.total_cost_impact?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {issue.root_cause_type || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {issue.prevention_recommendation || 'Needs analysis'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recurringIssues.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No recurring issues found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDesignFlaws = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Design Flaw Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Design Element
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects Affected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Architect Firm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Change
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {designFlaws.map((flaw) => (
                <tr key={flaw.flaw_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {flaw.design_element}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderSeverityBadge(flaw.severity_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flaw.projects_affected?.length || 0} projects
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    £{flaw.typical_cost_impact?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flaw.architect_firm || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {flaw.recommended_design_change || 'Under review'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {designFlaws.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No design flaws identified</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBestPractices = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Best Practices Library</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestPractices.map((practice) => (
              <div key={practice.practice_id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {practice.category}
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    +{practice.success_rate_improvement}%
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {practice.practice_description}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Time Saved:</span> {practice.average_time_saved} days
                  </p>
                  <p>
                    <span className="font-medium">Blocker Reduction:</span> {practice.blocker_reduction_percentage}%
                  </p>
                  <p>
                    <span className="font-medium">Projects:</span> {practice.projects_implemented?.length || 0}
                  </p>
                </div>
                {practice.implementation_guide && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">{practice.implementation_guide}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {bestPractices.length === 0 && (
            <div className="text-center py-12">
              <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500">No best practices documented yet</p>
              <p className="text-sm text-gray-400">Best practices will appear as more projects are completed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProjectBenchmarks = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Project Performance Benchmarks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Blockers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Resolution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blocker Density
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Impact %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectBenchmarks.map((benchmark) => (
                <tr key={benchmark.benchmark_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {benchmark.project?.name || 'Unknown Project'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {benchmark.project?.architect_firm}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderGradeBadge(benchmark.performance_grade)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {benchmark.total_blockers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {benchmark.average_resolution_time?.toFixed(1)} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {benchmark.blocker_density?.toFixed(2)} per £1M
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {benchmark.cost_impact_percentage?.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${benchmark.quality_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{benchmark.quality_score}/100</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectBenchmarks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No project benchmarks available</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Distribution */}
      {projectBenchmarks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Grade Distribution</h3>
          <div className="grid grid-cols-5 gap-4">
            {['A', 'B', 'C', 'D', 'F'].map(grade => {
              const count = projectBenchmarks.filter(p => p.performance_grade === grade).length;
              const percentage = projectBenchmarks.length > 0 ? (count / projectBenchmarks.length * 100).toFixed(1) : 0;
              return (
                <div key={grade} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500">Grade {grade}</div>
                  <div className="text-xs text-gray-400">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'recurring-issues', label: 'Recurring Issues', icon: ExclamationTriangleIcon },
    { id: 'design-flaws', label: 'Design Flaws', icon: CogIcon },
    { id: 'best-practices', label: 'Best Practices', icon: LightBulbIcon },
    { id: 'benchmarks', label: 'Project Benchmarks', icon: TrophyIcon }
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
          <h2 className="text-2xl font-bold text-gray-900">Cross-Project Intelligence</h2>
          <p className="text-gray-600">Identify patterns and drive organizational learning across all projects</p>
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
            onClick={() => exportReport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
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
      {activeView === 'recurring-issues' && renderRecurringIssues()}
      {activeView === 'design-flaws' && renderDesignFlaws()}
      {activeView === 'best-practices' && renderBestPractices()}
      {activeView === 'benchmarks' && renderProjectBenchmarks()}
    </div>
  );
};

export default CrossProjectIntelligenceTab;