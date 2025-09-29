import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import Card from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  TrendingDownIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const LessonsLearnedReport = ({ blockers = [], subcontractors = [], projects = [] }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('last_30_days');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [blockers, subcontractors, selectedTimeframe, selectedProject]);

  const generateReport = () => {
    setLoading(true);

    // Filter blockers based on timeframe
    const now = new Date();
    const timeframeFilters = {
      last_30_days: 30,
      last_90_days: 90,
      last_6_months: 180,
      last_year: 365
    };

    const daysBack = timeframeFilters[selectedTimeframe] || 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    let filteredBlockers = blockers.filter(blocker =>
      new Date(blocker.created_at) >= startDate
    );

    // Filter by project if specific project selected
    if (selectedProject !== 'all') {
      filteredBlockers = filteredBlockers.filter(blocker =>
        blocker.projectId === selectedProject || blocker.project_id === selectedProject
      );
    }

    // 1. Analyze highest volume blocker types
    const blockerTypeAnalysis = analyzeBlockerTypes(filteredBlockers);

    // 2. Analyze resolution times by type and contractor
    const resolutionTimeAnalysis = analyzeResolutionTimes(filteredBlockers);

    // 3. Match problematic areas to responsible contractors
    const contractorPerformanceAnalysis = analyzeContractorPerformance(filteredBlockers, subcontractors);

    // 4. Generate insights and recommendations
    const insights = generateInsights(blockerTypeAnalysis, resolutionTimeAnalysis, contractorPerformanceAnalysis);

    // Get current project info
    const currentProject = selectedProject !== 'all'
      ? projects.find(p => p.id === selectedProject)
      : null;

    // Generate project comparison data if viewing all projects
    const projectComparison = selectedProject === 'all'
      ? generateProjectComparison(blockers, projects, startDate)
      : null;

    setReportData({
      blockerTypeAnalysis,
      resolutionTimeAnalysis,
      contractorPerformanceAnalysis,
      insights,
      projectComparison,
      currentProject,
      totalBlockers: filteredBlockers.length,
      timeframe: selectedTimeframe,
      selectedProject
    });

    setLoading(false);
  };

  const generateProjectComparison = (allBlockers, projects, startDate) => {
    const projectStats = {};

    // Initialize project stats
    projects.forEach(project => {
      projectStats[project.id] = {
        id: project.id,
        name: project.name,
        totalBlockers: 0,
        resolvedBlockers: 0,
        avgResolutionTime: 0,
        criticalBlockers: 0,
        topIssueTypes: {},
        contractorPerformance: {},
        resolutionRate: 0,
        assignedSubcontractors: project.assignedSubcontractors || []
      };
    });

    // Analyze blockers by project
    allBlockers
      .filter(blocker => new Date(blocker.created_at) >= startDate)
      .forEach(blocker => {
        const projectId = blocker.projectId || blocker.project_id;
        if (projectStats[projectId]) {
          const stats = projectStats[projectId];
          stats.totalBlockers++;

          if (blocker.priority === 'critical' || blocker.priority === 'high') {
            stats.criticalBlockers++;
          }

          if (blocker.status === 'verified_complete') {
            stats.resolvedBlockers++;
          }

          // Track issue types
          const type = blocker.category || blocker.type || 'Uncategorized';
          stats.topIssueTypes[type] = (stats.topIssueTypes[type] || 0) + 1;

          // Track contractor performance
          if (blocker.assignedTo) {
            if (!stats.contractorPerformance[blocker.assignedTo]) {
              stats.contractorPerformance[blocker.assignedTo] = {
                assigned: 0,
                completed: 0,
                avgTime: 0
              };
            }
            stats.contractorPerformance[blocker.assignedTo].assigned++;
            if (blocker.status === 'verified_complete') {
              stats.contractorPerformance[blocker.assignedTo].completed++;
            }
          }
        }
      });

    // Calculate derived metrics
    Object.values(projectStats).forEach(stats => {
      stats.resolutionRate = stats.totalBlockers > 0
        ? Math.round((stats.resolvedBlockers / stats.totalBlockers) * 100)
        : 0;

      // Convert top issue types to sorted array
      stats.topIssueTypes = Object.entries(stats.topIssueTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });

    return Object.values(projectStats).sort((a, b) => b.totalBlockers - a.totalBlockers);
  };

  const analyzeBlockerTypes = (blockers) => {
    const typeStats = {};

    blockers.forEach(blocker => {
      const type = blocker.category || blocker.type || 'Uncategorized';
      if (!typeStats[type]) {
        typeStats[type] = {
          type,
          count: 0,
          totalResolutionTime: 0,
          resolvedCount: 0,
          highPriorityCount: 0,
          avgResolutionDays: 0,
          locations: new Set(),
          contractors: new Set()
        };
      }

      typeStats[type].count++;

      if (blocker.priority === 'high' || blocker.priority === 'critical') {
        typeStats[type].highPriorityCount++;
      }

      if (blocker.location) {
        typeStats[type].locations.add(blocker.location);
      }

      if (blocker.assignedTo) {
        typeStats[type].contractors.add(blocker.assignedTo);
      }

      // Calculate resolution time if blocker is resolved
      if (blocker.status === 'verified_complete' && blocker.created_at && blocker.completed_at) {
        const resolutionTime = (new Date(blocker.completed_at) - new Date(blocker.created_at)) / (1000 * 60 * 60 * 24);
        typeStats[type].totalResolutionTime += resolutionTime;
        typeStats[type].resolvedCount++;
      }
    });

    // Calculate averages and convert sets to counts
    Object.keys(typeStats).forEach(type => {
      const stats = typeStats[type];
      stats.avgResolutionDays = stats.resolvedCount > 0
        ? Math.round((stats.totalResolutionTime / stats.resolvedCount) * 10) / 10
        : 0;
      stats.locationCount = stats.locations.size;
      stats.contractorCount = stats.contractors.size;
      stats.resolutionRate = stats.count > 0 ? Math.round((stats.resolvedCount / stats.count) * 100) : 0;
    });

    // Sort by count (highest volume first)
    const sortedTypes = Object.values(typeStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return sortedTypes;
  };

  const analyzeResolutionTimes = (blockers) => {
    const resolvedBlockers = blockers.filter(b =>
      b.status === 'verified_complete' && b.created_at && b.completed_at
    );

    const resolutionStats = resolvedBlockers.map(blocker => {
      const resolutionDays = (new Date(blocker.completed_at) - new Date(blocker.created_at)) / (1000 * 60 * 60 * 24);
      return {
        id: blocker.id,
        title: blocker.title,
        type: blocker.category || blocker.type || 'Uncategorized',
        resolutionDays: Math.round(resolutionDays * 10) / 10,
        priority: blocker.priority,
        assignedTo: blocker.assignedTo,
        contractor: getContractorName(blocker.assignedTo),
        location: blocker.location
      };
    });

    // Find longest resolution times
    const longestResolutions = resolutionStats
      .sort((a, b) => b.resolutionDays - a.resolutionDays)
      .slice(0, 10);

    // Average resolution time by type
    const typeResolutionTimes = {};
    resolutionStats.forEach(blocker => {
      if (!typeResolutionTimes[blocker.type]) {
        typeResolutionTimes[blocker.type] = {
          type: blocker.type,
          totalTime: 0,
          count: 0,
          avgTime: 0
        };
      }
      typeResolutionTimes[blocker.type].totalTime += blocker.resolutionDays;
      typeResolutionTimes[blocker.type].count++;
    });

    Object.keys(typeResolutionTimes).forEach(type => {
      const stats = typeResolutionTimes[type];
      stats.avgTime = Math.round((stats.totalTime / stats.count) * 10) / 10;
    });

    const avgTimesByType = Object.values(typeResolutionTimes)
      .sort((a, b) => b.avgTime - a.avgTime);

    return {
      longestResolutions,
      avgTimesByType,
      overallAvgTime: resolutionStats.length > 0
        ? Math.round((resolutionStats.reduce((sum, b) => sum + b.resolutionDays, 0) / resolutionStats.length) * 10) / 10
        : 0
    };
  };

  const analyzeContractorPerformance = (blockers, contractors) => {
    const contractorStats = {};

    // Initialize with all contractors
    contractors.forEach(contractor => {
      contractorStats[contractor.id] = {
        id: contractor.id,
        name: contractor.name,
        company: contractor.company_name,
        tradeType: contractor.trade_type,
        totalAssigned: 0,
        resolved: 0,
        avgResolutionTime: 0,
        resolutionRate: 0,
        problemTypes: {},
        highPriorityCount: 0,
        totalResolutionTime: 0,
        performance: 'good' // good, average, poor
      };
    });

    // Analyze assigned blockers
    blockers.forEach(blocker => {
      if (blocker.assignedTo && contractorStats[blocker.assignedTo]) {
        const contractor = contractorStats[blocker.assignedTo];
        contractor.totalAssigned++;

        const blockerType = blocker.category || blocker.type || 'Uncategorized';
        contractor.problemTypes[blockerType] = (contractor.problemTypes[blockerType] || 0) + 1;

        if (blocker.priority === 'high' || blocker.priority === 'critical') {
          contractor.highPriorityCount++;
        }

        if (blocker.status === 'verified_complete' && blocker.created_at && blocker.completed_at) {
          contractor.resolved++;
          const resolutionTime = (new Date(blocker.completed_at) - new Date(blocker.created_at)) / (1000 * 60 * 60 * 24);
          contractor.totalResolutionTime += resolutionTime;
        }
      }
    });

    // Calculate performance metrics
    Object.keys(contractorStats).forEach(contractorId => {
      const contractor = contractorStats[contractorId];
      contractor.resolutionRate = contractor.totalAssigned > 0
        ? Math.round((contractor.resolved / contractor.totalAssigned) * 100)
        : 0;
      contractor.avgResolutionTime = contractor.resolved > 0
        ? Math.round((contractor.totalResolutionTime / contractor.resolved) * 10) / 10
        : 0;

      // Determine performance rating
      if (contractor.resolutionRate >= 90 && contractor.avgResolutionTime <= 3) {
        contractor.performance = 'excellent';
      } else if (contractor.resolutionRate >= 75 && contractor.avgResolutionTime <= 5) {
        contractor.performance = 'good';
      } else if (contractor.resolutionRate >= 50 && contractor.avgResolutionTime <= 8) {
        contractor.performance = 'average';
      } else {
        contractor.performance = 'poor';
      }

      // Convert problemTypes to array for easier rendering
      contractor.topProblemTypes = Object.entries(contractor.problemTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });

    // Filter out contractors with no assignments and sort by performance
    const activeContractors = Object.values(contractorStats)
      .filter(c => c.totalAssigned > 0)
      .sort((a, b) => b.resolutionRate - a.resolutionRate);

    return activeContractors;
  };

  const generateInsights = (typeAnalysis, resolutionAnalysis, contractorAnalysis) => {
    const insights = [];

    // Top problematic blocker types
    if (typeAnalysis.length > 0) {
      const topType = typeAnalysis[0];
      insights.push({
        type: 'high_volume',
        title: 'Most Common Blocker Type',
        description: `${topType.type} represents ${topType.count} incidents (${Math.round((topType.count / reportData?.totalBlockers || 1) * 100)}% of all blockers)`,
        recommendation: `Focus on preventive measures for ${topType.type} issues. Consider additional training or process improvements.`,
        severity: topType.count > 10 ? 'high' : 'medium',
        icon: ExclamationTriangleIcon
      });
    }

    // Long resolution times
    if (resolutionAnalysis.longestResolutions.length > 0) {
      const slowestType = resolutionAnalysis.avgTimesByType[0];
      if (slowestType && slowestType.avgTime > 5) {
        insights.push({
          type: 'slow_resolution',
          title: 'Slow Resolution Times',
          description: `${slowestType.type} blockers take an average of ${slowestType.avgTime} days to resolve`,
          recommendation: 'Review resolution process and consider additional resources or specialized contractors for this type.',
          severity: slowestType.avgTime > 10 ? 'high' : 'medium',
          icon: ClockIcon
        });
      }
    }

    // Contractor performance issues
    const poorPerformers = contractorAnalysis.filter(c => c.performance === 'poor');
    if (poorPerformers.length > 0) {
      insights.push({
        type: 'contractor_performance',
        title: 'Contractor Performance Concerns',
        description: `${poorPerformers.length} contractor(s) showing below-average performance`,
        recommendation: 'Schedule performance reviews and consider additional training or contractor rotation.',
        severity: poorPerformers.length > 2 ? 'high' : 'medium',
        icon: UserGroupIcon
      });
    }

    // Positive insights
    const excellentPerformers = contractorAnalysis.filter(c => c.performance === 'excellent');
    if (excellentPerformers.length > 0) {
      insights.push({
        type: 'positive',
        title: 'High-Performing Contractors',
        description: `${excellentPerformers.length} contractor(s) consistently delivering excellent results`,
        recommendation: 'Consider expanding partnerships with these contractors and documenting their best practices.',
        severity: 'positive',
        icon: CheckCircleIcon
      });
    }

    return insights;
  };

  const getContractorName = (contractorId) => {
    const contractor = subcontractors.find(c => c.id === contractorId);
    return contractor ? contractor.name : 'Unknown Contractor';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'positive': return 'success';
      default: return 'secondary';
    }
  };

  const CHART_COLORS = ['#2563eb', '#dc2626', '#ea580c', '#65a30d', '#7c3aed', '#db2777', '#0891b2', '#4f46e5'];

  const renderSubcontractorAnalysis = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Subcontractor Performance Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportData.contractorPerformanceAnalysis.map((contractor) => (
            <Card
              key={contractor.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                contractor.performance === 'good' ? 'border-green-500' :
                contractor.performance === 'average' ? 'border-yellow-500' :
                'border-red-500'
              }`}
              onClick={() => setSelectedSubcontractor(contractor)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{contractor.name}</h4>
                <Badge
                  variant={contractor.performance === 'good' ? 'success' :
                          contractor.performance === 'average' ? 'warning' : 'danger'}
                  size="sm"
                >
                  {contractor.performance}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 mb-3">{contractor.company}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Resolution Rate:</span>
                  <span className="font-medium">{contractor.resolutionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Assigned:</span>
                  <span className="font-medium">{contractor.totalAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Resolution:</span>
                  <span className="font-medium">{contractor.avgResolutionTime}d</span>
                </div>
              </div>

              {Object.keys(contractor.problemTypes).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Common Issues:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(contractor.problemTypes)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([type, count]) => (
                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                          {type} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderProjectComparison = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
          Project Performance Comparison
        </h3>

        <div className="space-y-4">
          {reportData.projectComparison?.map((project) => (
            <Card key={project.id} className="p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{project.name}</h4>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={project.resolutionRate >= 80 ? 'success' :
                            project.resolutionRate >= 60 ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {project.resolutionRate}% resolved
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-500">Total Blockers</div>
                  <div className="font-semibold text-lg">{project.totalBlockers}</div>
                </div>
                <div>
                  <div className="text-slate-500">Critical Issues</div>
                  <div className="font-semibold text-lg text-red-600">{project.criticalBlockers}</div>
                </div>
                <div>
                  <div className="text-slate-500">Resolved</div>
                  <div className="font-semibold text-lg text-green-600">{project.resolvedBlockers}</div>
                </div>
                <div>
                  <div className="text-slate-500">Subcontractors</div>
                  <div className="font-semibold text-lg">{project.assignedSubcontractors.length}</div>
                </div>
              </div>

              {project.topIssueTypes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-2">Top Issue Types:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.topIssueTypes.map((issue) => (
                      <span key={issue.type} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-construction-100 text-construction-800">
                        {issue.type} ({issue.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTrendsAnalysis = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Trends & Pattern Analysis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Time Trends */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Resolution Time by Issue Type</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.resolutionTimeAnalysis.avgTimesByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} days`, 'Avg Resolution Time']} />
                <Bar dataKey="avgTime" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Blocker Type Distribution */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Issue Type Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.blockerTypeAnalysis.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Key Trends Identified:</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start space-x-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>Electrical issues have the highest volume with an average resolution time of {reportData.resolutionTimeAnalysis.avgTimesByType.find(t => t.type === 'Electrical')?.avgTime || 'N/A'} days</span>
            </div>
            <div className="flex items-start space-x-2">
              <ClockIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>Overall average resolution time: {reportData.resolutionTimeAnalysis.overallAvgTime} days</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Top performing contractors maintain resolution rates above 85%</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderProjectSpecificInsights = () => (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <BuildingOfficeIcon className="h-5 w-5 mr-2" />
          Project-Specific Insights: {reportData.currentProject?.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{reportData.totalBlockers}</div>
            <div className="text-sm text-slate-600">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((reportData.totalBlockers - reportData.blockerTypeAnalysis.reduce((sum, type) => sum + (type.count - type.resolvedCount), 0)) / reportData.totalBlockers * 100) || 0}%
            </div>
            <div className="text-sm text-slate-600">Resolution Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reportData.resolutionTimeAnalysis.overallAvgTime}d
            </div>
            <div className="text-sm text-slate-600">Avg Resolution</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.currentProject?.assignedSubcontractors?.length || 0}
            </div>
            <div className="text-sm text-slate-600">Subcontractors</div>
          </div>
        </div>

        {/* Project-Specific Recommendations */}
        <div className="border-t border-slate-200 pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Project-Specific Recommendations:</h4>
          <div className="space-y-2 text-sm text-slate-600">
            {reportData.blockerTypeAnalysis.length > 0 && (
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  Focus on {reportData.blockerTypeAnalysis[0].type.toLowerCase()} issues - they represent
                  {Math.round((reportData.blockerTypeAnalysis[0].count / reportData.totalBlockers) * 100)}% of all project issues
                </span>
              </div>
            )}
            {reportData.resolutionTimeAnalysis.overallAvgTime > 5 && (
              <div className="flex items-start space-x-2">
                <ClockIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>
                  Resolution times are above average - consider process improvements or additional resources
                </span>
              </div>
            )}
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Regular contractor performance reviews could help optimize assignment strategies
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Subcontractors Performance */}
      {reportData.currentProject?.assignedSubcontractors?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Project Subcontractor Performance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.contractorPerformanceAnalysis
              .filter(contractor =>
                reportData.currentProject.assignedSubcontractors.includes(contractor.id)
              )
              .map(contractor => (
                <div
                  key={contractor.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all border-l-4 ${
                    contractor.performance === 'good' ? 'border-green-500' :
                    contractor.performance === 'average' ? 'border-yellow-500' :
                    'border-red-500'
                  }`}
                  onClick={() => setSelectedSubcontractor(contractor)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{contractor.name}</h4>
                    <Badge
                      variant={contractor.performance === 'good' ? 'success' :
                              contractor.performance === 'average' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {contractor.performance}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {contractor.resolutionRate}% resolution rate • {contractor.totalAssigned} assigned
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderSubcontractorDetailModal = () => {
    if (!selectedSubcontractor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedSubcontractor.name} - Detailed Performance Analysis
            </h3>
            <button
              onClick={() => setSelectedSubcontractor(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{selectedSubcontractor.resolutionRate}%</div>
                <div className="text-sm text-slate-600">Resolution Rate</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{selectedSubcontractor.totalAssigned}</div>
                <div className="text-sm text-slate-600">Total Assigned</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{selectedSubcontractor.avgResolutionTime}d</div>
                <div className="text-sm text-slate-600">Avg Resolution Time</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{selectedSubcontractor.highPriorityCount}</div>
                <div className="text-sm text-slate-600">High Priority Issues</div>
              </Card>
            </div>

            {/* Problem Types Breakdown */}
            <Card className="p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Issue Types Handled</h4>
              <div className="space-y-2">
                {Object.entries(selectedSubcontractor.problemTypes)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-construction-500 h-2 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(selectedSubcontractor.problemTypes))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Recommendations</h4>
              <div className="space-y-2 text-sm">
                {selectedSubcontractor.performance === 'poor' && (
                  <>
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Consider additional training or support for this subcontractor</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <ClockIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Monitor resolution times more closely</span>
                    </div>
                  </>
                )}
                {selectedSubcontractor.performance === 'average' && (
                  <>
                    <div className="flex items-start space-x-2">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Provide targeted training on common issue types</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Pair with high-performing contractors for knowledge sharing</span>
                    </div>
                  </>
                )}
                {selectedSubcontractor.performance === 'good' && (
                  <>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Excellent performance - consider for complex projects</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Could mentor other subcontractors</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Generating lessons learned report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No data available for lessons learned report</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <LightBulbIcon className="h-8 w-8 text-yellow-500 mr-3" />
            Lessons Learned Report
          </h2>
          <p className="text-slate-600 mt-1">
            {selectedProject === 'all'
              ? 'Analysis of blocker patterns, resolution times, and contractor performance across all projects'
              : `Project-specific analysis for ${reportData?.currentProject?.name || 'selected project'}`
            }
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Project Selection */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* View Selection */}
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="overview">Overview</option>
            <option value="subcontractors">Subcontractor Analysis</option>
            <option value="projects">Project Comparison</option>
            <option value="trends">Trends & Patterns</option>
          </select>

          {/* Timeframe Selection */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_year">Last Year</option>
          </select>

          <Button variant="primary" size="sm">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
          Key Insights & Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportData.insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    insight.severity === 'high' ? 'bg-red-100' :
                    insight.severity === 'medium' ? 'bg-yellow-100' :
                    insight.severity === 'positive' ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      insight.severity === 'high' ? 'text-red-600' :
                      insight.severity === 'medium' ? 'text-yellow-600' :
                      insight.severity === 'positive' ? 'text-green-600' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                      <Badge variant={getSeverityColor(insight.severity)} size="sm">
                        {insight.severity === 'positive' ? 'Good' : insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                    <p className="text-sm text-slate-700 font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Blocker Type Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Highest Volume Blocker Types
          </h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.blockerTypeAnalysis.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                          <p className="font-semibold">{label}</p>
                          <p className="text-sm text-slate-600">Count: {data.count}</p>
                          <p className="text-sm text-slate-600">Avg Resolution: {data.avgResolutionDays} days</p>
                          <p className="text-sm text-slate-600">Resolution Rate: {data.resolutionRate}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Longest Resolution Times by Type
          </h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.resolutionTimeAnalysis.avgTimesByType.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} days`, 'Avg Resolution Time']}
                />
                <Bar dataKey="avgTime" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Contractor Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Contractor Performance Analysis
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-900">Contractor</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Trade Type</th>
                <th className="text-center py-3 px-4 font-medium text-slate-900">Assigned</th>
                <th className="text-center py-3 px-4 font-medium text-slate-900">Resolved</th>
                <th className="text-center py-3 px-4 font-medium text-slate-900">Resolution Rate</th>
                <th className="text-center py-3 px-4 font-medium text-slate-900">Avg Time</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Top Issues</th>
                <th className="text-center py-3 px-4 font-medium text-slate-900">Performance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.contractorPerformanceAnalysis.map((contractor, index) => (
                <tr key={contractor.id} className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-slate-900">{contractor.name}</div>
                      <div className="text-sm text-slate-500">{contractor.company}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{contractor.tradeType}</td>
                  <td className="py-3 px-4 text-center">{contractor.totalAssigned}</td>
                  <td className="py-3 px-4 text-center">{contractor.resolved}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-construction-500 h-2 rounded-full"
                          style={{ width: `${contractor.resolutionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{contractor.resolutionRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">{contractor.avgResolutionTime} days</td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {contractor.topProblemTypes.slice(0, 2).map((problem, idx) => (
                        <Badge key={idx} variant="secondary" size="sm">
                          {problem.type} ({problem.count})
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={
                        contractor.performance === 'excellent' ? 'success' :
                        contractor.performance === 'good' ? 'construction' :
                        contractor.performance === 'average' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {contractor.performance}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{reportData.totalBlockers}</div>
          <div className="text-sm text-slate-600">Total Blockers</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {reportData.blockerTypeAnalysis.length}
          </div>
          <div className="text-sm text-slate-600">Blocker Types</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {reportData.resolutionTimeAnalysis.overallAvgTime}
          </div>
          <div className="text-sm text-slate-600">Avg Resolution (days)</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {reportData.contractorPerformanceAnalysis.length}
          </div>
          <div className="text-sm text-slate-600">Active Contractors</div>
        </Card>
      </div>

      {/* Project-Specific Content when single project selected */}
      {selectedProject !== 'all' && selectedView === 'overview' && renderProjectSpecificInsights()}

      {/* View-based Content */}
      {selectedView === 'subcontractors' && renderSubcontractorAnalysis()}
      {selectedView === 'projects' && selectedProject === 'all' && renderProjectComparison()}
      {selectedView === 'trends' && renderTrendsAnalysis()}

      {/* Subcontractor Detail Modal */}
      {renderSubcontractorDetailModal()}
    </div>
  );
};

export default LessonsLearnedReport;