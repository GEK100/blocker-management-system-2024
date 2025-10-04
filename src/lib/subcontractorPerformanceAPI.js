import { supabase } from './supabase';

class SubcontractorPerformanceAPI {
  // Get all subcontractor profiles for a company
  async getSubcontractorProfiles(companyId, filters = {}) {
    try {
      let query = supabase
        .from('procurement_dashboard')
        .select('*')
        .eq('company_id', companyId);

      // Apply filters
      if (filters.grade) {
        query = query.eq('performance_grade', filters.grade);
      }
      if (filters.tradeType) {
        query = query.eq('trade_type', filters.tradeType);
      }
      if (filters.recommendation) {
        query = query.eq('recommendation_type', filters.recommendation);
      }
      if (filters.minScore !== undefined) {
        query = query.gte('overall_risk_score', filters.minScore);
      }
      if (filters.maxScore !== undefined) {
        query = query.lte('overall_risk_score', filters.maxScore);
      }
      if (filters.blacklisted !== undefined) {
        query = query.eq('blacklist_status', filters.blacklisted);
      }

      const { data, error } = await query.order('overall_risk_score', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching subcontractor profiles:', error);
      return { success: false, error: error.message };
    }
  }

  // Get detailed performance metrics for a specific subcontractor
  async getSubcontractorPerformanceDetails(subcontractorId, companyId) {
    try {
      const [profileResult, metricsResult, trendsResult, alertsResult] = await Promise.all([
        supabase
          .from('subcontractor_profiles')
          .select('*')
          .eq('subcontractor_id', subcontractorId)
          .eq('company_id', companyId)
          .single(),

        supabase
          .from('performance_metrics')
          .select(`
            *,
            projects!inner(project_name, status)
          `)
          .eq('subcontractor_id', subcontractorId)
          .eq('company_id', companyId)
          .order('assessment_period_start', { ascending: false }),

        supabase
          .from('performance_trends')
          .select('*')
          .eq('subcontractor_id', subcontractorId)
          .eq('company_id', companyId)
          .order('period_start', { ascending: false }),

        supabase
          .from('performance_alerts')
          .select('*')
          .eq('subcontractor_id', subcontractorId)
          .eq('company_id', companyId)
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })
      ]);

      if (profileResult.error) throw profileResult.error;

      return {
        success: true,
        data: {
          profile: profileResult.data,
          metrics: metricsResult.data || [],
          trends: trendsResult.data || [],
          alerts: alertsResult.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching subcontractor performance details:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate and update risk score for a subcontractor
  async calculateSubcontractorRiskScore(subcontractorId, companyId, assessmentMonths = 12) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_subcontractor_risk_score', {
          p_subcontractor_id: subcontractorId,
          p_company_id: companyId,
          p_assessment_period_months: assessmentMonths
        });

      if (error) throw error;

      return { success: true, data: data[0] || null };
    } catch (error) {
      console.error('Error calculating subcontractor risk score:', error);
      return { success: false, error: error.message };
    }
  }

  // Update performance metrics for a specific project
  async updatePerformanceMetrics(subcontractorId, projectId, assessmentStart, assessmentEnd) {
    try {
      const { error } = await supabase
        .rpc('update_subcontractor_performance_metrics', {
          p_subcontractor_id: subcontractorId,
          p_project_id: projectId,
          p_assessment_start: assessmentStart,
          p_assessment_end: assessmentEnd
        });

      if (error) throw error;

      return { success: true, message: 'Performance metrics updated successfully' };
    } catch (error) {
      console.error('Error updating performance metrics:', error);
      return { success: false, error: error.message };
    }
  }

  // Update all subcontractor profiles (typically run as scheduled job)
  async updateAllSubcontractorProfiles() {
    try {
      const { error } = await supabase
        .rpc('update_all_subcontractor_profiles');

      if (error) throw error;

      return { success: true, message: 'All subcontractor profiles updated successfully' };
    } catch (error) {
      console.error('Error updating all subcontractor profiles:', error);
      return { success: false, error: error.message };
    }
  }

  // Get procurement recommendations
  async getProcurementRecommendations(companyId, projectType = null) {
    try {
      let query = supabase
        .from('procurement_recommendations')
        .select(`
          *,
          subcontractors!inner(company_name, trade_type),
          subcontractor_profiles!inner(overall_risk_score, performance_grade)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (projectType) {
        query = query.contains('project_type_suitability', { [projectType]: true });
      }

      const { data, error } = await query.order('confidence_score', { ascending: false });

      if (error) throw error;

      // Group by recommendation type
      const grouped = {
        preferred: data?.filter(r => r.recommendation_type === 'preferred') || [],
        approved: data?.filter(r => r.recommendation_type === 'approved') || [],
        caution: data?.filter(r => r.recommendation_type === 'caution') || [],
        monitor: data?.filter(r => r.recommendation_type === 'monitor') || [],
        avoid: data?.filter(r => r.recommendation_type === 'avoid') || []
      };

      return { success: true, data: grouped };
    } catch (error) {
      console.error('Error fetching procurement recommendations:', error);
      return { success: false, error: error.message };
    }
  }

  // Compare multiple subcontractors
  async compareSubcontractors(companyId, subcontractorIds, projectType = null) {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('subcontractor_profiles')
        .select(`
          *,
          subcontractors!inner(company_name, contact_person, phone, email, trade_type)
        `)
        .eq('company_id', companyId)
        .in('subcontractor_id', subcontractorIds);

      if (profilesError) throw profilesError;

      // Get recent performance metrics for each
      const { data: metrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('company_id', companyId)
        .in('subcontractor_id', subcontractorIds)
        .gte('assessment_period_start', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (metricsError) throw metricsError;

      // Get procurement recommendations
      const { data: recommendations, error: recError } = await supabase
        .from('procurement_recommendations')
        .select('*')
        .eq('company_id', companyId)
        .in('subcontractor_id', subcontractorIds)
        .eq('is_active', true);

      if (recError) throw recError;

      // Get company benchmarks for comparison
      const { data: benchmarks, error: benchError } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .eq('company_id', companyId)
        .eq('benchmark_type', 'company_average');

      const comparison = profiles?.map(profile => {
        const recentMetrics = metrics?.filter(m => m.subcontractor_id === profile.subcontractor_id) || [];
        const recommendation = recommendations?.find(r => r.subcontractor_id === profile.subcontractor_id);

        return {
          ...profile,
          recentMetrics,
          recommendation,
          benchmarkComparison: this.calculateBenchmarkComparison(profile, benchmarks),
          strengths: this.identifyStrengths(profile, recentMetrics),
          concerns: this.identifyConcerns(profile, recentMetrics),
          projectSuitability: this.assessProjectSuitability(profile, projectType)
        };
      }) || [];

      return { success: true, data: comparison };
    } catch (error) {
      console.error('Error comparing subcontractors:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to calculate benchmark comparison
  calculateBenchmarkComparison(profile, benchmarks) {
    const benchmark = benchmarks?.find(b => b.trade_type === profile.trade_type) || benchmarks?.[0];
    if (!benchmark) return null;

    return {
      resolutionSpeed: {
        value: profile.average_resolution_days,
        benchmark: benchmark.average_resolution_days,
        performance: profile.average_resolution_days <= benchmark.target_resolution_days ? 'excellent' :
                    profile.average_resolution_days <= benchmark.average_resolution_days ? 'good' : 'poor'
      },
      rejectionRate: {
        value: profile.rejection_rate,
        benchmark: benchmark.acceptable_rejection_rate,
        performance: profile.rejection_rate <= benchmark.acceptable_rejection_rate * 0.5 ? 'excellent' :
                    profile.rejection_rate <= benchmark.acceptable_rejection_rate ? 'good' : 'poor'
      }
    };
  }

  // Helper method to identify strengths
  identifyStrengths(profile, metrics) {
    const strengths = [];

    if (profile.overall_risk_score >= 80) {
      strengths.push('Excellent overall performance rating');
    }
    if (profile.speed_score >= 85) {
      strengths.push('Fast resolution times');
    }
    if (profile.quality_score >= 85) {
      strengths.push('High quality work with low rejection rates');
    }
    if (profile.reliability_score >= 85) {
      strengths.push('Reliable and consistent performance');
    }
    if (profile.communication_score >= 85) {
      strengths.push('Excellent communication and responsiveness');
    }
    if (profile.projects_worked >= 5) {
      strengths.push('Extensive experience with multiple projects');
    }

    return strengths;
  }

  // Helper method to identify concerns
  identifyConcerns(profile, metrics) {
    const concerns = [];

    if (profile.overall_risk_score < 40) {
      concerns.push('Poor overall performance rating');
    }
    if (profile.rejection_rate > 15) {
      concerns.push('High rejection rate indicates quality issues');
    }
    if (profile.repeat_issue_rate > 10) {
      concerns.push('Frequent repeat issues suggest systemic problems');
    }
    if (profile.average_resolution_days > 10) {
      concerns.push('Slow resolution times');
    }
    if (profile.confidence_level < 50) {
      concerns.push('Limited data available for assessment');
    }
    if (profile.blacklist_status) {
      concerns.push(`Blacklisted: ${profile.blacklist_reason}`);
    }

    return concerns;
  }

  // Helper method to assess project suitability
  assessProjectSuitability(profile, projectType) {
    if (!projectType) return null;

    // This would be enhanced with more sophisticated logic
    const suitability = {
      overall: profile.overall_risk_score >= 60 ? 'suitable' : 'unsuitable',
      reasoning: []
    };

    if (profile.performance_grade === 'A' || profile.performance_grade === 'B') {
      suitability.reasoning.push('Strong performance history');
    }
    if (profile.projects_worked >= 3) {
      suitability.reasoning.push('Proven experience');
    }
    if (profile.overall_risk_score < 40) {
      suitability.reasoning.push('Performance concerns require monitoring');
    }

    return suitability;
  }

  // Get performance trends for a subcontractor
  async getPerformanceTrends(subcontractorId, companyId, period = 12) {
    try {
      const { data, error } = await supabase
        .from('performance_trends')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .eq('company_id', companyId)
        .gte('period_start', new Date(Date.now() - period * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('period_start', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      return { success: false, error: error.message };
    }
  }

  // Get performance alerts
  async getPerformanceAlerts(companyId, subcontractorId = null) {
    try {
      let query = supabase
        .from('performance_alerts')
        .select(`
          *,
          subcontractors!inner(company_name, trade_type)
        `)
        .eq('company_id', companyId)
        .eq('is_resolved', false);

      if (subcontractorId) {
        query = query.eq('subcontractor_id', subcontractorId);
      }

      const { data, error } = await query.order('severity', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching performance alerts:', error);
      return { success: false, error: error.message };
    }
  }

  // Acknowledge a performance alert
  async acknowledgeAlert(alertId, userId) {
    try {
      const { data, error } = await supabase
        .from('performance_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('alert_id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Resolve a performance alert
  async resolveAlert(alertId) {
    try {
      const { data, error } = await supabase
        .from('performance_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('alert_id', alertId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Get company performance statistics
  async getCompanyPerformanceStatistics(companyId) {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('subcontractor_profiles')
        .select('*')
        .eq('company_id', companyId);

      if (profilesError) throw profilesError;

      const totalSubcontractors = profiles?.length || 0;
      const gradeDistribution = {
        A: profiles?.filter(p => p.performance_grade === 'A').length || 0,
        B: profiles?.filter(p => p.performance_grade === 'B').length || 0,
        C: profiles?.filter(p => p.performance_grade === 'C').length || 0,
        D: profiles?.filter(p => p.performance_grade === 'D').length || 0,
        F: profiles?.filter(p => p.performance_grade === 'F').length || 0
      };

      const averageScore = totalSubcontractors > 0
        ? Math.round(profiles.reduce((sum, p) => sum + (p.overall_risk_score || 0), 0) / totalSubcontractors)
        : 0;

      const blacklistedCount = profiles?.filter(p => p.blacklist_status).length || 0;
      const topPerformers = profiles?.filter(p => p.overall_risk_score >= 80).length || 0;
      const poorPerformers = profiles?.filter(p => p.overall_risk_score < 40).length || 0;

      // Get active alerts count
      const { data: alerts, error: alertsError } = await supabase
        .from('performance_alerts')
        .select('alert_id')
        .eq('company_id', companyId)
        .eq('is_resolved', false);

      const activeAlertsCount = alerts?.length || 0;

      return {
        success: true,
        data: {
          totalSubcontractors,
          gradeDistribution,
          averageScore,
          blacklistedCount,
          topPerformers,
          poorPerformers,
          activeAlertsCount,
          profiles: profiles?.sort((a, b) => (b.overall_risk_score || 0) - (a.overall_risk_score || 0)) || []
        }
      };
    } catch (error) {
      console.error('Error fetching company performance statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Update subcontractor blacklist status
  async updateBlacklistStatus(subcontractorId, companyId, blacklisted, reason = '') {
    try {
      const { data, error } = await supabase
        .from('subcontractor_profiles')
        .update({
          blacklist_status: blacklisted,
          blacklist_reason: blacklisted ? reason : null,
          updated_at: new Date().toISOString()
        })
        .eq('subcontractor_id', subcontractorId)
        .eq('company_id', companyId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating blacklist status:', error);
      return { success: false, error: error.message };
    }
  }

  // Export performance report
  async exportPerformanceReport(companyId, filters = {}, format = 'json') {
    try {
      // Get filtered subcontractor data
      const profilesResult = await this.getSubcontractorProfiles(companyId, filters);
      if (!profilesResult.success) {
        throw new Error(profilesResult.error);
      }

      // Get company statistics
      const statsResult = await this.getCompanyPerformanceStatistics(companyId);
      if (!statsResult.success) {
        throw new Error(statsResult.error);
      }

      // Get performance alerts
      const alertsResult = await this.getPerformanceAlerts(companyId);
      if (!alertsResult.success) {
        throw new Error(alertsResult.error);
      }

      const reportData = {
        generatedAt: new Date().toISOString(),
        companyId,
        filters,
        statistics: statsResult.data,
        subcontractors: profilesResult.data,
        alerts: alertsResult.data
      };

      if (format === 'json') {
        return { success: true, data: reportData, contentType: 'application/json' };
      }

      // Generate formatted report content
      const reportContent = this.formatPerformanceReport(reportData);

      return {
        success: true,
        data: reportContent,
        contentType: 'text/plain',
        filename: `subcontractor_performance_report_${new Date().toISOString().split('T')[0]}.txt`
      };
    } catch (error) {
      console.error('Error exporting performance report:', error);
      return { success: false, error: error.message };
    }
  }

  // Format performance report as text
  formatPerformanceReport(data) {
    const stats = data.statistics;
    const subcontractors = data.subcontractors;
    const alerts = data.alerts;

    return `
SUBCONTRACTOR PERFORMANCE REPORT
Generated: ${new Date(data.generatedAt).toLocaleDateString()}
Company ID: ${data.companyId}

=====================================
EXECUTIVE SUMMARY
=====================================

Total Subcontractors: ${stats.totalSubcontractors}
Average Performance Score: ${stats.averageScore}/100
Top Performers (Grade A): ${stats.topPerformers}
Poor Performers (Score <40): ${stats.poorPerformers}
Blacklisted: ${stats.blacklistedCount}
Active Performance Alerts: ${stats.activeAlertsCount}

Performance Grade Distribution:
- Grade A (Preferred): ${stats.gradeDistribution.A} (${((stats.gradeDistribution.A / stats.totalSubcontractors) * 100).toFixed(1)}%)
- Grade B (Approved): ${stats.gradeDistribution.B} (${((stats.gradeDistribution.B / stats.totalSubcontractors) * 100).toFixed(1)}%)
- Grade C (Caution): ${stats.gradeDistribution.C} (${((stats.gradeDistribution.C / stats.totalSubcontractors) * 100).toFixed(1)}%)
- Grade D (Monitor): ${stats.gradeDistribution.D} (${((stats.gradeDistribution.D / stats.totalSubcontractors) * 100).toFixed(1)}%)
- Grade F (Avoid): ${stats.gradeDistribution.F} (${((stats.gradeDistribution.F / stats.totalSubcontractors) * 100).toFixed(1)}%)

=====================================
TOP PERFORMERS (${subcontractors.filter(s => s.overall_risk_score >= 80).length})
=====================================

${subcontractors.filter(s => s.overall_risk_score >= 80).map(sub => `
• ${sub.company_name} (${sub.trade_type})
  Score: ${sub.overall_risk_score}/100 | Grade: ${sub.performance_grade}
  Projects: ${sub.projects_worked} | Success Rate: ${sub.resolution_success_rate?.toFixed(1)}%
  Avg Resolution: ${sub.average_resolution_days?.toFixed(1)} days
`).join('') || 'No top performers found.'}

=====================================
POOR PERFORMERS (${subcontractors.filter(s => s.overall_risk_score < 40).length})
=====================================

${subcontractors.filter(s => s.overall_risk_score < 40).map(sub => `
• ${sub.company_name} (${sub.trade_type})
  Score: ${sub.overall_risk_score}/100 | Grade: ${sub.performance_grade}
  Projects: ${sub.projects_worked} | Rejection Rate: ${sub.rejection_rate?.toFixed(1)}%
  Avg Resolution: ${sub.average_resolution_days?.toFixed(1)} days
  ${sub.blacklist_status ? `[BLACKLISTED: ${sub.blacklist_reason}]` : ''}
`).join('') || 'No poor performers found.'}

=====================================
PROCUREMENT RECOMMENDATIONS
=====================================

PREFERRED (Grade A - Use First):
${subcontractors.filter(s => s.recommendation_type === 'preferred').map(s =>
  `• ${s.company_name} - ${s.recommendation_reasoning}`
).join('\n') || 'None available'}

APPROVED (Grade B - Suitable):
${subcontractors.filter(s => s.recommendation_type === 'approved').map(s =>
  `• ${s.company_name} - ${s.recommendation_reasoning}`
).join('\n') || 'None available'}

CAUTION (Grade C - Monitor Closely):
${subcontractors.filter(s => s.recommendation_type === 'caution').map(s =>
  `• ${s.company_name} - ${s.recommendation_reasoning}`
).join('\n') || 'None available'}

AVOID (Grade D/F - Do Not Use):
${subcontractors.filter(s => s.recommendation_type === 'avoid').map(s =>
  `• ${s.company_name} - ${s.recommendation_reasoning}`
).join('\n') || 'None available'}

=====================================
ACTIVE PERFORMANCE ALERTS (${alerts.length})
=====================================

${alerts.map(alert => `
• ${alert.subcontractors?.company_name || 'Unknown'} - ${alert.title}
  Severity: ${alert.severity}/10 | Type: ${alert.alert_type}
  Description: ${alert.description}
  Created: ${new Date(alert.created_at).toLocaleDateString()}
`).join('') || 'No active alerts.'}

=====================================
DETAILED PERFORMANCE BREAKDOWN
=====================================

${subcontractors.map(sub => `
${sub.company_name} (${sub.trade_type})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: ${sub.overall_risk_score}/100 | Grade: ${sub.performance_grade}
Speed Score: ${sub.speed_score}/100 | Quality: ${sub.quality_score}/100
Reliability: ${sub.reliability_score}/100 | Communication: ${sub.communication_score}/100

Key Metrics:
- Projects Worked: ${sub.projects_worked}
- Total Blockers Assigned: ${sub.total_blockers_assigned}
- Total Blockers Resolved: ${sub.total_blockers_resolved}
- Success Rate: ${sub.resolution_success_rate?.toFixed(1)}%
- Rejection Rate: ${sub.rejection_rate?.toFixed(1)}%
- Average Resolution: ${sub.average_resolution_days?.toFixed(1)} days
- Confidence Level: ${sub.confidence_level?.toFixed(1)}%

Status: ${sub.blacklist_status ? 'BLACKLISTED' : 'ACTIVE'}
${sub.blacklist_status ? `Blacklist Reason: ${sub.blacklist_reason}` : ''}
Last Assessment: ${new Date(sub.last_assessment_date).toLocaleDateString()}

`).join('')}

=====================================
REPORT FOOTER
=====================================

This report was generated automatically by the Subcontractor Risk Profiling system.
Performance scores are calculated using a weighted algorithm considering:
- Resolution Speed (25%)
- Quality/Rejection Rate (30%)
- Reliability/On-time Delivery (25%)
- Communication/Responsiveness (20%)

For questions about this report, contact your project management team.
Report generated on: ${new Date(data.generatedAt).toLocaleString()}
    `.trim();
  }

  // Create or update procurement recommendation
  async createProcurementRecommendation(subcontractorId, companyId, recommendationData) {
    try {
      const { data, error } = await supabase
        .from('procurement_recommendations')
        .upsert({
          subcontractor_id: subcontractorId,
          company_id: companyId,
          recommendation_type: recommendationData.type,
          recommendation_grade: recommendationData.grade,
          confidence_score: recommendationData.confidence || 75.0,
          reasoning: recommendationData.reasoning,
          supporting_data: recommendationData.supportingData || {},
          risk_factors: recommendationData.riskFactors || [],
          strengths: recommendationData.strengths || [],
          concerns: recommendationData.concerns || [],
          project_type_suitability: recommendationData.projectSuitability || {},
          valid_until: recommendationData.validUntil,
          is_active: true,
          created_by: recommendationData.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating procurement recommendation:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SubcontractorPerformanceAPI();