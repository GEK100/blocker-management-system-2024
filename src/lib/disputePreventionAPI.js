import { supabase } from './supabase';

class DisputePreventionAPI {
  constructor() {
    this.supabase = supabase;
  }

  // Get comprehensive dashboard overview
  async getDashboardOverview(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('dispute_prevention_dashboard')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  // Calculate dispute risk score for project/subcontractor
  async calculateDisputeRiskScore(projectId, subcontractorId = null, disputeType = null) {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_dispute_risk_score', {
          p_project_id: projectId,
          p_subcontractor_id: subcontractorId,
          p_dispute_type: disputeType
        });

      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      console.error('Error calculating dispute risk score:', error);
      throw error;
    }
  }

  // Detect payment dispute indicators
  async detectPaymentDisputeIndicators(projectId, subcontractorId = null) {
    try {
      const { data, error } = await this.supabase
        .rpc('detect_payment_dispute_indicators', {
          p_project_id: projectId,
          p_subcontractor_id: subcontractorId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error detecting payment dispute indicators:', error);
      throw error;
    }
  }

  // Get all dispute risks with filters
  async getDisputeRisks(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('dispute_risks')
        .select(`
          *,
          project:projects(name, status, budget),
          subcontractor:subcontractors(company_name, trade_type)
        `)
        .eq('company_id', companyId);

      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      if (filters.disputeType) {
        query = query.eq('dispute_type', filters.disputeType);
      }

      if (filters.escalationStage) {
        query = query.eq('escalation_stage', filters.escalationStage);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      const { data, error } = await query
        .order('risk_score', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dispute risks:', error);
      throw error;
    }
  }

  // Get contractual deadlines
  async getContractualDeadlines(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('contractual_deadlines')
        .select(`
          *,
          project:projects(name, status),
          dispute_risk:dispute_risks(dispute_type, risk_level)
        `)
        .eq('company_id', companyId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.deadlineType) {
        query = query.eq('deadline_type', filters.deadlineType);
      }

      if (filters.urgent) {
        query = query.lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      const { data, error } = await query
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contractual deadlines:', error);
      throw error;
    }
  }

  // Check contractual deadlines
  async checkContractualDeadlines(companyId) {
    try {
      const { data, error } = await this.supabase
        .rpc('check_contractual_deadlines', {
          p_company_id: companyId
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking contractual deadlines:', error);
      throw error;
    }
  }

  // Get early warnings
  async getEarlyWarnings(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('early_warnings')
        .select(`
          *,
          project:projects(name, status),
          dispute_risk:dispute_risks(dispute_type, risk_level)
        `)
        .eq('company_id', companyId);

      if (filters.warningType) {
        query = query.eq('warning_type', filters.warningType);
      }

      if (filters.severity) {
        query = query.gte('severity', filters.severity);
      }

      if (filters.acknowledged === false) {
        query = query.is('acknowledged_by', null);
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.recent) {
        const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('detection_date', recentDate);
      }

      const { data, error } = await query
        .order('detection_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching early warnings:', error);
      throw error;
    }
  }

  // Get evidence packages
  async getEvidencePackages(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('evidence_packages')
        .select(`
          *,
          dispute_risk:dispute_risks(
            dispute_type,
            risk_level,
            project:projects(name)
          )
        `)
        .eq('company_id', companyId);

      if (filters.evidenceType) {
        query = query.eq('evidence_type', filters.evidenceType);
      }

      if (filters.minReadinessScore) {
        query = query.gte('legal_readiness_score', filters.minReadinessScore);
      }

      if (filters.disputeRiskId) {
        query = query.eq('dispute_risk_id', filters.disputeRiskId);
      }

      const { data, error } = await query
        .order('legal_readiness_score', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching evidence packages:', error);
      throw error;
    }
  }

  // Generate evidence package
  async generateEvidencePackage(disputeRiskId, packageName = null) {
    try {
      const { data, error } = await this.supabase
        .rpc('generate_evidence_package', {
          p_dispute_risk_id: disputeRiskId,
          p_package_name: packageName
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating evidence package:', error);
      throw error;
    }
  }

  // Create or update dispute risk
  async createDisputeRisk(riskData) {
    try {
      const { data, error } = await this.supabase
        .from('dispute_risks')
        .insert([riskData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating dispute risk:', error);
      throw error;
    }
  }

  // Update dispute risk
  async updateDisputeRisk(riskId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('dispute_risks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('risk_id', riskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating dispute risk:', error);
      throw error;
    }
  }

  // Create contractual deadline
  async createContractualDeadline(deadlineData) {
    try {
      const { data, error } = await this.supabase
        .from('contractual_deadlines')
        .insert([deadlineData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contractual deadline:', error);
      throw error;
    }
  }

  // Update contractual deadline
  async updateContractualDeadline(deadlineId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('contractual_deadlines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('deadline_id', deadlineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contractual deadline:', error);
      throw error;
    }
  }

  // Acknowledge early warning
  async acknowledgeEarlyWarning(warningId, actionTaken = null) {
    try {
      const { data, error } = await this.supabase
        .from('early_warnings')
        .update({
          acknowledged_by: (await this.supabase.auth.getUser()).data.user?.id,
          acknowledged_date: new Date().toISOString(),
          action_taken: actionTaken
        })
        .eq('warning_id', warningId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error acknowledging early warning:', error);
      throw error;
    }
  }

  // Get communication monitoring data
  async getCommunicationMonitoring(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('communication_monitoring')
        .select(`
          *,
          project:projects(name),
          subcontractor:subcontractors(company_name)
        `)
        .eq('company_id', companyId);

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.sentimentThreshold) {
        query = query.lte('sentiment_score', filters.sentimentThreshold);
      }

      if (filters.recent) {
        const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('communication_date', recentDate);
      }

      const { data, error } = await query
        .order('communication_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching communication monitoring:', error);
      throw error;
    }
  }

  // Analyze communication patterns
  async analyzeCommunicationPatterns(projectId, subcontractorId = null) {
    try {
      const { data: communications, error } = await this.supabase
        .from('communication_monitoring')
        .select('*')
        .eq('project_id', projectId)
        .eq('subcontractor_id', subcontractorId || null)
        .order('communication_date', { ascending: true });

      if (error) throw error;

      // Analyze patterns
      const analysis = this.performCommunicationAnalysis(communications);
      return analysis;
    } catch (error) {
      console.error('Error analyzing communication patterns:', error);
      throw error;
    }
  }

  // Perform communication analysis
  performCommunicationAnalysis(communications) {
    if (!communications || communications.length === 0) {
      return {
        totalCommunications: 0,
        averageSentiment: 0,
        trendDirection: 'neutral',
        riskIndicators: [],
        recommendations: ['Increase communication frequency to maintain project relationships']
      };
    }

    const totalCommunications = communications.length;
    const averageSentiment = communications.reduce((sum, comm) =>
      sum + (comm.sentiment_score || 0), 0) / totalCommunications;

    // Calculate trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentComms = communications.filter(c =>
      new Date(c.communication_date) > thirtyDaysAgo);
    const previousComms = communications.filter(c =>
      new Date(c.communication_date) > sixtyDaysAgo &&
      new Date(c.communication_date) <= thirtyDaysAgo);

    const recentAvgSentiment = recentComms.length > 0 ?
      recentComms.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / recentComms.length : 0;
    const previousAvgSentiment = previousComms.length > 0 ?
      previousComms.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / previousComms.length : 0;

    let trendDirection = 'neutral';
    if (recentAvgSentiment > previousAvgSentiment + 0.1) {
      trendDirection = 'improving';
    } else if (recentAvgSentiment < previousAvgSentiment - 0.1) {
      trendDirection = 'deteriorating';
    }

    // Identify risk indicators
    const riskIndicators = [];
    if (averageSentiment < -0.3) {
      riskIndicators.push('Consistently negative communication tone detected');
    }
    if (recentComms.length < previousComms.length * 0.5) {
      riskIndicators.push('Significant reduction in communication frequency');
    }
    if (recentComms.some(c => c.escalation_indicators?.length > 0)) {
      riskIndicators.push('Escalation language detected in recent communications');
    }

    // Generate recommendations
    const recommendations = [];
    if (averageSentiment < -0.2) {
      recommendations.push('Schedule face-to-face meeting to address relationship issues');
    }
    if (riskIndicators.length > 0) {
      recommendations.push('Consider mediation or third-party intervention');
    }
    if (recentComms.length === 0) {
      recommendations.push('Immediate contact required - communication breakdown detected');
    }

    return {
      totalCommunications,
      averageSentiment: parseFloat(averageSentiment.toFixed(3)),
      trendDirection,
      riskIndicators,
      recommendations,
      recentCommunications: recentComms.length,
      previousCommunications: previousComms.length
    };
  }

  // Get dispute resolution history
  async getDisputeResolutions(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('dispute_resolutions')
        .select(`
          *,
          dispute_risk:dispute_risks(
            dispute_type,
            project:projects(name)
          )
        `)
        .eq('company_id', companyId);

      if (filters.resolutionMethod) {
        query = query.eq('resolution_method', filters.resolutionMethod);
      }

      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome);
      }

      const { data, error } = await query
        .order('initiated_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dispute resolutions:', error);
      throw error;
    }
  }

  // Generate comprehensive dispute risk report
  async generateDisputeRiskReport(companyId, options = {}) {
    try {
      const [
        overview,
        disputeRisks,
        contractualDeadlines,
        earlyWarnings,
        evidencePackages,
        communicationData,
        resolutionHistory
      ] = await Promise.all([
        this.getDashboardOverview(companyId),
        this.getDisputeRisks(companyId),
        this.getContractualDeadlines(companyId),
        this.getEarlyWarnings(companyId, { recent: true }),
        this.getEvidencePackages(companyId),
        this.getCommunicationMonitoring(companyId, { recent: true }),
        this.getDisputeResolutions(companyId)
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        companyId,
        executive_summary: this.generateExecutiveSummary(overview, disputeRisks, earlyWarnings),
        sections: {
          dispute_risks: {
            title: 'Active Dispute Risks',
            data: disputeRisks,
            insights: this.generateDisputeRiskInsights(disputeRisks)
          },
          contractual_deadlines: {
            title: 'Contractual Deadline Management',
            data: contractualDeadlines,
            insights: this.generateDeadlineInsights(contractualDeadlines)
          },
          early_warnings: {
            title: 'Early Warning System',
            data: earlyWarnings,
            insights: this.generateEarlyWarningInsights(earlyWarnings)
          },
          evidence_packages: {
            title: 'Evidence Readiness',
            data: evidencePackages,
            insights: this.generateEvidenceInsights(evidencePackages)
          },
          communication_health: {
            title: 'Communication Analysis',
            data: communicationData,
            insights: this.generateCommunicationInsights(communicationData)
          },
          resolution_history: {
            title: 'Historical Resolution Analysis',
            data: resolutionHistory,
            insights: this.generateResolutionInsights(resolutionHistory)
          }
        },
        recommendations: this.generateRecommendations(
          disputeRisks, earlyWarnings, contractualDeadlines
        ),
        risk_matrix: this.generateRiskMatrix(disputeRisks),
        action_plan: this.generateActionPlan(disputeRisks, contractualDeadlines, earlyWarnings)
      };

      return report;
    } catch (error) {
      console.error('Error generating dispute risk report:', error);
      throw error;
    }
  }

  // Generate executive summary
  generateExecutiveSummary(overview, disputeRisks, earlyWarnings) {
    const criticalRisks = disputeRisks?.filter(r => r.risk_level === 'critical').length || 0;
    const highRisks = disputeRisks?.filter(r => r.risk_level === 'high').length || 0;
    const totalRisks = disputeRisks?.length || 0;
    const recentWarnings = earlyWarnings?.length || 0;

    return {
      total_active_risks: totalRisks,
      critical_risks: criticalRisks,
      high_risks: highRisks,
      recent_warnings: recentWarnings,
      overall_risk_level: criticalRisks > 0 ? 'CRITICAL' :
                          highRisks > 0 ? 'HIGH' :
                          totalRisks > 0 ? 'MEDIUM' : 'LOW',
      key_concern: criticalRisks > 0 ?
        `${criticalRisks} critical dispute risk${criticalRisks > 1 ? 's' : ''} requiring immediate attention` :
        highRisks > 0 ?
        `${highRisks} high-risk dispute${highRisks > 1 ? 's' : ''} requiring management intervention` :
        'No immediate dispute risks identified',
      legal_readiness: overview?.legal_ready_packages || 0
    };
  }

  // Generate dispute risk insights
  generateDisputeRiskInsights(risks) {
    if (!risks || risks.length === 0) return ['No active dispute risks identified'];

    const insights = [];
    const criticalRisks = risks.filter(r => r.risk_level === 'critical');
    const paymentRisks = risks.filter(r => r.dispute_type === 'payment');
    const delayRisks = risks.filter(r => r.dispute_type === 'delay');

    if (criticalRisks.length > 0) {
      insights.push(`${criticalRisks.length} critical dispute risk${criticalRisks.length > 1 ? 's' : ''} requiring immediate legal consultation`);
    }

    if (paymentRisks.length > 0) {
      insights.push(`${paymentRisks.length} payment-related dispute risk${paymentRisks.length > 1 ? 's' : ''} identified`);
    }

    if (delayRisks.length > 0) {
      insights.push(`${delayRisks.length} delay claim risk${delayRisks.length > 1 ? 's' : ''} detected`);
    }

    const avgRiskScore = risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length;
    insights.push(`Average risk score: ${avgRiskScore.toFixed(1)}/100`);

    return insights;
  }

  // Generate deadline insights
  generateDeadlineInsights(deadlines) {
    if (!deadlines || deadlines.length === 0) return ['No active contractual deadlines'];

    const insights = [];
    const urgentDeadlines = deadlines.filter(d => {
      const daysRemaining = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 3;
    });

    const missedDeadlines = deadlines.filter(d => d.status === 'missed');

    if (urgentDeadlines.length > 0) {
      insights.push(`${urgentDeadlines.length} contractual deadline${urgentDeadlines.length > 1 ? 's' : ''} due within 3 days`);
    }

    if (missedDeadlines.length > 0) {
      insights.push(`${missedDeadlines.length} deadline${missedDeadlines.length > 1 ? 's' : ''} already missed - immediate action required`);
    }

    insights.push(`${deadlines.length} total active contractual deadlines being monitored`);

    return insights;
  }

  // Generate early warning insights
  generateEarlyWarningInsights(warnings) {
    if (!warnings || warnings.length === 0) return ['No recent early warnings'];

    const insights = [];
    const severeWarnings = warnings.filter(w => w.severity >= 4);
    const unacknowledged = warnings.filter(w => !w.acknowledged_by);

    if (severeWarnings.length > 0) {
      insights.push(`${severeWarnings.length} severe warning${severeWarnings.length > 1 ? 's' : ''} requiring urgent attention`);
    }

    if (unacknowledged.length > 0) {
      insights.push(`${unacknowledged.length} warning${unacknowledged.length > 1 ? 's' : ''} awaiting acknowledgment`);
    }

    const warningTypes = [...new Set(warnings.map(w => w.warning_type))];
    insights.push(`Warning types detected: ${warningTypes.join(', ')}`);

    return insights;
  }

  // Generate evidence insights
  generateEvidenceInsights(packages) {
    if (!packages || packages.length === 0) return ['No evidence packages compiled'];

    const insights = [];
    const legalReady = packages.filter(p => p.legal_readiness_score >= 80);
    const avgReadiness = packages.reduce((sum, p) => sum + p.legal_readiness_score, 0) / packages.length;

    insights.push(`${legalReady.length} evidence package${legalReady.length > 1 ? 's' : ''} legally ready (80%+ score)`);
    insights.push(`Average evidence readiness score: ${avgReadiness.toFixed(1)}%`);

    if (legalReady.length < packages.length) {
      insights.push(`${packages.length - legalReady.length} package${packages.length - legalReady.length > 1 ? 's' : ''} need additional evidence compilation`);
    }

    return insights;
  }

  // Generate communication insights
  generateCommunicationInsights(communications) {
    if (!communications || communications.length === 0) return ['No recent communications monitored'];

    const insights = [];
    const avgSentiment = communications.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / communications.length;
    const negativeCommunications = communications.filter(c => c.sentiment_score < -0.3);

    insights.push(`Average communication sentiment: ${avgSentiment.toFixed(2)} (${avgSentiment >= 0 ? 'positive' : 'negative'})`);

    if (negativeCommunications.length > 0) {
      insights.push(`${negativeCommunications.length} communication${negativeCommunications.length > 1 ? 's' : ''} with negative sentiment detected`);
    }

    insights.push(`${communications.length} communications monitored in the last 30 days`);

    return insights;
  }

  // Generate resolution insights
  generateResolutionInsights(resolutions) {
    if (!resolutions || resolutions.length === 0) return ['No historical dispute resolutions to analyze'];

    const insights = [];
    const successfulResolutions = resolutions.filter(r => r.outcome === 'settled' || r.outcome === 'won');
    const successRate = (successfulResolutions.length / resolutions.length) * 100;

    insights.push(`Historical success rate: ${successRate.toFixed(1)}% (${successfulResolutions.length}/${resolutions.length} disputes)`);

    if (resolutions.length > 0) {
      const avgCost = resolutions.reduce((sum, r) => sum + (r.legal_costs || 0), 0) / resolutions.length;
      insights.push(`Average legal costs: £${avgCost.toLocaleString()}`);

      const avgDuration = resolutions.filter(r => r.time_to_resolution_days).reduce((sum, r) => sum + r.time_to_resolution_days, 0) / resolutions.filter(r => r.time_to_resolution_days).length;
      if (avgDuration) {
        insights.push(`Average resolution time: ${Math.round(avgDuration)} days`);
      }
    }

    return insights;
  }

  // Generate recommendations
  generateRecommendations(disputeRisks, earlyWarnings, deadlines) {
    const recommendations = [];

    // Critical risk recommendations
    const criticalRisks = disputeRisks?.filter(r => r.risk_level === 'critical') || [];
    criticalRisks.forEach(risk => {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Dispute Prevention',
        title: `Address Critical ${risk.dispute_type} Risk`,
        description: `Project "${risk.project?.name}" has critical dispute risk (${risk.risk_score}/100)`,
        action: risk.mitigation_actions?.[0] || 'Immediate legal consultation required',
        deadline: '24 hours',
        responsible: 'Senior Management + Legal Team'
      });
    });

    // Urgent deadline recommendations
    const urgentDeadlines = deadlines?.filter(d => {
      const daysRemaining = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 3 && d.status === 'pending';
    }) || [];

    urgentDeadlines.forEach(deadline => {
      recommendations.push({
        priority: 'URGENT',
        category: 'Contractual Compliance',
        title: `Urgent ${deadline.deadline_type} Deadline`,
        description: `${deadline.deadline_type} due in ${Math.ceil((new Date(deadline.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days`,
        action: `Complete ${deadline.deadline_type} documentation and submit`,
        deadline: deadline.due_date,
        responsible: deadline.responsible_party || 'Project Manager'
      });
    });

    // Severe warning recommendations
    const severeWarnings = earlyWarnings?.filter(w => w.severity >= 4 && !w.acknowledged_by) || [];
    severeWarnings.slice(0, 3).forEach(warning => {
      recommendations.push({
        priority: 'HIGH',
        category: 'Early Intervention',
        title: `Address ${warning.warning_type.replace('_', ' ')}`,
        description: `Severe warning detected on project "${warning.project?.name}"`,
        action: warning.recommended_actions?.[0] || 'Investigate and take corrective action',
        deadline: '3 days',
        responsible: 'Project Manager'
      });
    });

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  // Generate risk matrix
  generateRiskMatrix(disputeRisks) {
    const matrix = {
      critical: { payment: 0, delay: 0, quality: 0, scope: 0 },
      high: { payment: 0, delay: 0, quality: 0, scope: 0 },
      medium: { payment: 0, delay: 0, quality: 0, scope: 0 },
      low: { payment: 0, delay: 0, quality: 0, scope: 0 }
    };

    disputeRisks?.forEach(risk => {
      if (matrix[risk.risk_level] && matrix[risk.risk_level][risk.dispute_type] !== undefined) {
        matrix[risk.risk_level][risk.dispute_type]++;
      }
    });

    return matrix;
  }

  // Generate action plan
  generateActionPlan(disputeRisks, deadlines, warnings) {
    const actions = [];

    // Immediate actions (next 24 hours)
    const criticalRisks = disputeRisks?.filter(r => r.risk_level === 'critical') || [];
    const urgentDeadlines = deadlines?.filter(d => {
      const hoursRemaining = (new Date(d.due_date) - new Date()) / (1000 * 60 * 60);
      return hoursRemaining <= 24 && d.status === 'pending';
    }) || [];

    if (criticalRisks.length > 0 || urgentDeadlines.length > 0) {
      actions.push({
        timeframe: 'Immediate (24 hours)',
        priority: 'CRITICAL',
        actions: [
          ...criticalRisks.map(r => `Legal consultation for ${r.dispute_type} dispute on ${r.project?.name}`),
          ...urgentDeadlines.map(d => `Complete ${d.deadline_type} documentation`)
        ]
      });
    }

    // Short-term actions (next 7 days)
    const highRisks = disputeRisks?.filter(r => r.risk_level === 'high') || [];
    const weeklyDeadlines = deadlines?.filter(d => {
      const daysRemaining = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 7 && daysRemaining > 1 && d.status === 'pending';
    }) || [];

    if (highRisks.length > 0 || weeklyDeadlines.length > 0) {
      actions.push({
        timeframe: 'Short-term (7 days)',
        priority: 'HIGH',
        actions: [
          ...highRisks.map(r => `Intervention meeting for ${r.project?.name}`),
          ...weeklyDeadlines.map(d => `Prepare ${d.deadline_type} documentation`)
        ]
      });
    }

    // Medium-term actions (next 30 days)
    const mediumRisks = disputeRisks?.filter(r => r.risk_level === 'medium') || [];
    if (mediumRisks.length > 0) {
      actions.push({
        timeframe: 'Medium-term (30 days)',
        priority: 'MEDIUM',
        actions: mediumRisks.map(r => `Monitor and improve relationship on ${r.project?.name}`)
      });
    }

    return actions;
  }

  // Export dispute prevention report
  async exportDisputePreventionReport(companyId, format = 'json', options = {}) {
    try {
      const report = await this.generateDisputeRiskReport(companyId, options);

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(report, null, 2),
            filename: `dispute-prevention-report-${companyId}-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
          };

        case 'csv':
          return this.exportToCSV(report);

        case 'legal':
          return this.exportLegalPackage(report);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting dispute prevention report:', error);
      throw error;
    }
  }

  // Export to CSV format
  exportToCSV(report) {
    const csvSections = [];

    // Dispute Risks CSV
    if (report.sections.dispute_risks.data.length > 0) {
      const headers = ['Project', 'Subcontractor', 'Dispute Type', 'Risk Level', 'Risk Score', 'Escalation Stage', 'Estimated Value'];
      const rows = report.sections.dispute_risks.data.map(risk => [
        risk.project?.name || '',
        risk.subcontractor?.company_name || '',
        risk.dispute_type,
        risk.risk_level,
        risk.risk_score,
        risk.escalation_stage,
        risk.estimated_value || 0
      ]);

      csvSections.push('Dispute Risks');
      csvSections.push(headers.join(','));
      csvSections.push(...rows.map(row => row.join(',')));
      csvSections.push('');
    }

    return {
      data: csvSections.join('\n'),
      filename: `dispute-prevention-report-${report.companyId}-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  }

  // Export legal evidence package
  exportLegalPackage(report) {
    const legalContent = [
      'DISPUTE PREVENTION & EVIDENCE COMPILATION REPORT',
      '=' .repeat(60),
      '',
      `Generated: ${report.generatedAt}`,
      `Company ID: ${report.companyId}`,
      '',
      'EXECUTIVE SUMMARY',
      '-'.repeat(20),
      `Total Active Risks: ${report.executive_summary.total_active_risks}`,
      `Critical Risks: ${report.executive_summary.critical_risks}`,
      `Overall Risk Level: ${report.executive_summary.overall_risk_level}`,
      `Key Concern: ${report.executive_summary.key_concern}`,
      '',
      'IMMEDIATE ACTION REQUIRED',
      '-'.repeat(30)
    ];

    report.recommendations.slice(0, 5).forEach((rec, index) => {
      legalContent.push(`${index + 1}. ${rec.title} (${rec.priority})`);
      legalContent.push(`   Description: ${rec.description}`);
      legalContent.push(`   Action Required: ${rec.action}`);
      legalContent.push(`   Deadline: ${rec.deadline}`);
      legalContent.push(`   Responsible: ${rec.responsible}`);
      legalContent.push('');
    });

    legalContent.push('EVIDENCE READINESS STATUS');
    legalContent.push('-'.repeat(30));
    report.sections.evidence_packages.insights.forEach(insight => {
      legalContent.push(`• ${insight}`);
    });

    return {
      data: legalContent.join('\n'),
      filename: `legal-evidence-package-${report.companyId}-${new Date().toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain'
    };
  }
}

export default new DisputePreventionAPI();