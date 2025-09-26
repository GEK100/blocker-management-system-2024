import React, { useState, useEffect } from 'react';
import { subcontractorAPI } from '../../lib/subcontractorAPI';
import SubcontractorPerformanceAnalytics from './SubcontractorPerformanceAnalytics';
import Button from '../../design-system/components/Button';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MapPinIcon,
  ArrowLeftIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

const ProjectAnalyticsDashboard = ({ project, onBack, companyId }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [showSubcontractorAnalytics, setShowSubcontractorAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState({
    projectMetrics: {
      totalBlockers: 0,
      resolvedBlockers: 0,
      avgResolutionTime: 0,
      criticalBlockers: 0,
      overdueBlockers: 0
    },
    blockerTrends: [],
    resolutionRatesByContractor: [],
    problemAreasByLocation: [],
    blockerTypesBreakdown: [],
    responseTimes: []
  });

  useEffect(() => {
    generateProjectAnalytics();
  }, [project, timeRange]);

  const generateProjectAnalytics = async () => {
    setLoading(true);
    try {
      // Get subcontractors for this project
      const result = await subcontractorAPI.getSubcontractors(companyId);
      const projectSubcontractors = result.success ?
        result.subcontractors.filter(sub =>
          sub.project_access && sub.project_access.includes(project.id)
        ) : [];

      // Generate mock analytics data for the specific project
      const projectMetrics = {
        totalBlockers: 15 + Math.floor(Math.random() * 25),
        resolvedBlockers: 8 + Math.floor(Math.random() * 15),
        avgResolutionTime: 32 + Math.random() * 24,
        criticalBlockers: 2 + Math.floor(Math.random() * 4),
        overdueBlockers: 1 + Math.floor(Math.random() * 3)
      };

      // Generate blocker trends over time (based on time range)
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const blockerTrends = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          dateLabel: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          created: Math.floor(Math.random() * 3) + 1,
          resolved: Math.floor(Math.random() * 2) + 1,
          active: Math.floor(Math.random() * 5) + 2
        };
      });

      // Generate resolution rates by contractor
      const resolutionRatesByContractor = projectSubcontractors.slice(0, 6).map((sub, index) => ({
        contractor: sub.name,
        company: sub.company_name || sub.companyName,
        tradeType: sub.trade_type || sub.tradeType,
        assigned: 5 + Math.floor(Math.random() * 10),
        resolved: 3 + Math.floor(Math.random() * 8),
        avgTime: 24 + (index * 8) + Math.random() * 16,
        efficiency: 75 + Math.random() * 25,
        onTimeRate: 80 + Math.random() * 20
      })).map(contractor => ({
        ...contractor,
        resolutionRate: ((contractor.resolved / contractor.assigned) * 100).toFixed(1)
      }));

      // Generate problem areas by location/floor
      const floors = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement', 'Rooftop'];
      const problemAreasByLocation = floors.map(floor => ({
        location: floor,
        totalIssues: Math.floor(Math.random() * 8) + 1,
        resolvedIssues: Math.floor(Math.random() * 5) + 1,
        avgResolutionTime: 20 + Math.random() * 40,
        severityDistribution: {
          critical: Math.floor(Math.random() * 2),
          high: Math.floor(Math.random() * 3) + 1,
          medium: Math.floor(Math.random() * 4) + 1,
          low: Math.floor(Math.random() * 3) + 1
        }
      })).sort((a, b) => b.totalIssues - a.totalIssues);

      // Generate blocker types breakdown
      const blockerTypes = [
        { name: 'Electrical', count: Math.floor(Math.random() * 8) + 2, color: '#f59e0b' },
        { name: 'Plumbing', count: Math.floor(Math.random() * 6) + 2, color: '#3b82f6' },
        { name: 'HVAC', count: Math.floor(Math.random() * 5) + 1, color: '#10b981' },
        { name: 'Structural', count: Math.floor(Math.random() * 4) + 1, color: '#ef4444' },
        { name: 'Safety', count: Math.floor(Math.random() * 3) + 1, color: '#8b5cf6' },
        { name: 'Other', count: Math.floor(Math.random() * 3) + 1, color: '#6b7280' }
      ];

      // Generate response times
      const responseTimes = {
        avgFirstResponse: 2.5 + Math.random() * 3,
        avgAssignment: 4 + Math.random() * 4,
        avgResolution: projectMetrics.avgResolutionTime,
        slaCompliance: 85 + Math.random() * 15
      };

      setAnalytics({
        projectMetrics,
        blockerTrends,
        resolutionRatesByContractor,
        problemAreasByLocation,
        blockerTypesBreakdown: blockerTypes,
        responseTimes
      });
    } catch (error) {
      console.error('Error generating project analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">Total Blockers</p>
            <p className="text-xl font-bold text-slate-900">{analytics.projectMetrics.totalBlockers}</p>
          </div>
          <ChartBarIcon className="h-6 w-6 text-construction-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">Resolved</p>
            <p className="text-xl font-bold text-green-600">{analytics.projectMetrics.resolvedBlockers}</p>
            <p className="text-xs text-slate-500">
              {Math.round((analytics.projectMetrics.resolvedBlockers / analytics.projectMetrics.totalBlockers) * 100)}% rate
            </p>
          </div>
          <TrendingUpIcon className="h-6 w-6 text-green-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">Avg Resolution</p>
            <p className="text-xl font-bold text-slate-900">{Math.round(analytics.projectMetrics.avgResolutionTime)}h</p>
          </div>
          <ClockIcon className="h-6 w-6 text-construction-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">Critical</p>
            <p className="text-xl font-bold text-red-600">{analytics.projectMetrics.criticalBlockers}</p>
          </div>
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">Overdue</p>
            <p className="text-xl font-bold text-yellow-600">{analytics.projectMetrics.overdueBlockers}</p>
          </div>
          <TrendingDownIcon className="h-6 w-6 text-yellow-600" />
        </div>
      </Card>
    </div>
  );

  const renderBlockerTrends = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-slate-900">Blocker Trends</h4>
        <div className="flex space-x-2">
          {['7days', '30days', '90days'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-construction-100 text-construction-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Simple trend chart */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Date</span>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Created</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Resolved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Active</span>
            </div>
          </div>
        </div>

        {analytics.blockerTrends.slice(-10).map((day, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm font-medium text-slate-700">{day.dateLabel}</span>
            <div className="flex space-x-6">
              <span className="text-sm text-red-600 w-12 text-center">{day.created}</span>
              <span className="text-sm text-green-600 w-12 text-center">{day.resolved}</span>
              <span className="text-sm text-blue-600 w-12 text-center">{day.active}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderResolutionRates = () => (
    <Card className="p-6">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Resolution Rates by Subcontractor</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contractor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Resolved</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {analytics.resolutionRatesByContractor.map((contractor, index) => (
              <tr key={index}>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{contractor.contractor}</div>
                    <div className="text-sm text-slate-500">{contractor.company}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="construction" size="sm">{contractor.tradeType}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">{contractor.assigned}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{contractor.resolved}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${
                    contractor.resolutionRate > 80 ? 'text-green-600' :
                    contractor.resolutionRate > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {contractor.resolutionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {Math.round(contractor.avgTime)}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderProblemAreas = () => (
    <Card className="p-6">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Problem Areas by Location</h4>
      <div className="space-y-4">
        {analytics.problemAreasByLocation.map((area, index) => {
          const resolutionRate = ((area.resolvedIssues / area.totalIssues) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <MapPinIcon className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="text-sm font-medium text-slate-900">{area.location}</div>
                  <div className="text-sm text-slate-600">
                    {area.totalIssues} total issues • {area.resolvedIssues} resolved ({resolutionRate}%)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {Math.round(area.avgResolutionTime)}h avg
                </div>
                <div className="flex space-x-1 mt-1">
                  {area.severityDistribution.critical > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {area.severityDistribution.critical} critical
                    </span>
                  )}
                  {area.severityDistribution.high > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {area.severityDistribution.high} high
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const renderBlockerTypes = () => (
    <Card className="p-6">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Blocker Types Breakdown</h4>
      <div className="space-y-3">
        {analytics.blockerTypesBreakdown.map((type, index) => {
          const totalBlockers = analytics.blockerTypesBreakdown.reduce((sum, t) => sum + t.count, 0);
          const percentage = ((type.count / totalBlockers) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: type.color }}
                ></div>
                <span className="text-sm font-medium text-slate-700">{type.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">{type.count} issues</span>
                <span className="text-xs text-slate-500 w-12 text-right">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const renderResponseTimes = () => (
    <Card className="p-6">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Response Times</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-construction-600">
            {analytics.responseTimes.avgFirstResponse?.toFixed(1)}h
          </div>
          <div className="text-sm text-slate-600">First Response</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.responseTimes.avgAssignment?.toFixed(1)}h
          </div>
          <div className="text-sm text-slate-600">Assignment</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(analytics.responseTimes.avgResolution)}h
          </div>
          <div className="text-sm text-slate-600">Resolution</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.responseTimes.slaCompliance?.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-600">SLA Compliance</div>
        </div>
      </div>
    </Card>
  );

  if (showSubcontractorAnalytics) {
    return (
      <SubcontractorPerformanceAnalytics
        companyId={companyId}
        projectId={project.id}
        onBack={() => setShowSubcontractorAnalytics(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div className="animate-pulse h-8 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{project.name} Analytics</h3>
            <div className="flex items-center space-x-4 mt-1">
              <Badge variant="construction" size="sm">{project.status}</Badge>
              <span className="text-sm text-slate-600">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
          </select>

          <Button
            onClick={() => setShowSubcontractorAnalytics(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <UserGroupIcon className="h-4 w-4" />
            <span>Contractor Performance</span>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {renderMetricsOverview()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBlockerTrends()}
        {renderBlockerTypes()}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderProblemAreas()}
        {renderResponseTimes()}
      </div>

      {/* Resolution Rates Table */}
      {renderResolutionRates()}
    </div>
  );
};

export default ProjectAnalyticsDashboard;