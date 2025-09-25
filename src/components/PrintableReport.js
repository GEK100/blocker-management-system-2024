import React, { useState, useEffect } from 'react';
import { useSmartAuth } from '../hooks/useSmartAuth';
import { supabase } from '../lib/supabase';
import { brandConfig } from '../design-system/brand';
import {
  BuildingOfficeIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PrintableReport = ({ reportType = 'summary', onClose }) => {
  const { user, userRole, companyId } = useSmartAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateReportData();
  }, [reportType, userRole, companyId, user?.id]);

  useEffect(() => {
    const handlePrintReport = (event) => {
      if (event.detail && event.detail.type) {
        generateReport(event.detail.type);
      }
    };

    window.addEventListener('printReport', handlePrintReport);
    return () => window.removeEventListener('printReport', handlePrintReport);
  }, []);

  const generateReportData = async () => {
    if (!user?.id || !companyId) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Last 30 days

      // Fetch data based on user role
      let reportData = {};

      switch (userRole) {
        case 'super_admin':
          reportData = await generateSuperAdminReport(startDate, endDate);
          break;
        case 'company_owner':
        case 'company_admin':
          reportData = await generateCompanyAdminReport(companyId, startDate, endDate);
          break;
        case 'main_contractor':
        case 'project_manager':
        case 'supervisor':
          reportData = await generateCompanyUserReport(companyId, user.id, userRole, startDate, endDate);
          break;
        case 'subcontractor_manager':
          reportData = await generateSubcontractorManagementReport(companyId, user.id, startDate, endDate);
          break;
        case 'subcontractor':
        case 'field_worker':
          reportData = await generateSubcontractorReport(companyId, user.id, startDate, endDate);
          break;
        default:
          reportData = { error: 'Unknown user role' };
      }

      setReportData({
        ...reportData,
        generatedAt: new Date(),
        reportType,
        userRole,
        dateRange: { start: startDate, end: endDate }
      });

    } catch (error) {
      console.error('Error generating report data:', error);
      setReportData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateSuperAdminReport = async (startDate, endDate) => {
    const [companiesRes, usersRes, blockersRes] = await Promise.all([
      supabase.from('companies').select('*', { count: 'exact' }),
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('blockers').select('*', { count: 'exact' }).gte('created_at', startDate.toISOString())
    ]);

    const { data: topCompanies } = await supabase
      .from('companies')
      .select(`
        name, subscription_status,
        blockers(count)
      `)
      .limit(10);

    return {
      title: 'Platform Analytics Report',
      summary: {
        totalCompanies: companiesRes.count,
        totalUsers: usersRes.count,
        newBlockers: blockersRes.count,
        monthlyRevenue: calculateMonthlyRevenue(topCompanies)
      },
      topCompanies: topCompanies?.slice(0, 5) || [],
      insights: generateSuperAdminInsights(companiesRes.count, usersRes.count, blockersRes.count)
    };
  };

  const generateCompanyAdminReport = async (companyId, startDate, endDate) => {
    // Fetch company data
    const { data: company } = await supabase
      .from('companies')
      .select('name, subscription_status')
      .eq('id', companyId)
      .single();

    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId);

    const { data: blockers } = await supabase
      .from('blockers')
      .select(`
        *,
        assigned_user:users!assigned_to(first_name, last_name)
      `)
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId);

    const completedBlockers = blockers?.filter(b => b.status === 'verified_complete') || [];
    const completionRate = blockers?.length > 0 ? Math.round((completedBlockers.length / blockers.length) * 100) : 0;

    return {
      title: `${company?.name} - Company Performance Report`,
      company: company,
      summary: {
        totalUsers: users?.length || 0,
        activeProjects: projects?.filter(p => p.status === 'active').length || 0,
        totalBlockers: blockers?.length || 0,
        completedBlockers: completedBlockers.length,
        completionRate
      },
      topPerformers: calculateTopPerformers(blockers || []),
      insights: generateCompanyInsights(users, projects, blockers)
    };
  };

  const generateCompanyUserReport = async (companyId, userId, userRole, startDate, endDate) => {
    // Fetch accessible blockers based on role
    let blockersQuery = supabase
      .from('blockers')
      .select(`
        *,
        assigned_user:users!assigned_to(first_name, last_name),
        project:projects(name)
      `)
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    // Filter based on user access level
    if (!['main_contractor', 'company_admin'].includes(userRole)) {
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);

      if (userProjects && userProjects.length > 0) {
        blockersQuery = blockersQuery.in('project_id', userProjects.map(up => up.project_id));
      }
    }

    const { data: blockers } = await blockersQuery;

    const openBlockers = blockers?.filter(b => !['verified_complete', 'cancelled'].includes(b.status)) || [];
    const overdueBlockers = blockers?.filter(b => {
      const dueDate = new Date(b.due_date);
      return dueDate < new Date() && !['verified_complete', 'cancelled'].includes(b.status);
    }) || [];

    return {
      title: 'Operational Metrics Report',
      summary: {
        totalBlockers: blockers?.length || 0,
        openBlockers: openBlockers.length,
        overdueBlockers: overdueBlockers.length,
        completionRate: blockers?.length > 0
          ? Math.round((blockers.filter(b => b.status === 'verified_complete').length / blockers.length) * 100)
          : 0
      },
      problemAreas: identifyProblemAreas(blockers || []),
      contractorPerformance: calculateContractorPerformance(blockers || []),
      insights: generateOperationalInsights(blockers, openBlockers, overdueBlockers)
    };
  };

  const generateSubcontractorManagementReport = async (companyId, userId, startDate, endDate) => {
    // Get team members
    const { data: currentUser } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', userId)
      .single();

    let teamMembersQuery = supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('company_id', companyId);

    if (currentUser?.team_id) {
      teamMembersQuery = teamMembersQuery.eq('team_id', currentUser.team_id);
    } else {
      teamMembersQuery = teamMembersQuery.in('role', ['subcontractor', 'field_worker']);
    }

    const { data: teamMembers } = await teamMembersQuery;
    const teamIds = teamMembers?.map(m => m.id) || [];

    const { data: teamBlockers } = await supabase
      .from('blockers')
      .select(`
        *,
        assigned_user:users!assigned_to(first_name, last_name)
      `)
      .in('assigned_to', teamIds)
      .gte('created_at', startDate.toISOString());

    const teamPerformance = calculateTeamPerformance(teamMembers || [], teamBlockers || []);

    return {
      title: 'Team Performance Report',
      summary: {
        teamSize: teamMembers?.length || 0,
        totalAssigned: teamBlockers?.length || 0,
        totalCompleted: teamBlockers?.filter(b => b.status === 'verified_complete').length || 0,
        avgCompletionRate: teamPerformance.reduce((acc, member) => acc + member.completionRate, 0) / Math.max(teamPerformance.length, 1)
      },
      teamPerformance,
      insights: generateTeamInsights(teamPerformance, teamBlockers)
    };
  };

  const generateSubcontractorReport = async (companyId, userId, startDate, endDate) => {
    const { data: myBlockers } = await supabase
      .from('blockers')
      .select(`
        *,
        project:projects(name)
      `)
      .eq('assigned_to', userId)
      .gte('created_at', startDate.toISOString());

    const completedBlockers = myBlockers?.filter(b => b.status === 'verified_complete') || [];
    const completionRate = myBlockers?.length > 0 ? Math.round((completedBlockers.length / myBlockers.length) * 100) : 0;

    // Calculate quality score
    const rejectedCount = myBlockers?.filter(b => b.status === 'rejected').length || 0;
    const withPhotos = myBlockers?.filter(b => b.photo_urls && b.photo_urls.length > 0).length || 0;
    const qualityScore = calculateQualityScore(myBlockers?.length || 0, completionRate, rejectedCount, withPhotos);

    return {
      title: 'Personal Performance Report',
      summary: {
        assignedBlockers: myBlockers?.length || 0,
        completedBlockers: completedBlockers.length,
        completionRate,
        qualityScore
      },
      recentWork: myBlockers?.slice(0, 10) || [],
      categoryPerformance: calculateCategoryPerformance(myBlockers || []),
      insights: generatePersonalInsights(myBlockers, completionRate, qualityScore)
    };
  };

  // Helper functions
  const calculateMonthlyRevenue = (companies) => {
    const pricing = { basic: 99, professional: 199, enterprise: 399 };
    return companies?.reduce((total, company) => {
      return total + (pricing[company.subscription_status] || 0);
    }, 0) || 0;
  };

  const calculateTopPerformers = (blockers) => {
    const performers = {};
    blockers.forEach(blocker => {
      if (blocker.assigned_user) {
        const key = `${blocker.assigned_user.first_name} ${blocker.assigned_user.last_name}`;
        if (!performers[key]) {
          performers[key] = { name: key, assigned: 0, completed: 0 };
        }
        performers[key].assigned++;
        if (blocker.status === 'verified_complete') {
          performers[key].completed++;
        }
      }
    });

    return Object.values(performers)
      .map(p => ({ ...p, completionRate: p.assigned > 0 ? Math.round((p.completed / p.assigned) * 100) : 0 }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  };

  const identifyProblemAreas = (blockers) => {
    const areas = {};
    blockers.forEach(blocker => {
      const area = blocker.location || 'Unknown Area';
      areas[area] = (areas[area] || 0) + 1;
    });

    return Object.entries(areas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));
  };

  const calculateContractorPerformance = (blockers) => {
    const contractors = {};
    blockers.forEach(blocker => {
      if (blocker.assigned_user) {
        const key = `${blocker.assigned_user.first_name} ${blocker.assigned_user.last_name}`;
        if (!contractors[key]) {
          contractors[key] = { name: key, assigned: 0, completed: 0 };
        }
        contractors[key].assigned++;
        if (blocker.status === 'verified_complete') {
          contractors[key].completed++;
        }
      }
    });

    return Object.values(contractors)
      .map(c => ({
        ...c,
        completionRate: c.assigned > 0 ? Math.round((c.completed / c.assigned) * 100) : 0
      }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 10);
  };

  const calculateTeamPerformance = (teamMembers, teamBlockers) => {
    return teamMembers.map(member => {
      const memberBlockers = teamBlockers.filter(b => b.assigned_to === member.id);
      const completed = memberBlockers.filter(b => b.status === 'verified_complete').length;
      return {
        name: `${member.first_name} ${member.last_name}`,
        assigned: memberBlockers.length,
        completed,
        completionRate: memberBlockers.length > 0 ? Math.round((completed / memberBlockers.length) * 100) : 0
      };
    });
  };

  const calculateCategoryPerformance = (blockers) => {
    const categories = {};
    blockers.forEach(blocker => {
      const category = blocker.category || 'Other';
      if (!categories[category]) {
        categories[category] = { category, total: 0, completed: 0 };
      }
      categories[category].total++;
      if (blocker.status === 'verified_complete') {
        categories[category].completed++;
      }
    });

    return Object.values(categories).map(cat => ({
      ...cat,
      completionRate: cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0
    }));
  };

  const calculateQualityScore = (total, completionRate, rejectedCount, withPhotos) => {
    if (total === 0) return 100;
    const documentationScore = (withPhotos / total) * 100;
    const rejectionPenalty = (rejectedCount / total) * 30;
    return Math.max(0, Math.round(completionRate * 0.5 + documentationScore * 0.3 + (100 - rejectionPenalty) * 0.2));
  };

  const generateSuperAdminInsights = (companies, users, blockers) => [
    `Platform has grown to ${companies} companies with ${users} total users`,
    `${blockers} new issues created in the last 30 days`,
    'Monitor subscription renewal rates and user engagement metrics'
  ];

  const generateCompanyInsights = (users, projects, blockers) => [
    `Team of ${users?.length || 0} members across ${projects?.filter(p => p.status === 'active').length || 0} active projects`,
    `${blockers?.length || 0} issues managed with ${Math.round(((blockers?.filter(b => b.status === 'verified_complete').length || 0) / Math.max(blockers?.length || 1, 1)) * 100)}% completion rate`,
    'Focus on improving response times and documentation compliance'
  ];

  const generateOperationalInsights = (blockers, openBlockers, overdueBlockers) => [
    `${openBlockers.length} issues currently open, ${overdueBlockers.length} overdue`,
    'Regular team meetings help maintain visibility on problem areas',
    'Consider workload rebalancing if certain contractors are overloaded'
  ];

  const generateTeamInsights = (teamPerformance, teamBlockers) => [
    `Team average completion rate: ${Math.round(teamPerformance.reduce((acc, m) => acc + m.completionRate, 0) / Math.max(teamPerformance.length, 1))}%`,
    `Top performer: ${teamPerformance.sort((a, b) => b.completionRate - a.completionRate)[0]?.name || 'N/A'}`,
    'Consider cross-training for skill development and backup coverage'
  ];

  const generatePersonalInsights = (blockers, completionRate, qualityScore) => [
    `Personal completion rate: ${completionRate}%, Quality score: ${qualityScore}%`,
    `Strong performance in ${blockers?.filter(b => b.status === 'verified_complete').length || 0} completed tasks`,
    'Continue maintaining high standards for documentation and timely completion'
  ];

  const generateReport = async (type = 'summary') => {
    setGenerating(true);
    try {
      if (type === 'pdf') {
        await generatePDF();
      } else {
        window.print();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('printable-report');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 190;
    const pageHeight = 290;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${reportData?.title || 'Report'}-${new Date().toLocaleDateString()}.pdf`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construction-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData || reportData.error) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error generating report: {reportData?.error || 'Unknown error'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto w-full">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Report Preview</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => generateReport('print')}
                disabled={generating}
                className="px-4 py-2 bg-construction-600 text-white rounded-lg hover:bg-construction-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Print'}
              </button>
              <button
                onClick={() => generateReport('pdf')}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6">
            <div id="printable-report" className="bg-white">
              {/* Report Header */}
              <div className="mb-8 border-b-2 border-construction-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-construction-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-construction-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900">{brandConfig.name}</h1>
                      <p className="text-slate-600">{brandConfig.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{reportData.generatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{reportData.title}</h2>
                <p className="text-slate-600">
                  Report Period: {reportData.dateRange.start.toLocaleDateString()} - {reportData.dateRange.end.toLocaleDateString()}
                </p>
              </div>

              {/* Executive Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                  Executive Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-construction-600">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                      <div className="text-sm text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              {reportData.insights && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {reportData.insights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-construction-600 font-bold">•</span>
                        <span className="text-slate-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Role-specific Sections */}
              {reportData.topCompanies && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Top Companies
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.topCompanies.map((company, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-slate-900">{company.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{company.subscription_status}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{company.blockers?.length || 0} issues</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.topPerformers && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Top Performers
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.topPerformers.map((performer, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-slate-900">{performer.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{performer.assigned}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{performer.completed}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{performer.completionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.problemAreas && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Problem Areas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.problemAreas.map((area, index) => (
                      <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-slate-900">{area.area}</div>
                        <div className="text-sm text-slate-600">{area.count} issues</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.contractorPerformance && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Contractor Performance
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contractor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.contractorPerformance.map((contractor, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-slate-900">{contractor.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{contractor.assigned}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{contractor.completed}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2 max-w-16">
                                  <div
                                    className="bg-construction-600 h-2 rounded-full"
                                    style={{ width: `${contractor.completionRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-900">{contractor.completionRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.teamPerformance && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Team Performance
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Team Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.teamPerformance.map((member, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-slate-900">{member.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{member.assigned}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{member.completed}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{member.completionRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportData.recentWork && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Recent Work
                  </h3>
                  <div className="space-y-3">
                    {reportData.recentWork.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-900">{item.title}</div>
                            <div className="text-sm text-slate-600">{item.category} • {item.project?.name}</div>
                          </div>
                          <div className="text-sm text-slate-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.categoryPerformance && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                    Performance by Category
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.categoryPerformance.map((category, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-slate-900">{category.category}</div>
                            <div className="text-sm text-slate-600">{category.completed} of {category.total}</div>
                          </div>
                          <div className="text-lg font-bold text-construction-600">
                            {category.completionRate}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Footer */}
              <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Generated on {reportData.generatedAt.toLocaleString()}</span>
                </div>
                <p>This report was generated by {brandConfig.name} Analytics System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default PrintableReport;
