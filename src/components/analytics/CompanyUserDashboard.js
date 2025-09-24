import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MapIcon,
  UserIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const CompanyUserDashboard = ({ companyId, userRole, userId }) => {
  const [data, setData] = useState({
    operationalMetrics: {
      totalBlockers: 0,
      openBlockers: 0,
      overdueBlockers: 0,
      avgResponseTime: 0,
      completionRate: 0
    },
    blockerTypes: [],
    repeatLocations: [],
    contractorPerformance: [],
    problemAreas: [],
    overdueItems: [],
    responseTimesTrend: [],
    performanceTrends: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchOperationalData();
  }, [dateRange, selectedProject, companyId, userRole, userId]);

  const fetchOperationalData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch user's accessible projects based on role
      let projectsQuery = supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId);

      // Main contractors and project managers see all company projects
      if (!['main_contractor', 'company_admin', 'company_owner'].includes(userRole)) {
        // Other roles see only projects they're assigned to
        projectsQuery = projectsQuery.in('id',
          supabase.from('project_members')
            .select('project_id')
            .eq('user_id', userId)
        );
      }

      const { data: projects } = await projectsQuery;
      setProjects(projects || []);

      // Fetch blockers for operational metrics
      let blockersQuery = supabase
        .from('blockers')
        .select(`
          *,
          assigned_user:users!assigned_to(first_name, last_name, role),
          project:projects(name, location),
          status_history(*)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      if (selectedProject !== 'all') {
        blockersQuery = blockersQuery.eq('project_id', selectedProject);
      }

      // Filter based on user role access
      if (!['main_contractor', 'company_admin', 'company_owner'].includes(userRole)) {
        const accessibleProjects = projects?.map(p => p.id) || [];
        if (accessibleProjects.length > 0) {
          blockersQuery = blockersQuery.in('project_id', accessibleProjects);
        }
      }

      const { data: blockers } = await blockersQuery;

      // Process operational analytics
      const processedData = processOperationalMetrics(blockers || [], userRole);
      setData(processedData);

    } catch (error) {
      console.error('Error fetching operational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processOperationalMetrics = (blockers, role) => {
    const now = new Date();
    const openBlockers = blockers.filter(b => !['verified_complete', 'cancelled'].includes(b.status));
    const overdueBlockers = blockers.filter(b => {
      const dueDate = new Date(b.due_date);
      return dueDate < now && !['verified_complete', 'cancelled'].includes(b.status);
    });

    // Calculate response times (useful for contractor meetings)
    const responseTimes = blockers.map(blocker => {
      const statusHistory = blocker.status_history?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const firstResponse = statusHistory?.find(h => h.status === 'assigned');
      if (firstResponse) {
        const created = new Date(blocker.created_at);
        const responded = new Date(firstResponse.created_at);
        return (responded - created) / (1000 * 60 * 60); // hours
      }
      return null;
    }).filter(Boolean);

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Process blocker types (useful for identifying patterns)
    const blockerTypes = processFrequencyData(blockers, 'category');

    // Process repeat locations (problem areas)
    const repeatLocations = processRepeatLocations(blockers);

    // Process contractor performance (for meetings)
    const contractorPerformance = processContractorPerformance(blockers);

    // Process problem areas (locations with multiple issues)
    const problemAreas = processProblemAreas(blockers);

    // Process overdue items details
    const overdueItems = processOverdueItems(overdueBlockers);

    // Process performance trends
    const performanceTrends = processPerformanceTrends(blockers);

    // Process response times trend
    const responseTimesTrend = processResponseTimesTrend(blockers);

    const completedBlockers = blockers.filter(b => b.status === 'verified_complete');
    const completionRate = blockers.length > 0 ? Math.round((completedBlockers.length / blockers.length) * 100) : 0;

    return {
      operationalMetrics: {
        totalBlockers: blockers.length,
        openBlockers: openBlockers.length,
        overdueBlockers: overdueBlockers.length,
        avgResponseTime: Math.round(avgResponseTime),
        completionRate
      },
      blockerTypes,
      repeatLocations,
      contractorPerformance,
      problemAreas,
      overdueItems,
      responseTimesTrend,
      performanceTrends
    };
  };

  const processFrequencyData = (data, field) => {
    const counts = {};
    data.forEach(item => {
      const value = item[field] || 'Other';
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  const processRepeatLocations = (blockers) => {
    const locations = {};
    blockers.forEach(blocker => {
      const location = blocker.location || blocker.project?.location || 'Unknown Location';
      if (!locations[location]) {
        locations[location] = {
          location,
          count: 0,
          openCount: 0,
          categories: new Set()
        };
      }
      locations[location].count++;
      if (!['verified_complete', 'cancelled'].includes(blocker.status)) {
        locations[location].openCount++;
      }
      locations[location].categories.add(blocker.category || 'Other');
    });

    return Object.values(locations)
      .filter(loc => loc.count > 1) // Only show repeat locations
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(loc => ({
        ...loc,
        categories: Array.from(loc.categories).join(', ')
      }));
  };

  const processContractorPerformance = (blockers) => {
    const contractors = {};

    blockers.forEach(blocker => {
      if (blocker.assigned_user) {
        const key = `${blocker.assigned_user.first_name} ${blocker.assigned_user.last_name}`;
        if (!contractors[key]) {
          contractors[key] = {
            name: key,
            role: blocker.assigned_user.role,
            assigned: 0,
            completed: 0,
            avgResponseTime: 0,
            responseTimes: []
          };
        }

        contractors[key].assigned++;

        if (blocker.status === 'verified_complete') {
          contractors[key].completed++;
        }

        // Calculate response time for this blocker
        const statusHistory = blocker.status_history?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const firstResponse = statusHistory?.find(h => h.status === 'assigned');
        if (firstResponse) {
          const created = new Date(blocker.created_at);
          const responded = new Date(firstResponse.created_at);
          const responseTime = (responded - created) / (1000 * 60 * 60); // hours
          contractors[key].responseTimes.push(responseTime);
        }
      }
    });

    return Object.values(contractors)
      .map(contractor => ({
        ...contractor,
        completionRate: contractor.assigned > 0 ? Math.round((contractor.completed / contractor.assigned) * 100) : 0,
        avgResponseTime: contractor.responseTimes.length > 0
          ? Math.round(contractor.responseTimes.reduce((a, b) => a + b, 0) / contractor.responseTimes.length)
          : 0
      }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 10);
  };

  const processProblemAreas = (blockers) => {
    const areas = {};
    blockers.forEach(blocker => {
      const area = blocker.location || 'Unknown Area';
      if (!areas[area]) {
        areas[area] = {
          area,
          totalIssues: 0,
          openIssues: 0,
          categories: {},
          avgResolutionTime: 0,
          resolutionTimes: []
        };
      }

      areas[area].totalIssues++;
      if (!['verified_complete', 'cancelled'].includes(blocker.status)) {
        areas[area].openIssues++;
      }

      const category = blocker.category || 'Other';
      areas[area].categories[category] = (areas[area].categories[category] || 0) + 1;

      if (blocker.status === 'verified_complete') {
        const created = new Date(blocker.created_at);
        const completed = new Date(blocker.updated_at);
        const resolutionTime = (completed - created) / (1000 * 60 * 60 * 24); // days
        areas[area].resolutionTimes.push(resolutionTime);
      }
    });

    return Object.values(areas)
      .filter(area => area.totalIssues >= 3) // Only show areas with multiple issues
      .map(area => ({
        ...area,
        avgResolutionTime: area.resolutionTimes.length > 0
          ? Math.round(area.resolutionTimes.reduce((a, b) => a + b, 0) / area.resolutionTimes.length)
          : 0,
        topCategory: Object.entries(area.categories)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Other'
      }))
      .sort((a, b) => b.totalIssues - a.totalIssues)
      .slice(0, 8);
  };

  const processOverdueItems = (overdueBlockers) => {
    return overdueBlockers
      .map(blocker => ({
        id: blocker.id,
        title: blocker.title,
        category: blocker.category,
        priority: blocker.priority,
        dueDate: blocker.due_date,
        daysPastDue: Math.floor((new Date() - new Date(blocker.due_date)) / (1000 * 60 * 60 * 24)),
        assignedTo: blocker.assigned_user
          ? `${blocker.assigned_user.first_name} ${blocker.assigned_user.last_name}`
          : 'Unassigned',
        project: blocker.project?.name || 'Unknown Project'
      }))
      .sort((a, b) => b.daysPastDue - a.daysPastDue)
      .slice(0, 10);
  };

  const processPerformanceTrends = (blockers) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayBlockers = blockers.filter(b => b.created_at.startsWith(date));
      const dayCompleted = blockers.filter(b =>
        b.status === 'verified_complete' && b.updated_at.startsWith(date)
      );

      return {
        date: new Date(date).toLocaleDateString(),
        created: dayBlockers.length,
        completed: dayCompleted.length
      };
    });
  };

  const processResponseTimesTrend = (blockers) => {
    const weeklyData = {};

    blockers.forEach(blocker => {
      const statusHistory = blocker.status_history?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const firstResponse = statusHistory?.find(h => h.status === 'assigned');

      if (firstResponse) {
        const week = getWeekKey(new Date(blocker.created_at));
        const created = new Date(blocker.created_at);
        const responded = new Date(firstResponse.created_at);
        const responseTime = (responded - created) / (1000 * 60 * 60); // hours

        if (!weeklyData[week]) {
          weeklyData[week] = { week, times: [] };
        }
        weeklyData[week].times.push(responseTime);
      }
    });

    return Object.values(weeklyData)
      .map(week => ({
        week: week.week,
        avgResponseTime: Math.round(week.times.reduce((a, b) => a + b, 0) / week.times.length)
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#ed7611', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Operational Metrics</h2>
          <p className="text-sm text-slate-600 mt-1">Data for contractor meetings and team discussions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          {['7', '30', '90'].map((days) => (
            <Button
              key={days}
              variant={dateRange === days ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDateRange(days)}
            >
              {days} days
            </Button>
          ))}

          <Button variant="ghost" size="sm" onClick={handlePrint} icon={DocumentTextIcon}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Key Operational Metrics */}
      <CardGrid columns={5}>
        <StatCard
          title="Total Issues"
          value={data.operationalMetrics.totalBlockers.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="construction"
        />
        <StatCard
          title="Open Issues"
          value={data.operationalMetrics.openBlockers.toLocaleString()}
          icon={ClockIcon}
          color="warning"
        />
        <StatCard
          title="Overdue"
          value={data.operationalMetrics.overdueBlockers.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="safety"
        />
        <StatCard
          title="Avg Response"
          value={`${data.operationalMetrics.avgResponseTime}h`}
          icon={ArrowTrendingUpIcon}
          color="blue"
        />
        <StatCard
          title="Completion Rate"
          value={`${data.operationalMetrics.completionRate}%`}
          icon={CheckCircleIcon}
          color="success"
        />
      </CardGrid>

      {/* Charts for Contractor Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocker Types */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Most Common Issues</h3>
            <p className="text-sm text-slate-600">Issue types by frequency</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.blockerTypes} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ed7611" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Performance Trends */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Performance Trends</h3>
            <p className="text-sm text-slate-600">Issues created vs completed</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="#ed7611" strokeWidth={2} name="Created" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Problem Areas Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Problem Areas</h3>
          <p className="text-sm text-slate-600">Locations with multiple issues</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Open Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Top Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Resolution
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.problemAreas.map((area, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapIcon className="h-5 w-5 text-slate-400 mr-2" />
                      <div className="text-sm font-medium text-slate-900">{area.area}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {area.totalIssues}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={area.openIssues > 0 ? 'warning' : 'success'}
                      size="sm"
                    >
                      {area.openIssues}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {area.topCategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {area.avgResolutionTime} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contractor Performance */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
          <p className="text-sm text-slate-600">Performance metrics for team discussions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Response
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.contractorPerformance.map((contractor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-slate-400 mr-2" />
                      <div className="text-sm font-medium text-slate-900">{contractor.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" size="sm">
                      {contractor.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {contractor.assigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2 max-w-16">
                        <div
                          className="bg-construction-600 h-2 rounded-full"
                          style={{ width: `${contractor.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-900">{contractor.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {contractor.avgResponseTime}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Overdue Items */}
      {data.overdueItems.length > 0 && (
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 text-red-600">Overdue Items</h3>
            <p className="text-sm text-slate-600">Items requiring immediate attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    Project
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.overdueItems.map((item, index) => (
                  <tr key={index} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={item.priority === 'high' ? 'priority-high' : 'priority-medium'}
                        size="sm"
                      >
                        {item.priority?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-red-600">{item.daysPastDue} days</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {item.assignedTo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.project}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .space-y-6 > * { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CompanyUserDashboard;