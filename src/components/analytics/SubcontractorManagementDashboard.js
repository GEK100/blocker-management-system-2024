import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { StatCard, CardGrid } from '../../design-system/components/Card';
import Badge from '../../design-system/components/Badge';
import Button from '../../design-system/components/Button';
import {
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';

const SubcontractorManagementDashboard = ({ companyId, userId }) => {
  const [data, setData] = useState({
    teamStats: {
      totalTeamMembers: 0,
      activeMembers: 0,
      avgCompletionRate: 0,
      totalAssigned: 0,
      totalCompleted: 0,
      teamRanking: 0
    },
    teamPerformance: [],
    comparativeMetrics: [],
    skillAnalysis: [],
    workloadDistribution: [],
    performanceTrends: [],
    teamLeaderboard: [],
    improvementAreas: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [sortBy, setSortBy] = useState('completionRate');

  useEffect(() => {
    fetchTeamData();
  }, [dateRange, companyId, userId]);

  const fetchTeamData = async () => {
    if (!companyId || !userId) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Get current user's managed team members
      const { data: currentUser } = await supabase
        .from('users')
        .select('role, team_id')
        .eq('id', userId)
        .single();

      // Fetch team members based on management hierarchy
      let teamMembersQuery = supabase
        .from('users')
        .select(`
          id, first_name, last_name, role, created_at,
          last_login, team_id
        `)
        .eq('company_id', companyId);

      // If subcontractor_manager, get their team
      if (currentUser?.role === 'subcontractor_manager' && currentUser?.team_id) {
        teamMembersQuery = teamMembersQuery.eq('team_id', currentUser.team_id);
      } else {
        // Otherwise get all subcontractors and field workers
        teamMembersQuery = teamMembersQuery.in('role', ['subcontractor', 'field_worker']);
      }

      const { data: teamMembers } = await teamMembersQuery;

      if (!teamMembers || teamMembers.length === 0) {
        setData({
          teamStats: {
            totalTeamMembers: 0,
            activeMembers: 0,
            avgCompletionRate: 0,
            totalAssigned: 0,
            totalCompleted: 0,
            teamRanking: 0
          },
          teamPerformance: [],
          comparativeMetrics: [],
          skillAnalysis: [],
          workloadDistribution: [],
          performanceTrends: [],
          teamLeaderboard: [],
          improvementAreas: []
        });
        return;
      }

      const teamIds = teamMembers.map(member => member.id);

      // Fetch blockers assigned to team members
      const { data: teamBlockers } = await supabase
        .from('blockers')
        .select(`
          *,
          assigned_user:users!assigned_to(id, first_name, last_name),
          project:projects(name),
          status_history(*)
        `)
        .in('assigned_to', teamIds)
        .gte('created_at', startDate.toISOString());

      // Fetch all company blockers for comparison
      const { data: allBlockers } = await supabase
        .from('blockers')
        .select(`
          assigned_to,
          status,
          created_at,
          updated_at,
          category,
          priority
        `)
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString());

      // Process team analytics
      const processedData = processTeamAnalytics(
        teamMembers,
        teamBlockers || [],
        allBlockers || []
      );

      setData(processedData);

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTeamAnalytics = (teamMembers, teamBlockers, allBlockers) => {
    // Calculate team stats
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 7); // Active within last 7 days

    const activeMembers = teamMembers.filter(member =>
      member.last_login && new Date(member.last_login) > activeThreshold
    ).length;

    const totalAssigned = teamBlockers.length;
    const totalCompleted = teamBlockers.filter(b => b.status === 'verified_complete').length;
    const avgCompletionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    // Process individual team member performance
    const teamPerformance = processTeamMemberPerformance(teamMembers, teamBlockers);

    // Calculate comparative metrics against company average
    const comparativeMetrics = calculateComparativeMetrics(teamBlockers, allBlockers);

    // Analyze skills by category
    const skillAnalysis = analyzeSkillsByCategory(teamBlockers);

    // Workload distribution
    const workloadDistribution = calculateWorkloadDistribution(teamMembers, teamBlockers);

    // Performance trends over time
    const performanceTrends = calculatePerformanceTrends(teamBlockers);

    // Team leaderboard
    const teamLeaderboard = createTeamLeaderboard(teamPerformance);

    // Improvement areas
    const improvementAreas = identifyImprovementAreas(teamPerformance);

    // Calculate team ranking (simplified - could be enhanced)
    const teamRanking = Math.min(5, Math.max(1, Math.round(avgCompletionRate / 20)));

    return {
      teamStats: {
        totalTeamMembers: teamMembers.length,
        activeMembers,
        avgCompletionRate,
        totalAssigned,
        totalCompleted,
        teamRanking
      },
      teamPerformance,
      comparativeMetrics,
      skillAnalysis,
      workloadDistribution,
      performanceTrends,
      teamLeaderboard,
      improvementAreas
    };
  };

  const processTeamMemberPerformance = (teamMembers, teamBlockers) => {
    return teamMembers.map(member => {
      const memberBlockers = teamBlockers.filter(b => b.assigned_to === member.id);
      const completedBlockers = memberBlockers.filter(b => b.status === 'verified_complete');
      const completionRate = memberBlockers.length > 0
        ? Math.round((completedBlockers.length / memberBlockers.length) * 100)
        : 0;

      // Calculate average completion time
      const completionTimes = completedBlockers.map(blocker => {
        const created = new Date(blocker.created_at);
        const completed = new Date(blocker.updated_at);
        return (completed - created) / (1000 * 60 * 60); // hours
      });

      const avgCompletionTime = completionTimes.length > 0
        ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
        : 0;

      // Calculate quality score
      const rejectedCount = memberBlockers.filter(b => b.status === 'rejected').length;
      const withPhotos = memberBlockers.filter(b => b.photo_urls && b.photo_urls.length > 0).length;
      const documentationRate = memberBlockers.length > 0 ? (withPhotos / memberBlockers.length) * 100 : 100;
      const rejectionPenalty = memberBlockers.length > 0 ? (rejectedCount / memberBlockers.length) * 30 : 0;
      const qualityScore = Math.max(0, Math.round(completionRate * 0.5 + documentationRate * 0.3 + (100 - rejectionPenalty) * 0.2));

      // Calculate response time
      const responseTimes = memberBlockers.map(blocker => {
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

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        role: member.role,
        assigned: memberBlockers.length,
        completed: completedBlockers.length,
        completionRate,
        avgCompletionTime,
        avgResponseTime,
        qualityScore,
        isActive: member.last_login && new Date(member.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
    }).sort((a, b) => {
      switch (sortBy) {
        case 'completionRate':
          return b.completionRate - a.completionRate;
        case 'qualityScore':
          return b.qualityScore - a.qualityScore;
        case 'completed':
          return b.completed - a.completed;
        case 'avgCompletionTime':
          return a.avgCompletionTime - b.avgCompletionTime;
        default:
          return b.completionRate - a.completionRate;
      }
    });
  };

  const calculateComparativeMetrics = (teamBlockers, allBlockers) => {
    const teamCompleted = teamBlockers.filter(b => b.status === 'verified_complete').length;
    const teamCompletionRate = teamBlockers.length > 0 ? (teamCompleted / teamBlockers.length) * 100 : 0;

    const companyCompleted = allBlockers.filter(b => b.status === 'verified_complete').length;
    const companyCompletionRate = allBlockers.length > 0 ? (companyCompleted / allBlockers.length) * 100 : 0;

    // Calculate team completion times
    const teamCompletionTimes = teamBlockers
      .filter(b => b.status === 'verified_complete')
      .map(b => (new Date(b.updated_at) - new Date(b.created_at)) / (1000 * 60 * 60));

    const teamAvgTime = teamCompletionTimes.length > 0
      ? teamCompletionTimes.reduce((a, b) => a + b, 0) / teamCompletionTimes.length
      : 0;

    // Calculate company completion times
    const companyCompletionTimes = allBlockers
      .filter(b => b.status === 'verified_complete')
      .map(b => (new Date(b.updated_at) - new Date(b.created_at)) / (1000 * 60 * 60));

    const companyAvgTime = companyCompletionTimes.length > 0
      ? companyCompletionTimes.reduce((a, b) => a + b, 0) / companyCompletionTimes.length
      : 0;

    return [
      {
        metric: 'Completion Rate',
        teamValue: Math.round(teamCompletionRate),
        companyValue: Math.round(companyCompletionRate),
        unit: '%',
        trend: teamCompletionRate > companyCompletionRate ? 'up' : 'down'
      },
      {
        metric: 'Avg Completion Time',
        teamValue: Math.round(teamAvgTime),
        companyValue: Math.round(companyAvgTime),
        unit: 'hours',
        trend: teamAvgTime < companyAvgTime ? 'up' : 'down'
      },
      {
        metric: 'Total Completed',
        teamValue: teamCompleted,
        companyValue: companyCompleted,
        unit: 'items',
        trend: 'neutral'
      }
    ];
  };

  const analyzeSkillsByCategory = (teamBlockers) => {
    const categories = {};

    teamBlockers.forEach(blocker => {
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
        const time = (new Date(blocker.updated_at) - new Date(blocker.created_at)) / (1000 * 60 * 60);
        categories[category].times.push(time);
      }
    });

    return Object.values(categories).map(cat => ({
      subject: cat.category,
      completionRate: Math.round((cat.completed / cat.total) * 100),
      efficiency: cat.times.length > 0
        ? Math.max(0, 100 - Math.round(cat.times.reduce((a, b) => a + b, 0) / cat.times.length / 24 * 100))
        : 50,
      volume: Math.min(100, cat.total * 10) // Scale volume for radar chart
    }));
  };

  const calculateWorkloadDistribution = (teamMembers, teamBlockers) => {
    return teamMembers.map(member => {
      const memberBlockers = teamBlockers.filter(b => b.assigned_to === member.id);
      return {
        name: `${member.first_name} ${member.last_name}`,
        assigned: memberBlockers.length,
        completed: memberBlockers.filter(b => b.status === 'verified_complete').length,
        inProgress: memberBlockers.filter(b => b.status === 'in_progress').length,
        pending: memberBlockers.filter(b => b.status === 'assigned').length
      };
    });
  };

  const calculatePerformanceTrends = (teamBlockers) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const dayBlockers = teamBlockers.filter(b => b.created_at.startsWith(date));
      const dayCompleted = teamBlockers.filter(b =>
        b.status === 'verified_complete' && b.updated_at.startsWith(date)
      );

      return {
        date: new Date(date).toLocaleDateString(),
        assigned: dayBlockers.length,
        completed: dayCompleted.length,
        efficiency: dayBlockers.length > 0 ? Math.round((dayCompleted.length / dayBlockers.length) * 100) : 0
      };
    });
  };

  const createTeamLeaderboard = (teamPerformance) => {
    return teamPerformance
      .filter(member => member.assigned > 0) // Only include members with assignments
      .slice(0, 10) // Top 10
      .map((member, index) => ({
        ...member,
        rank: index + 1,
        score: Math.round((member.completionRate * 0.4) + (member.qualityScore * 0.4) + (Math.max(0, 100 - member.avgCompletionTime) * 0.2))
      }));
  };

  const identifyImprovementAreas = (teamPerformance) => {
    const areas = [];

    // Find members with low completion rates
    const lowPerformers = teamPerformance.filter(member =>
      member.assigned > 3 && member.completionRate < 70
    );

    if (lowPerformers.length > 0) {
      areas.push({
        area: 'Completion Rate',
        description: `${lowPerformers.length} team members with <70% completion rate`,
        members: lowPerformers.map(m => m.name).join(', '),
        priority: 'high'
      });
    }

    // Find members with slow response times
    const slowResponders = teamPerformance.filter(member =>
      member.assigned > 0 && member.avgResponseTime > 24
    );

    if (slowResponders.length > 0) {
      areas.push({
        area: 'Response Time',
        description: `${slowResponders.length} members taking >24h to respond`,
        members: slowResponders.map(m => m.name).join(', '),
        priority: 'medium'
      });
    }

    // Find members with quality issues
    const qualityIssues = teamPerformance.filter(member =>
      member.assigned > 0 && member.qualityScore < 80
    );

    if (qualityIssues.length > 0) {
      areas.push({
        area: 'Quality Score',
        description: `${qualityIssues.length} members with quality scores <80%`,
        members: qualityIssues.map(m => m.name).join(', '),
        priority: 'medium'
      });
    }

    return areas;
  };

  const handlePrint = () => {
    window.print();
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Team Performance Dashboard</h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <TrophyIcon className="h-5 w-5 text-construction-600" />
              <span className="text-sm text-slate-600">
                Team Ranking: #{data.teamStats.teamRanking}/5
              </span>
            </div>
            <Badge variant="construction" size="sm">
              {data.teamStats.activeMembers} Active Members
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-construction-500 focus:border-construction-500"
          >
            <option value="completionRate">Sort by Completion Rate</option>
            <option value="qualityScore">Sort by Quality Score</option>
            <option value="completed">Sort by Completed</option>
            <option value="avgCompletionTime">Sort by Speed</option>
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

      {/* Team Overview Stats */}
      <CardGrid columns={4}>
        <StatCard
          title="Team Members"
          value={data.teamStats.totalTeamMembers.toLocaleString()}
          icon={UserGroupIcon}
          color="construction"
          change={`${data.teamStats.activeMembers} active`}
        />
        <StatCard
          title="Total Assigned"
          value={data.teamStats.totalAssigned.toLocaleString()}
          icon={ExclamationTriangleIcon}
          color="warning"
        />
        <StatCard
          title="Completed"
          value={data.teamStats.totalCompleted.toLocaleString()}
          icon={TrophyIcon}
          color="success"
          change={`${data.teamStats.avgCompletionRate}% rate`}
        />
        <StatCard
          title="Team Performance"
          value={`${data.teamStats.avgCompletionRate}%`}
          icon={StarIcon}
          color="blue"
        />
      </CardGrid>

      {/* Comparative Metrics */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Team vs Company Average</h3>
          <p className="text-sm text-slate-600">How your team compares to company benchmarks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.comparativeMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <h4 className="text-sm font-medium text-slate-600 mb-2">{metric.metric}</h4>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-construction-600">
                      {metric.teamValue}{metric.unit}
                    </div>
                    <div className="text-xs text-slate-500">Your Team</div>
                  </div>
                  <div className="text-slate-400">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {metric.companyValue}{metric.unit}
                    </div>
                    <div className="text-xs text-slate-500">Company Avg</div>
                  </div>
                  {metric.trend === 'up' && (
                    <ArrowTrendingUpIcon className="h-5 w-5 text-success-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Team Performance Trends</h3>
            <p className="text-sm text-slate-600">Daily performance over time</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={data.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="assigned" stroke="#ed7611" strokeWidth={2} name="Assigned" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="efficiency" stroke="#8b5cf6" strokeWidth={2} name="Efficiency %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Skills Analysis Radar */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Team Skills Analysis</h3>
            <p className="text-sm text-slate-600">Performance by category</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RadarChart data={data.skillAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Completion Rate"
                    dataKey="completionRate"
                    stroke="#ed7611"
                    fill="#ed7611"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Efficiency"
                    dataKey="efficiency"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Workload Distribution</h3>
            <p className="text-sm text-slate-600">Assignment distribution across team</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.workloadDistribution} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                  <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
                  <Bar dataKey="pending" stackId="a" fill="#ef4444" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Team Leaderboard Chart */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Performance Scores</h3>
            <p className="text-sm text-slate-600">Overall performance ranking</p>
          </div>
          <div className="p-6">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <ScatterChart data={data.teamLeaderboard}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="completionRate" name="Completion Rate" />
                  <YAxis dataKey="qualityScore" name="Quality Score" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Completion Rate: {data.completionRate}%</p>
                            <p className="text-sm">Quality Score: {data.qualityScore}%</p>
                            <p className="text-sm">Overall Score: {data.score}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Team Members" dataKey="score" fill="#ed7611" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Individual Performance</h3>
          <p className="text-sm text-slate-600">Detailed metrics for each team member</p>
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
                  Quality Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.teamPerformance.map((member, index) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 && (
                        <div className="mr-2">
                          {index === 0 && <span className="text-yellow-500">🥇</span>}
                          {index === 1 && <span className="text-gray-400">🥈</span>}
                          {index === 2 && <span className="text-yellow-600">🥉</span>}
                        </div>
                      )}
                      <div className="text-sm font-medium text-slate-900">{member.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" size="sm">
                      {member.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {member.assigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2 max-w-16">
                        <div
                          className={`h-2 rounded-full ${
                            member.completionRate >= 90 ? 'bg-success-500' :
                            member.completionRate >= 75 ? 'bg-construction-500' :
                            member.completionRate >= 60 ? 'bg-warning-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-900">{member.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        member.qualityScore >= 90 ? 'success' :
                        member.qualityScore >= 80 ? 'primary' :
                        member.qualityScore >= 70 ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {member.qualityScore}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {member.avgCompletionTime}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={member.isActive ? 'success' : 'secondary'}
                      size="sm"
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Improvement Areas */}
      {data.improvementAreas.length > 0 && (
        <Card>
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Improvement Areas</h3>
            <p className="text-sm text-slate-600">Areas requiring attention</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.improvementAreas.map((area, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    area.priority === 'high' ? 'border-red-500 bg-red-50' :
                    area.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{area.area}</h4>
                      <p className="text-sm text-slate-600 mt-1">{area.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Affected members: {area.members}
                      </p>
                    </div>
                    <Badge
                      variant={
                        area.priority === 'high' ? 'danger' :
                        area.priority === 'medium' ? 'warning' : 'info'
                      }
                      size="sm"
                    >
                      {area.priority?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
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

export default SubcontractorManagementDashboard;