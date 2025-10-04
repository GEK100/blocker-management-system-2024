import { supabase } from './supabase';

class RiskIntelligenceAPI {
  // Get current health score for a project
  async getProjectHealthScore(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_health_scores')
        .select('*')
        .eq('project_id', projectId)
        .eq('score_date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { success: true, data: data || null };
    } catch (error) {
      console.error('Error fetching project health score:', error);
      return { success: false, error: error.message };
    }
  }

  // Get health score history for a project
  async getProjectHealthHistory(projectId, days = 90) {
    try {
      const { data, error } = await supabase
        .from('project_health_scores')
        .select('*')
        .eq('project_id', projectId)
        .gte('score_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('score_date', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching project health history:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate and update project health score
  async calculateProjectHealthScore(projectId) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_project_health_score', {
          p_project_id: projectId,
          p_analysis_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      return { success: true, data: data[0] || null };
    } catch (error) {
      console.error('Error calculating project health score:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active risk indicators for a project
  async getActiveRiskIndicators(projectId) {
    try {
      const { data, error } = await supabase
        .from('risk_indicators')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching active risk indicators:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active risk indicators for all company projects
  async getCompanyRiskIndicators(companyId) {
    try {
      const { data, error } = await supabase
        .from('risk_indicators')
        .select(`
          *,
          projects!inner(project_name, status)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching company risk indicators:', error);
      return { success: false, error: error.message };
    }
  }

  // Get risk dashboard summary for company
  async getRiskDashboardSummary(companyId) {
    try {
      const { data, error } = await supabase
        .from('risk_dashboard_summary')
        .select('*')
        .eq('company_id', companyId)
        .order('overall_health_score', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching risk dashboard summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Get predictive alerts for a project
  async getPredictiveAlerts(projectId) {
    try {
      const { data, error } = await supabase
        .from('predictive_alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_resolved', false)
        .order('urgency_score', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching predictive alerts:', error);
      return { success: false, error: error.message };
    }
  }

  // Get similar project comparisons
  async getSimilarProjectComparisons(projectId) {
    try {
      const { data, error } = await supabase
        .from('similar_project_comparisons')
        .select(`
          *,
          comparison_project:projects!similar_project_comparisons_comparison_project_id_fkey(project_name, status, start_date, end_date)
        `)
        .eq('project_id', projectId)
        .order('similarity_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching similar project comparisons:', error);
      return { success: false, error: error.message };
    }
  }

  // Acknowledge a risk indicator
  async acknowledgeRiskIndicator(indicatorId, userId) {
    try {
      const { data, error } = await supabase
        .from('risk_indicators')
        .update({
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('indicator_id', indicatorId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error acknowledging risk indicator:', error);
      return { success: false, error: error.message };
    }
  }

  // Resolve a risk indicator
  async resolveRiskIndicator(indicatorId) {
    try {
      const { data, error } = await supabase
        .from('risk_indicators')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('indicator_id', indicatorId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error resolving risk indicator:', error);
      return { success: false, error: error.message };
    }
  }

  // Acknowledge a predictive alert
  async acknowledgePredictiveAlert(alertId, userId) {
    try {
      const { data, error } = await supabase
        .from('predictive_alerts')
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
      console.error('Error acknowledging predictive alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a manual risk indicator
  async createManualRiskIndicator(projectId, indicatorData) {
    try {
      // Get project's company_id
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('company_id')
        .eq('project_id', projectId)
        .single();

      if (projectError) throw projectError;

      const { data, error } = await supabase
        .from('risk_indicators')
        .insert({
          project_id: projectId,
          company_id: project.company_id,
          indicator_type: indicatorData.indicator_type || 'schedule_threat',
          severity: indicatorData.severity || 5,
          risk_level: indicatorData.risk_level || 'medium',
          title: indicatorData.title,
          description: indicatorData.description,
          recommendation: indicatorData.recommendation,
          trigger_data: indicatorData.trigger_data || {},
          confidence_score: indicatorData.confidence_score || 75.0
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating manual risk indicator:', error);
      return { success: false, error: error.message };
    }
  }

  // Get risk statistics for company dashboard
  async getCompanyRiskStatistics(companyId) {
    try {
      // Get basic statistics
      const { data: stats, error: statsError } = await supabase
        .from('risk_dashboard_summary')
        .select('project_id, overall_health_score, risk_level, active_risk_count, active_alert_count')
        .eq('company_id', companyId);

      if (statsError) throw statsError;

      // Calculate aggregate statistics
      const totalProjects = stats.length;
      const projectsAtRisk = stats.filter(p => p.risk_level !== 'low').length;
      const criticalProjects = stats.filter(p => p.risk_level === 'critical').length;
      const averageHealthScore = totalProjects > 0
        ? Math.round(stats.reduce((sum, p) => sum + (p.overall_health_score || 0), 0) / totalProjects)
        : 0;
      const totalActiveRisks = stats.reduce((sum, p) => sum + (p.active_risk_count || 0), 0);
      const totalActiveAlerts = stats.reduce((sum, p) => sum + (p.active_alert_count || 0), 0);

      // Get risk level distribution
      const riskDistribution = {
        low: stats.filter(p => p.risk_level === 'low').length,
        medium: stats.filter(p => p.risk_level === 'medium').length,
        high: stats.filter(p => p.risk_level === 'high').length,
        critical: stats.filter(p => p.risk_level === 'critical').length
      };

      return {
        success: true,
        data: {
          totalProjects,
          projectsAtRisk,
          criticalProjects,
          averageHealthScore,
          totalActiveRisks,
          totalActiveAlerts,
          riskDistribution,
          projects: stats
        }
      };
    } catch (error) {
      console.error('Error fetching company risk statistics:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate risk pattern analysis
  async generateRiskPatternAnalysis(projectId) {
    try {
      // Get recent blockers for pattern analysis
      const { data: blockers, error: blockersError } = await supabase
        .from('blockers')
        .select('*')
        .eq('project_id', projectId)
        .gte('identified_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('identified_date', { ascending: false });

      if (blockersError) throw blockersError;

      // Analyze patterns
      const categoryFrequency = {};
      const priorityDistribution = {};
      const resolutionTimes = [];
      const weeklyTrends = {};

      blockers.forEach(blocker => {
        // Category frequency
        categoryFrequency[blocker.category] = (categoryFrequency[blocker.category] || 0) + 1;

        // Priority distribution
        priorityDistribution[blocker.priority] = (priorityDistribution[blocker.priority] || 0) + 1;

        // Resolution times
        if (blocker.resolution_date) {
          const resolutionDays = Math.ceil(
            (new Date(blocker.resolution_date) - new Date(blocker.identified_date)) / (1000 * 60 * 60 * 24)
          );
          resolutionTimes.push(resolutionDays);
        }

        // Weekly trends
        const weekKey = new Date(blocker.identified_date).toISOString().slice(0, 10);
        weeklyTrends[weekKey] = (weeklyTrends[weekKey] || 0) + 1;
      });

      // Calculate insights
      const averageResolutionTime = resolutionTimes.length > 0
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 0;

      const mostCommonCategory = Object.entries(categoryFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      const criticalBlockerPercentage = Math.round(
        ((priorityDistribution.CRITICAL || 0) / blockers.length) * 100
      );

      return {
        success: true,
        data: {
          totalBlockers: blockers.length,
          categoryFrequency,
          priorityDistribution,
          averageResolutionTime,
          mostCommonCategory,
          criticalBlockerPercentage,
          weeklyTrends,
          insights: {
            riskLevel: this.calculateRiskLevel(blockers),
            recommendations: this.generateRecommendations(blockers, categoryFrequency, averageResolutionTime)
          }
        }
      };
    } catch (error) {
      console.error('Error generating risk pattern analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to calculate risk level based on patterns
  calculateRiskLevel(blockers) {
    const recentBlockers = blockers.filter(b =>
      new Date(b.identified_date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );

    const criticalCount = recentBlockers.filter(b => b.priority === 'CRITICAL').length;
    const unresolvedCount = recentBlockers.filter(b => !b.resolution_date).length;

    if (criticalCount > 3 || unresolvedCount > 10) return 'critical';
    if (criticalCount > 1 || unresolvedCount > 5) return 'high';
    if (recentBlockers.length > 3) return 'medium';
    return 'low';
  }

  // Helper method to generate recommendations
  generateRecommendations(blockers, categoryFrequency, averageResolutionTime) {
    const recommendations = [];

    // Check for slow resolution times
    if (averageResolutionTime > 14) {
      recommendations.push({
        type: 'process',
        priority: 'high',
        message: `Average resolution time is ${averageResolutionTime} days. Consider streamlining resolution processes.`
      });
    }

    // Check for category concentration
    const topCategory = Object.entries(categoryFrequency).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > blockers.length * 0.4) {
      recommendations.push({
        type: 'focus',
        priority: 'medium',
        message: `${topCategory[1]} blockers in "${topCategory[0]}" category. Focus on preventing ${topCategory[0]} issues.`
      });
    }

    // Check for recent spike
    const recentWeek = blockers.filter(b =>
      new Date(b.identified_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (recentWeek.length > 5) {
      recommendations.push({
        type: 'urgent',
        priority: 'critical',
        message: `${recentWeek.length} new blockers this week. Immediate intervention may be needed.`
      });
    }

    return recommendations;
  }

  // Export risk report
  async exportRiskReport(projectId, format = 'json') {
    try {
      // Get comprehensive risk data
      const [healthScore, riskIndicators, patternAnalysis, alerts, similarProjects] = await Promise.all([
        this.getProjectHealthScore(projectId),
        this.getActiveRiskIndicators(projectId),
        this.generateRiskPatternAnalysis(projectId),
        this.getPredictiveAlerts(projectId),
        this.getSimilarProjectComparisons(projectId)
      ]);

      const reportData = {
        generatedAt: new Date().toISOString(),
        projectId,
        healthScore: healthScore.data,
        riskIndicators: riskIndicators.data,
        patternAnalysis: patternAnalysis.data,
        alerts: alerts.data,
        similarProjects: similarProjects.data?.slice(0, 5) // Top 5 similar projects
      };

      if (format === 'json') {
        return { success: true, data: reportData, contentType: 'application/json' };
      }

      // Generate formatted report content
      const reportContent = this.formatRiskReport(reportData);

      return {
        success: true,
        data: reportContent,
        contentType: 'text/plain',
        filename: `risk_report_${projectId}_${new Date().toISOString().split('T')[0]}.txt`
      };
    } catch (error) {
      console.error('Error exporting risk report:', error);
      return { success: false, error: error.message };
    }
  }

  // Format risk report as text
  formatRiskReport(data) {
    const healthScore = data.healthScore;
    const indicators = data.riskIndicators;
    const patterns = data.patternAnalysis;
    const alerts = data.alerts;

    return `
PREDICTIVE RISK INTELLIGENCE REPORT
Generated: ${new Date(data.generatedAt).toLocaleDateString()}
Project ID: ${data.projectId}

=====================================
PROJECT HEALTH OVERVIEW
=====================================

Overall Health Score: ${healthScore?.overall_health_score || 'N/A'}/100
Risk Level: ${healthScore?.risk_level?.toUpperCase() || 'UNKNOWN'}
Prediction Confidence: ${healthScore?.prediction_confidence?.toFixed(1) || 'N/A'}%

Component Scores:
- Blocker Velocity: ${healthScore?.blocker_velocity_score || 'N/A'}/100
- Resolution Trend: ${healthScore?.resolution_trend_score || 'N/A'}/100
- Critical Blockers: ${healthScore?.critical_blocker_score || 'N/A'}/100
- Repeat Issues: ${healthScore?.repeat_issue_score || 'N/A'}/100

=====================================
ACTIVE RISK INDICATORS (${indicators?.length || 0})
=====================================

${indicators?.map(indicator => `
• ${indicator.title} [${indicator.risk_level.toUpperCase()}]
  Severity: ${indicator.severity}/10
  Detected: ${new Date(indicator.detected_date).toLocaleDateString()}
  Description: ${indicator.description}
  Recommendation: ${indicator.recommendation}
`).join('') || 'No active risk indicators.'}

=====================================
PATTERN ANALYSIS
=====================================

Total Blockers (90 days): ${patterns?.totalBlockers || 0}
Average Resolution Time: ${patterns?.averageResolutionTime || 0} days
Most Common Category: ${patterns?.mostCommonCategory || 'None'}
Critical Blocker %: ${patterns?.criticalBlockerPercentage || 0}%

Risk Assessment: ${patterns?.insights?.riskLevel?.toUpperCase() || 'UNKNOWN'}

Recommendations:
${patterns?.insights?.recommendations?.map(rec =>
  `• [${rec.priority.toUpperCase()}] ${rec.message}`
).join('\n') || 'No specific recommendations.'}

=====================================
ACTIVE ALERTS (${alerts?.length || 0})
=====================================

${alerts?.map(alert => `
• ${alert.title} [${alert.risk_level.toUpperCase()}]
  Urgency: ${alert.urgency_score}/10
  Message: ${alert.message}
  Recommended Actions: ${alert.recommended_actions?.join(', ') || 'None specified'}
`).join('') || 'No active alerts.'}

=====================================
SIMILAR PROJECT ANALYSIS
=====================================

${data.similarProjects?.map(comp => `
• ${comp.comparison_project?.project_name || 'Unknown Project'}
  Similarity Score: ${comp.similarity_score}%
  Final Outcome: ${comp.final_outcome || 'Unknown'}
  Actual Delay: ${comp.actual_delay_days || 0} days
`).join('') || 'No similar projects found.'}

=====================================
REPORT FOOTER
=====================================

This report was generated automatically by the Predictive Risk Intelligence system.
Review findings with your project team and implement recommended actions promptly.

For questions about this report, contact your project management team.
    `.trim();
  }

  // Trigger manual health score update for all projects
  async triggerHealthScoreUpdate() {
    try {
      const { data, error } = await supabase
        .rpc('update_daily_health_scores');

      if (error) throw error;

      return { success: true, message: 'Health scores updated for all projects' };
    } catch (error) {
      console.error('Error triggering health score update:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new RiskIntelligenceAPI();