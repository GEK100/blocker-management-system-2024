import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const [data, setData] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    totalBlockers: 0,
    activeProjects: 0,
    monthlyRevenue: 0,
    companyGrowth: [],
    userActivity: [],
    blockerTrends: [],
    subscriptionBreakdown: [],
    topCompanies: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchSuperAdminData();
  }, [dateRange]);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch basic counts
      const [companiesRes, usersRes, blockersRes, projectsRes] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('blockers').select('*', { count: 'exact' }),
        supabase.from('projects').select('*', { count: 'exact' }).eq('status', 'active')
      ]);

      // Fetch company growth data
      const { data: companyGrowthData } = await supabase
        .from('companies')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Fetch user activity
      const { data: userActivityData } = await supabase
        .from('audit_logs')
        .select('created_at, action')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Fetch blocker trends
      const { data: blockerTrendsData } = await supabase
        .from('blockers')
        .select('created_at, status, priority')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Fetch subscription data
      const { data: subscriptionData } = await supabase
        .from('companies')
        .select('subscription_status')
        .not('subscription_status', 'is', null);

      // Fetch top companies by blocker volume
      const { data: topCompaniesData } = await supabase
        .from('companies')
        .select(`
          id, name, subscription_status,
          blockers(count)
        `)
        .order('blockers(count)', { ascending: false })
        .limit(5);

      // Process data
      const processedData = {
        totalCompanies: companiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalBlockers: blockersRes.count || 0,
        activeProjects: projectsRes.count || 0,
        monthlyRevenue: calculateMonthlyRevenue(subscriptionData || []),
        companyGrowth: processTimeSeriesData(companyGrowthData || [], 'Companies'),
        userActivity: processTimeSeriesData(userActivityData || [], 'Activity'),
        blockerTrends: processBlockerTrends(blockerTrendsData || []),
        subscriptionBreakdown: processSubscriptionData(subscriptionData || []),
        topCompanies: topCompaniesData || []
      };

      setData(processedData);
    } catch (error) {
      console.error('Error fetching super admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (subscriptions) => {
    const pricing = {
      'basic': 99,
      'professional': 199,
      'enterprise': 399
    };

    return subscriptions.reduce((total, sub) => {
      return total + (pricing[sub.subscription_status] || 0);
    }, 0);
  };

  const processTimeSeriesData = (data, label) => {
    const groupedData = {};
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      groupedData[date] = (groupedData[date] || 0) + 1;
    });

    return Object.entries(groupedData).map(([date, count]) => ({
      date,
      [label]: count
    }));
  };

  const processBlockerTrends = (data) => {
    const statusCounts = {};
    data.forEach(blocker => {
      statusCounts[blocker.status] = (statusCounts[blocker.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').toUpperCase(),
      count
    }));
  };

  const processSubscriptionData = (data) => {
    const subscriptionCounts = {};
    data.forEach(company => {
      const status = company.subscription_status || 'trial';
      subscriptionCounts[status] = (subscriptionCounts[status] || 0) + 1;
    });

    return Object.entries(subscriptionCounts).map(([plan, count]) => ({
      name: plan.toUpperCase(),
      value: count
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#ed7611', '#64748b', '#10b981', '#f59e0b', '#ef4444'];

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
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Platform Overview</h2>
        <div className="flex space-x-2">
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
          title="Total Companies"
          value={data.totalCompanies.toLocaleString()}
          icon={BuildingOfficeIcon}
          color="construction"
        />
        <StatCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Active Blockers"
          value={data.totalBlockers.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="warning"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${data.monthlyRevenue.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="success"
        />
      </CardGrid>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Growth */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Company Growth</h3>
            <p className="text-sm text-slate-600">New companies over time</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.companyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Companies" stroke="#ed7611" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* User Activity */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">User Activity</h3>
            <p className="text-sm text-slate-600">Daily active users</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Activity" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Subscription Plans</h3>
            <p className="text-sm text-slate-600">Distribution by plan type</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.subscriptionBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.subscriptionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Blocker Status Distribution */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Blocker Status</h3>
            <p className="text-sm text-slate-600">Current blocker distribution</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.blockerTrends} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ed7611" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Companies Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Top Companies</h3>
          <p className="text-sm text-slate-600">Companies by blocker activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Blockers
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.topCompanies.map((company, index) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{company.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="primary" size="sm">
                      {company.subscription_status?.toUpperCase() || 'TRIAL'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {company.blockers?.length || 0}
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

export default SuperAdminDashboard;