import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ChevronDownIcon, ChevronUpIcon, ArrowDownTrayIcon, ChartBarIcon, ArrowTrendingUpIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

const AnalyticsDashboard = () => {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Data state
  const [blockers, setBlockers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);

  // Chart visibility state
  const [visibleCharts, setVisibleCharts] = useState({
    overview: true,
    contractorPerformance: true,
    resolutionTimes: true,
    blockerTypes: true,
    locations: true,
    peakTimes: true,
    priorities: true,
    documentation: true,
    trends: true,
    projectDensity: true
  });

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, dateRange]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if user has admin access
      if (!['super_admin', 'company_owner', 'company_admin'].includes(profile.role)) {
        setError('Insufficient permissions to access analytics');
        setLoading(false);
        return;
      }

      setUser(user);
      setCompanyId(profile.company_id);
    } catch (err) {
      console.error('Error initializing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = startOfDay(new Date(dateRange.start));
      const endDate = endOfDay(new Date(dateRange.end));

      // Fetch blockers
      const { data: blockersData, error: blockersError } = await supabase
        .from('blockers')
        .select(`
          *,
          assigned_to:user_profiles!blockers_assigned_to_fkey(full_name, role),
          created_by:user_profiles!blockers_created_by_fkey(full_name, role),
          project:projects(name, location)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (blockersError) throw blockersError;

      // Fetch contractors
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('company_id', companyId)
        .in('role', ['main_contractor', 'subcontractor']);

      if (contractorsError) throw contractorsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyId);

      if (projectsError) throw projectsError;

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('blocker_status_history')
        .select(`
          *,
          blocker:blockers(id, title),
          changed_by:user_profiles(full_name, role)
        `)
        .eq('company_id', companyId)
        .gte('changed_at', startDate.toISOString())
        .lte('changed_at', endDate.toISOString())
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      setBlockers(blockersData || []);
      setContractors(contractorsData || []);
      setProjects(projectsData || []);
      setStatusHistory(historyData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!blockers.length) return {};

    // Overview metrics
    const totalBlockers = blockers.length;
    const openBlockers = blockers.filter(b => !['verified_complete', 'cancelled'].includes(b.status)).length;
    const completedBlockers = blockers.filter(b => b.status === 'verified_complete').length;
    const rejectedBlockers = blockers.filter(b => b.status === 'rejected').length;

    // Open blockers by contractor
    const openByContractor = contractors.map(contractor => ({
      name: contractor.full_name,
      role: contractor.role,
      open: blockers.filter(b =>
        b.assigned_to?.user_id === contractor.user_id &&
        !['verified_complete', 'cancelled'].includes(b.status)
      ).length
    })).filter(item => item.open > 0);

    // Resolution times
    const resolvedBlockers = blockers.filter(b => b.status === 'verified_complete' && b.resolved_at);
    const resolutionTimes = resolvedBlockers.map(b => {
      const created = new Date(b.created_at);
      const resolved = new Date(b.resolved_at);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return {
        id: b.id,
        title: b.title,
        hours: Math.round(hours * 10) / 10,
        contractor: b.assigned_to?.full_name || 'Unassigned',
        priority: b.priority
      };
    });

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((acc, r) => acc + r.hours, 0) / resolutionTimes.length
      : 0;

    // Resolution times by contractor
    const contractorResolutionTimes = contractors.map(contractor => {
      const contractorResolutions = resolutionTimes.filter(r => r.contractor === contractor.full_name);
      const avgTime = contractorResolutions.length > 0
        ? contractorResolutions.reduce((acc, r) => acc + r.hours, 0) / contractorResolutions.length
        : 0;
      return {
        name: contractor.full_name,
        avgHours: Math.round(avgTime * 10) / 10,
        count: contractorResolutions.length
      };
    }).filter(item => item.count > 0);

    // MC response times
    const mcResponseTimes = statusHistory
      .filter(h => h.from_status === 'pending_review' && h.to_status === 'assigned')
      .map(h => {
        const blocker = blockers.find(b => b.id === h.blocker_id);
        if (!blocker) return null;

        const created = new Date(blocker.created_at);
        const responded = new Date(h.changed_at);
        const hours = (responded - created) / (1000 * 60 * 60);
        return {
          id: h.blocker_id,
          hours: Math.round(hours * 10) / 10,
          contractor: h.changed_by?.full_name || 'Unknown'
        };
      })
      .filter(Boolean);

    const avgMcResponseTime = mcResponseTimes.length > 0
      ? mcResponseTimes.reduce((acc, r) => acc + r.hours, 0) / mcResponseTimes.length
      : 0;

    // Rejection rates
    const rejectionRate = totalBlockers > 0 ? (rejectedBlockers / totalBlockers) * 100 : 0;

    const contractorRejectionRates = contractors.map(contractor => {
      const contractorBlockers = blockers.filter(b => b.assigned_to?.user_id === contractor.user_id);
      const contractorRejected = contractorBlockers.filter(b => b.status === 'rejected');
      const rate = contractorBlockers.length > 0
        ? (contractorRejected.length / contractorBlockers.length) * 100
        : 0;
      return {
        name: contractor.full_name,
        rate: Math.round(rate * 10) / 10,
        rejected: contractorRejected.length,
        total: contractorBlockers.length
      };
    }).filter(item => item.total > 0);

    // Blocker types/categories
    const typeCategories = blockers.reduce((acc, b) => {
      const type = b.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const blockerTypeData = Object.entries(typeCategories).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: Math.round((count / totalBlockers) * 100)
    }));

    // Repeat blocker locations
    const locationCounts = blockers.reduce((acc, b) => {
      const location = b.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    const repeatLocations = Object.entries(locationCounts)
      .filter(([, count]) => count > 1)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    // Peak creation times
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: 0
    }));

    blockers.forEach(b => {
      const hour = new Date(b.created_at).getHours();
      hourlyData[hour].count++;
    });

    // Daily creation trend
    const dailyData = {};
    blockers.forEach(b => {
      const date = format(new Date(b.created_at), 'yyyy-MM-dd');
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    const dailyTrendData = Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Resolution rates by priority
    const priorityData = ['high', 'medium', 'low'].map(priority => {
      const priorityBlockers = blockers.filter(b => b.priority === priority);
      const resolved = priorityBlockers.filter(b => b.status === 'verified_complete');
      const rate = priorityBlockers.length > 0
        ? (resolved.length / priorityBlockers.length) * 100
        : 0;
      return {
        priority,
        total: priorityBlockers.length,
        resolved: resolved.length,
        rate: Math.round(rate * 10) / 10
      };
    });

    // Documentation compliance
    const withPhotos = blockers.filter(b => b.photos && b.photos.length > 0).length;
    const documentationRate = totalBlockers > 0 ? (withPhotos / totalBlockers) * 100 : 0;

    const contractorDocCompliance = contractors.map(contractor => {
      const contractorBlockers = blockers.filter(b => b.created_by?.user_id === contractor.user_id);
      const withDocs = contractorBlockers.filter(b => b.photos && b.photos.length > 0);
      const rate = contractorBlockers.length > 0
        ? (withDocs.length / contractorBlockers.length) * 100
        : 0;
      return {
        name: contractor.full_name,
        rate: Math.round(rate * 10) / 10,
        withDocs: withDocs.length,
        total: contractorBlockers.length
      };
    }).filter(item => item.total > 0);

    // Contractor performance trends
    const performanceTrends = contractors.map(contractor => {
      const contractorHistory = statusHistory.filter(h =>
        h.changed_by?.user_id === contractor.user_id ||
        blockers.find(b => b.id === h.blocker_id)?.assigned_to?.user_id === contractor.user_id
      );

      const weeklyPerformance = {};
      contractorHistory.forEach(h => {
        const week = format(new Date(h.changed_at), 'yyyy-MM-dd');
        if (!weeklyPerformance[week]) {
          weeklyPerformance[week] = { completed: 0, rejected: 0 };
        }
        if (h.to_status === 'verified_complete') {
          weeklyPerformance[week].completed++;
        } else if (h.to_status === 'rejected') {
          weeklyPerformance[week].rejected++;
        }
      });

      return {
        name: contractor.full_name,
        data: Object.entries(weeklyPerformance).map(([date, stats]) => ({
          date,
          completed: stats.completed,
          rejected: stats.rejected,
          efficiency: stats.completed + stats.rejected > 0
            ? (stats.completed / (stats.completed + stats.rejected)) * 100
            : 0
        }))
      };
    });

    // Project-level blocker density
    const projectDensity = projects.map(project => {
      const projectBlockers = blockers.filter(b => b.project_id === project.id);
      return {
        name: project.name,
        location: project.location,
        total: projectBlockers.length,
        open: projectBlockers.filter(b => !['verified_complete', 'cancelled'].includes(b.status)).length,
        density: project.area ? (projectBlockers.length / project.area).toFixed(2) : 'N/A'
      };
    }).sort((a, b) => b.total - a.total);

    return {
      overview: {
        totalBlockers,
        openBlockers,
        completedBlockers,
        rejectedBlockers,
        completionRate: totalBlockers > 0 ? (completedBlockers / totalBlockers) * 100 : 0
      },
      openByContractor,
      resolutionTimes: {
        average: Math.round(avgResolutionTime * 10) / 10,
        byContractor: contractorResolutionTimes,
        data: resolutionTimes
      },
      mcResponseTimes: {
        average: Math.round(avgMcResponseTime * 10) / 10,
        data: mcResponseTimes
      },
      rejectionRates: {
        overall: Math.round(rejectionRate * 10) / 10,
        byContractor: contractorRejectionRates
      },
      blockerTypes: blockerTypeData,
      repeatLocations,
      peakTimes: {
        hourly: hourlyData,
        daily: dailyTrendData
      },
      priorityResolution: priorityData,
      documentation: {
        overall: Math.round(documentationRate * 10) / 10,
        byContractor: contractorDocCompliance
      },
      performanceTrends,
      projectDensity
    };
  }, [blockers, contractors, projects, statusHistory]);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const dashboard = document.getElementById('analytics-dashboard');
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`blocker-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportData = () => {
    const data = {
      dateRange,
      analytics,
      blockers: blockers.map(b => ({
        id: b.id,
        title: b.title,
        status: b.status,
        priority: b.priority,
        type: b.type,
        location: b.location,
        created_at: b.created_at,
        resolved_at: b.resolved_at,
        assigned_to: b.assigned_to?.full_name,
        created_by: b.created_by?.full_name,
        project: b.project?.name
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocker-analytics-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-lg mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Analytics</h3>
          <p className="text-slate-600">Gathering insights from your blocker data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-safety-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics.overview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-8">
          <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Data Available</h3>
          <p className="text-slate-600">No blocker data found for the selected date range.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="analytics-dashboard" className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-gradient-construction shadow-construction-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold text-white mb-2 text-shadow-lg">
                Analytics Dashboard
              </h1>
              <p className="text-construction-100 text-lg">
                Comprehensive insights and performance metrics
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-right">
              <div className="flex gap-3">
                <div className="flex flex-col">
                  <label className="text-construction-100 text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    max={dateRange.end}
                    className="form-input text-slate-900 bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-construction-100 text-sm font-medium mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    min={dateRange.start}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="form-input text-slate-900 bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={exportData}
                  className="btn btn-outline bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                  title="Export raw data as JSON"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export Data
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="btn btn-secondary bg-white text-construction-600 border-white hover:bg-construction-50"
                  title="Export dashboard as PDF"
                >
                  {exporting ? (
                    <div className="spinner-sm mr-2" />
                  ) : (
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  )}
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Metrics */}
        <Transition
          appear
          show={visibleCharts.overview}
          as={Fragment}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-1 translate-y-0"
        >
          <div className="card-construction mb-8">
            <div className="p-6 border-b border-construction-200 bg-gradient-to-r from-construction-50 to-construction-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-construction-900 mb-1">
                    Overview Metrics
                  </h2>
                  <p className="text-construction-700">
                    Key performance indicators at a glance
                  </p>
                </div>
                <button
                  onClick={() => setVisibleCharts(prev => ({ ...prev, overview: !prev.overview }))}
                  className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200"
                >
                  <ChevronUpIcon className="h-5 w-5 text-construction-700" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="card-hover bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-l-4 border-blue-500">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {analytics.overview.totalBlockers}
                  </div>
                  <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
                    Total Blockers
                  </div>
                </div>
                <div className="card-hover bg-gradient-to-br from-warning-50 to-warning-100 p-6 border-l-4 border-warning-500">
                  <div className="text-3xl font-bold text-warning-700 mb-2">
                    {analytics.overview.openBlockers}
                  </div>
                  <div className="text-warning-600 font-semibold text-sm uppercase tracking-wider">
                    Open Blockers
                  </div>
                </div>
                <div className="card-hover bg-gradient-to-br from-success-50 to-success-100 p-6 border-l-4 border-success-500">
                  <div className="text-3xl font-bold text-success-700 mb-2">
                    {analytics.overview.completedBlockers}
                  </div>
                  <div className="text-success-600 font-semibold text-sm uppercase tracking-wider">
                    Completed
                  </div>
                </div>
                <div className="card-hover bg-gradient-to-br from-safety-50 to-safety-100 p-6 border-l-4 border-safety-500">
                  <div className="text-3xl font-bold text-safety-700 mb-2">
                    {analytics.overview.rejectedBlockers}
                  </div>
                  <div className="text-safety-600 font-semibold text-sm uppercase tracking-wider">
                    Rejected
                  </div>
                </div>
                <div className="card-hover bg-gradient-to-br from-construction-50 to-construction-100 p-6 border-l-4 border-construction-500">
                  <div className="text-3xl font-bold text-construction-700 mb-2">
                    {Math.round(analytics.overview.completionRate)}%
                  </div>
                  <div className="text-construction-600 font-semibold text-sm uppercase tracking-wider">
                    Completion Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        {/* Open Blockers by Contractor */}
        {visibleCharts.contractorPerformance && analytics.openByContractor.length > 0 && (
          <Transition
            appear
            show={true}
            as={Fragment}
            enter="transition ease-out duration-300 delay-100"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-1 translate-y-0"
          >
            <div className="card mb-8">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-slate-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Open Blockers by Contractor
                      </h2>
                      <p className="text-slate-600 text-sm">
                        Current workload distribution across team members
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setVisibleCharts(prev => ({ ...prev, contractorPerformance: !prev.contractorPerformance }))}
                    className="p-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                  >
                    <ChevronUpIcon className="h-5 w-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.openByContractor} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="open" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Transition>
        )}

        {/* Resolution Times */}
        {visibleCharts.resolutionTimes && analytics.resolutionTimes.byContractor.length > 0 && (
          <Transition
            appear
            show={true}
            as={Fragment}
            enter="transition ease-out duration-300 delay-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-1 translate-y-0"
          >
            <div className="card mb-8">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-6 w-6 text-slate-600 mr-3" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Average Resolution Times
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-construction-100 text-construction-800">
                          Overall: {analytics.resolutionTimes.average}h
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          MC Response: {analytics.mcResponseTimes.average}h
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setVisibleCharts(prev => ({ ...prev, resolutionTimes: !prev.resolutionTimes }))}
                    className="p-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
                  >
                    <ChevronUpIcon className="h-5 w-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={analytics.resolutionTimes.byContractor} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis yAxisId="hours" label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }} tick={{ fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis yAxisId="count" orientation="right" label={{ value: 'Count', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b' } }} tick={{ fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar yAxisId="hours" dataKey="avgHours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="count" type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Transition>
        )}

      {/* Blocker Types */}
      {visibleCharts.blockerTypes && analytics.blockerTypes.length > 0 && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Blocker Types Distribution</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, blockerTypes: !prev.blockerTypes }))}
            >
              ➖
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.blockerTypes}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {analytics.blockerTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Repeat Locations */}
      {visibleCharts.locations && analytics.repeatLocations.length > 0 && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Repeat Blocker Locations</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, locations: !prev.locations }))}
            >
              ➖
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.repeatLocations.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="location"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Peak Creation Times */}
      {visibleCharts.peakTimes && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Peak Creation Times</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, peakTimes: !prev.peakTimes }))}
            >
              ➖
            </button>
          </div>
          <div className="charts-row">
            <div className="chart-container half">
              <h3>Hourly Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.peakTimes.hourly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container half">
              <h3>Daily Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.peakTimes.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Priority Resolution Rates */}
      {visibleCharts.priorities && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Resolution Rates by Priority</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, priorities: !prev.priorities }))}
            >
              ➖
            </button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analytics.priorityResolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis yAxisId="count" />
                <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Bar yAxisId="count" dataKey="total" fill="#e5e7eb" name="Total" />
                <Bar yAxisId="count" dataKey="resolved" fill="#10b981" name="Resolved" />
                <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={3} name="Resolution Rate %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Documentation Compliance */}
      {visibleCharts.documentation && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Documentation Compliance</h2>
            <div className="metric-highlight">
              Overall Rate: {analytics.documentation.overall}%
            </div>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, documentation: !prev.documentation }))}
            >
              ➖
            </button>
          </div>
          {analytics.documentation.byContractor.length > 0 && (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.documentation.byContractor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Documentation Rate']} />
                  <Bar dataKey="rate" fill="#84cc16" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Contractor Performance Trends */}
      {visibleCharts.trends && analytics.performanceTrends.some(t => t.data.length > 0) && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Contractor Performance Trends</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, trends: !prev.trends }))}
            >
              ➖
            </button>
          </div>
          {analytics.performanceTrends.filter(t => t.data.length > 0).map((trend, index) => (
            <div key={trend.name} className="chart-container">
              <h3>{trend.name} Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={trend.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="count" />
                  <YAxis yAxisId="efficiency" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Bar yAxisId="count" dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar yAxisId="count" dataKey="rejected" fill="#ef4444" name="Rejected" />
                  <Line yAxisId="efficiency" type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} name="Efficiency %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Project Density */}
      {visibleCharts.projectDensity && analytics.projectDensity.length > 0 && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Project-Level Blocker Density</h2>
            <button
              className="toggle-btn"
              onClick={() => setVisibleCharts(prev => ({ ...prev, projectDensity: !prev.projectDensity }))}
            >
              ➖
            </button>
          </div>
          <div className="project-density-table">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Location</th>
                  <th>Total Blockers</th>
                  <th>Open Blockers</th>
                  <th>Density (per unit area)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.projectDensity.map((project, index) => (
                  <tr key={index}>
                    <td>{project.name}</td>
                    <td>{project.location}</td>
                    <td>{project.total}</td>
                    <td>{project.open}</td>
                    <td>{project.density}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Rates */}
      {visibleCharts.rejectionRates && analytics.rejectionRates.byContractor.length > 0 && (
        <div className="chart-section">
          <div className="section-header">
            <h2>Rejection Rates</h2>
            <div className="metric-highlight">
              Overall Rate: {analytics.rejectionRates.overall}%
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.rejectionRates.byContractor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Rejection Rate']} />
                <Bar dataKey="rate" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;