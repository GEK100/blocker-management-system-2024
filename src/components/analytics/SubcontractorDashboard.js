import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const SubcontractorDashboard = ({ companyId, userId, userRole }) => {
  const [data, setData] = useState({
    personalStats: {
      assignedBlockers: 0,
      completedBlockers: 0,
      avgCompletionTime: 0,
      completionRate: 0,
      responseTime: 0,
      qualityScore: 0
    },
    recentBlockers: [],
    performanceTrend: [],
    categoryPerformance: [],
    timeAnalysis: [],
    achievements: [],
    currentRank: 0,
    totalSubcontractors: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchSubcontractorData();
  }, [dateRange, companyId, userId]);

  const fetchSubcontractorData = async () => {
    if (!companyId || !userId) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch user's blockers
      const { data: myBlockers } = await supabase
        .from('blockers')
        .select(`
          *,
          project:projects(name),
          status_history(*),
          created_by:users!created_by(first_name, last_name)
        `)
        .eq('assigned_to', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch all company blockers for comparison
      const { data: allBlockers } = await supabase
        .from('blockers')
        .select(`
          assigned_to,
          status,
          created_at,
          updated_at,
          category,
          priority,
          users!assigned_to(first_name, last_name, role)
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      // Fetch all subcontractors for ranking
      const { data: subcontractors } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .in('role', ['subcontractor', 'field_worker']);

      // Process personal analytics
      const processedData = processSubcontractorAnalytics(
        myBlockers || [],
        allBlockers || [],
        subcontractors || [],
        userId
      );

      setData(processedData);

    } catch (error) {
      console.error('Error fetching subcontractor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSubcontractorAnalytics = (myBlockers, allBlockers, subcontractors, userId) => {
    // Personal stats
    const completedBlockers = myBlockers.filter(b => b.status === 'verified_complete');
    const completionRate = myBlockers.length > 0 ? Math.round((completedBlockers.length / myBlockers.length) * 100) : 0;

    // Calculate completion times
    const completionTimes = completedBlockers.map(blocker => {
      const created = new Date(blocker.created_at);
      const completed = new Date(blocker.updated_at);
      return (completed - created) / (1000 * 60 * 60); // hours
    });

    const avgCompletionTime = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    // Calculate response time (time to start work)
    const responseTimes = myBlockers.map(blocker => {
      const statusHistory = blocker.status_history?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const startedWork = statusHistory?.find(h => h.status === 'in_progress');
      if (startedWork) {
        const assigned = new Date(blocker.created_at);
        const started = new Date(startedWork.created_at);
        return (started - assigned) / (1000 * 60 * 60); // hours
      }
      return null;
    }).filter(Boolean);

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Calculate quality score (based on completion rate, documentation, and no rejections)
    const rejectedBlockers = myBlockers.filter(b => b.status === 'rejected').length;
    const blockersWithPhotos = myBlockers.filter(b => b.photo_urls && b.photo_urls.length > 0).length;
    const documentationScore = myBlockers.length > 0 ? (blockersWithPhotos / myBlockers.length) * 100 : 100;
    const rejectionPenalty = myBlockers.length > 0 ? (rejectedBlockers / myBlockers.length) * 30 : 0;
    const qualityScore = Math.max(0, Math.round(completionRate * 0.5 + documentationScore * 0.3 + (100 - rejectionPenalty) * 0.2));

    // Performance trend over time
    const performanceTrend = processPerformanceTrend(myBlockers);

    // Category performance
    const categoryPerformance = processCategoryPerformance(myBlockers);

    // Time analysis
    const timeAnalysis = processTimeAnalysis(myBlockers);

    // Calculate ranking
    const { currentRank, totalSubcontractors } = calculateRanking(allBlockers, subcontractors, userId);

    // Generate achievements
    const achievements = generateAchievements(myBlockers, completionRate, avgCompletionTime, qualityScore, currentRank, totalSubcontractors);

    return {
      personalStats: {
        assignedBlockers: myBlockers.length,
        completedBlockers: completedBlockers.length,
        avgCompletionTime,
        completionRate,
        responseTime: avgResponseTime,
        qualityScore
      },
      recentBlockers: myBlockers.slice(0, 10),
      performanceTrend,
      categoryPerformance,
      timeAnalysis,
      achievements,
      currentRank,
      totalSubcontractors
    };
  };

  const processPerformanceTrend = (blockers) => {
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
        assigned: dayBlockers.length,
        completed: dayCompleted.length
      };
    });
  };

  const processCategoryPerformance = (blockers) => {
    const categories = {};

    blockers.forEach(blocker => {
      const category = blocker.category || 'Other';
      if (!categories[category]) {
        categories[category] = {
          category,
          total: 0,
          completed: 0,
          avgTime: 0,
          times: []
        };
      }

      categories[category].total++;

      if (blocker.status === 'verified_complete') {
        categories[category].completed++;
        const created = new Date(blocker.created_at);
        const completed = new Date(blocker.updated_at);
        const time = (completed - created) / (1000 * 60 * 60); // hours
        categories[category].times.push(time);
      }
    });

    return Object.values(categories).map(cat => ({
      ...cat,
      completionRate: Math.round((cat.completed / cat.total) * 100),
      avgTime: cat.times.length > 0
        ? Math.round(cat.times.reduce((a, b) => a + b, 0) / cat.times.length)
        : 0
    }));
  };

  const processTimeAnalysis = (blockers) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      completed: 0
    }));

    blockers.filter(b => b.status === 'verified_complete').forEach(blocker => {
      const hour = new Date(blocker.updated_at).getHours();
      hourlyData[hour].completed++;
    });

    return hourlyData;
  };

  const calculateRanking = (allBlockers, subcontractors, userId) => {
    const subcontractorStats = {};

    // Initialize all subcontractors
    subcontractors.forEach(sub => {
      subcontractorStats[sub.id] = {
        id: sub.id,
        name: `${sub.first_name} ${sub.last_name}`,
        completed: 0,
        total: 0,
        completionRate: 0
      };
    });

    // Process blockers
    allBlockers.forEach(blocker => {
      if (blocker.assigned_to && subcontractorStats[blocker.assigned_to]) {
        subcontractorStats[blocker.assigned_to].total++;
        if (blocker.status === 'verified_complete') {
          subcontractorStats[blocker.assigned_to].completed++;
        }
      }
    });

    // Calculate completion rates and sort
    const rankings = Object.values(subcontractorStats)
      .filter(sub => sub.total > 0) // Only include subcontractors with assignments
      .map(sub => ({
        ...sub,
        completionRate: Math.round((sub.completed / sub.total) * 100)
      }))
      .sort((a, b) => b.completionRate - a.completionRate || b.completed - a.completed);

    const currentRank = rankings.findIndex(sub => sub.id === userId) + 1;

    return {
      currentRank: currentRank || rankings.length + 1,
      totalSubcontractors: rankings.length
    };
  };

  const generateAchievements = (blockers, completionRate, avgTime, qualityScore, rank, total) => {
    const achievements = [];

    // Completion-based achievements
    if (completionRate >= 95) {
      achievements.push({ title: 'Excellence Award', description: '95%+ completion rate', icon: '🏆', color: 'gold' });
    } else if (completionRate >= 85) {
      achievements.push({ title: 'High Performer', description: '85%+ completion rate', icon: '⭐', color: 'success' });
    }

    // Speed-based achievements
    if (avgTime <= 4) {
      achievements.push({ title: 'Speed Demon', description: 'Average 4h completion', icon: '⚡', color: 'warning' });
    } else if (avgTime <= 8) {
      achievements.push({ title: 'Quick Resolver', description: 'Fast completion times', icon: '🚀', color: 'blue' });
    }

    // Quality-based achievements
    if (qualityScore >= 90) {
      achievements.push({ title: 'Quality Champion', description: '90%+ quality score', icon: '💎', color: 'construction' });
    }

    // Ranking-based achievements
    if (rank === 1) {
      achievements.push({ title: 'Top Performer', description: '#1 in company', icon: '👑', color: 'gold' });
    } else if (rank <= Math.ceil(total * 0.1)) {
      achievements.push({ title: 'Top 10%', description: 'Elite performer', icon: '🥇', color: 'success' });
    } else if (rank <= Math.ceil(total * 0.25)) {
      achievements.push({ title: 'Top 25%', description: 'Strong performer', icon: '🥈', color: 'slate' });
    }

    // Milestone achievements
    const completedCount = blockers.filter(b => b.status === 'verified_complete').length;
    if (completedCount >= 100) {
      achievements.push({ title: 'Century Club', description: '100+ completions', icon: '💯', color: 'construction' });
    } else if (completedCount >= 50) {
      achievements.push({ title: 'Half Century', description: '50+ completions', icon: '🎯', color: 'blue' });
    }

    return achievements.slice(0, 6); // Show max 6 achievements
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
      {/* Header with Personal Ranking */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">My Performance</h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <TrophyIcon className="h-5 w-5 text-construction-600" />
              <span className="text-sm text-slate-600">
                Ranked #{data.currentRank} of {data.totalSubcontractors}
              </span>
            </div>
            <Badge variant="construction" size="sm">
              Quality Score: {data.personalStats.qualityScore}%
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Personal Performance Metrics */}
      <CardGrid columns={4}>
        <StatCard
          title="Assigned to Me"
          value={data.personalStats.assignedBlockers.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="construction"
        />
        <StatCard
          title="Completed"
          value={data.personalStats.completedBlockers.toLocaleString()}
          icon={CheckCircleIcon}
          color="success"
          change={`${data.personalStats.completionRate}% rate`}
        />
        <StatCard
          title="Avg Completion"
          value={`${data.personalStats.avgCompletionTime}h`}
          icon={ClockIcon}
          color="blue"
          change={`${data.personalStats.responseTime}h response`}
        />
        <StatCard
          title="Quality Score"
          value={`${data.personalStats.qualityScore}%`}
          icon={StarIcon}
          color="warning"
        />
      </CardGrid>

      {/* Achievements */}
      {data.achievements.length > 0 && (
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Achievements</h3>
            <p className="text-sm text-slate-600">Your recent accomplishments</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-medium text-slate-900">{achievement.title}</h4>
                    <p className="text-sm text-slate-600">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Performance Trend</h3>
            <p className="text-sm text-slate-600">Daily assignments vs completions</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="assigned" stroke="#ed7611" strokeWidth={2} name="Assigned" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Time Analysis */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Completion Times</h3>
            <p className="text-sm text-slate-600">Most productive hours</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.timeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Performance by Category</h3>
          <p className="text-sm text-slate-600">Your strengths across different issue types</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.categoryPerformance.map((category, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{category.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {category.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {category.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2 max-w-20">
                        <div
                          className="bg-construction-600 h-2 rounded-full"
                          style={{ width: `${category.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-900">{category.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {category.avgTime}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Work */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recent Assignments</h3>
          <p className="text-sm text-slate-600">Your latest work items</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.recentBlockers.map((blocker) => (
                <tr key={blocker.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{blocker.title}</div>
                    <div className="text-sm text-slate-500">{blocker.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {blocker.project?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        blocker.status === 'verified_complete' ? 'success' :
                        blocker.status === 'in_progress' ? 'warning' :
                        blocker.status === 'rejected' ? 'danger' : 'secondary'
                      }
                      size="sm"
                    >
                      {blocker.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        blocker.priority === 'high' ? 'priority-high' :
                        blocker.priority === 'medium' ? 'priority-medium' : 'priority-low'
                      }
                      size="sm"
                    >
                      {blocker.priority?.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(blocker.created_at).toLocaleDateString()}
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

export default SubcontractorDashboard;