import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const CompanyAdminDashboard = ({ companyId }) => {
  const [data, setData] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalBlockers: 0,
    resolvedBlockers: 0,
    avgResolutionTime: 0,
    responseTime: 0,
    rejectionRate: 0,
    complianceRate: 0,
    userActivity: [],
    blockerTrends: [],
    contractorPerformance: [],
    priorityDistribution: [],
    statusDistribution: [],
    resolutionTrends: [],
    projects: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    fetchCompanyData();
  }, [dateRange, selectedProject, companyId]);

  const fetchCompanyData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch company users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId);

      // Fetch company projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId);

      // Fetch blockers with filters
      let blockersQuery = supabase
        .from('blockers')
        .select(`
          *,
          assigned_user:users!assigned_to(first_name, last_name, role),
          project:projects(name),
          status_history(*)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      if (selectedProject !== 'all') {
        blockersQuery = blockersQuery.eq('project_id', selectedProject);
      }

      const { data: blockers } = await blockersQuery;

      // Fetch user activity from audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Process data
      const processedData = processCompanyAnalytics(users, projects, blockers, auditLogs);
      setData({ ...processedData, projects: projects || [] });

    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCompanyAnalytics = (users, projects, blockers, auditLogs) => {
    const resolvedBlockers = blockers?.filter(b => b.status === 'verified_complete') || [];
    const rejectedBlockers = blockers?.filter(b => b.status === 'rejected') || [];
    const blockersWithPhotos = blockers?.filter(b => b.photo_urls && b.photo_urls.length > 0) || [];

    // Calculate resolution times
    const resolutionTimes = resolvedBlockers.map(blocker => {
      const created = new Date(blocker.created_at);
      const resolved = new Date(blocker.updated_at);
      return (resolved - created) / (1000 * 60 * 60); // hours
    });

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Calculate response times (time to first assignment)
    const responseTimes = blockers?.map(blocker => {
      const statusHistory = blocker.status_history?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const firstAssignment = statusHistory?.find(h => h.status === 'assigned');
      if (firstAssignment) {
        const created = new Date(blocker.created_at);
        const assigned = new Date(firstAssignment.created_at);
        return (assigned - created) / (1000 * 60 * 60); // hours
      }
      return null;
    }).filter(Boolean) || [];

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Process trends data
    const blockerTrends = processTimeSeriesData(blockers || [], 'created_at', 'Blockers');
    const userActivity = processTimeSeriesData(auditLogs || [], 'created_at', 'Actions');
    const resolutionTrends = processTimeSeriesData(resolvedBlockers, 'updated_at', 'Resolved');

    // Contractor performance
    const contractorPerformance = processContractorPerformance(blockers || []);

    // Priority and status distribution
    const priorityDistribution = processCategoricalData(blockers || [], 'priority');
    const statusDistribution = processCategoricalData(blockers || [], 'status');

    return {
      totalUsers: users?.length || 0,
      activeProjects: projects?.filter(p => p.status === 'active').length || 0,
      totalBlockers: blockers?.length || 0,
      resolvedBlockers: resolvedBlockers.length,
      avgResolutionTime: Math.round(avgResolutionTime),
      responseTime: Math.round(avgResponseTime),
      rejectionRate: blockers?.length > 0 ? Math.round((rejectedBlockers.length / blockers.length) * 100) : 0,
      complianceRate: blockers?.length > 0 ? Math.round((blockersWithPhotos.length / blockers.length) * 100) : 0,
      userActivity,
      blockerTrends,
      contractorPerformance,
      priorityDistribution,
      statusDistribution,
      resolutionTrends
    };
  };

  const processTimeSeriesData = (data, dateField, label) => {
    const groupedData = {};
    data.forEach(item => {
      const date = new Date(item[dateField]).toLocaleDateString();
      groupedData[date] = (groupedData[date] || 0) + 1;
    });

    return Object.entries(groupedData).map(([date, count]) => ({
      date,
      [label]: count
    }));
  };

  const processCategoricalData = (data, field) => {
    const counts = {};
    data.forEach(item => {
      const value = item[field] || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value
    }));
  };

  const processContractorPerformance = (blockers) => {
    const contractors = {};

    blockers.forEach(blocker => {
      if (blocker.assigned_user) {
        const name = `${blocker.assigned_user.first_name} ${blocker.assigned_user.last_name}`;
        if (!contractors[name]) {
          contractors[name] = {
            name,
            role: blocker.assigned_user.role,
            assigned: 0,
            completed: 0,
            avgTime: 0
          };
        }

        contractors[name].assigned++;
        if (blocker.status === 'verified_complete') {
          contractors[name].completed++;
        }
      }
    });

    return Object.values(contractors).map(contractor => ({
      ...contractor,
      completionRate: contractor.assigned > 0 ? Math.round((contractor.completed / contractor.assigned) * 100) : 0
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#ed7611', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <h2 className="text-xl font-semibold text-slate-900">Company Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="all">All Projects</option>
            {data.projects.map(project => (
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

      {/* Key Metrics */}
      <CardGrid columns={4}>
        <StatCard
          title="Team Members"
          value={data.totalUsers.toLocaleString()}
          icon={UserGroupIcon}
          color="construction"
        />
        <StatCard
          title="Active Projects"
          value={data.activeProjects.toLocaleString()}
          icon={BuildingOffice2Icon}
          color="blue"
        />
        <StatCard
          title="Total Blockers"
          value={data.totalBlockers.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="warning"
          change={`${data.resolvedBlockers} resolved`}
        />
        <StatCard
          title="Avg Resolution"
          value={`${data.avgResolutionTime}h`}
          icon={ClockIcon}
          color="success"
          change={`${data.responseTime}h response`}
        />
      </CardGrid>

      {/* Performance Metrics */}
      <CardGrid columns={4}>
        <StatCard
          title="Completion Rate"
          value={`${data.totalBlockers > 0 ? Math.round((data.resolvedBlockers / data.totalBlockers) * 100) : 0}%`}
          icon={CheckCircleIcon}
          color="success"
        />
        <StatCard
          title="Rejection Rate"
          value={`${data.rejectionRate}%`}
          icon={ExclamationTriangleIcon}
          color="safety"
        />
        <StatCard
          title="Documentation"
          value={`${data.complianceRate}%`}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Response Time"
          value={`${data.responseTime}h`}
          icon={ClockIcon}
          color="warning"
        />
      </CardGrid>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocker Trends */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Blocker Trends</h3>
            <p className="text-sm text-slate-600">Daily blocker submissions</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={data.blockerTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="Blockers" stackId="1" stroke="#ed7611" fill="#ed7611" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Resolution Trends */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Resolution Trends</h3>
            <p className="text-sm text-slate-600">Daily resolutions</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.resolutionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Priority Distribution</h3>
            <p className="text-sm text-slate-600">Blockers by priority level</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.priorityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Status Distribution</h3>
            <p className="text-sm text-slate-600">Current blocker statuses</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.statusDistribution} layout="horizontal">
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
      </div>

      {/* Contractor Performance Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
          <p className="text-sm text-slate-600">Individual performance metrics</p>
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
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.contractorPerformance.map((contractor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{contractor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" size="sm">
                      {contractor.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {contractor.assigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {contractor.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-construction-600 h-2 rounded-full"
                          style={{ width: `${contractor.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-900">{contractor.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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

export default CompanyAdminDashboard;