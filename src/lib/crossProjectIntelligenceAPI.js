import { supabase } from './supabase';

class CrossProjectIntelligenceAPI {
  constructor() {
    this.supabase = supabase;
  }

  // Get comprehensive dashboard overview
  async getDashboardOverview(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('cross_project_intelligence_dashboard')
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

  // Detect recurring issues across projects
  async detectRecurringIssues(companyId, similarityThreshold = 0.7) {
    try {
      const { data, error } = await this.supabase
        .rpc('detect_recurring_issues', {
          p_company_id: companyId,
          p_similarity_threshold: similarityThreshold
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error detecting recurring issues:', error);
      throw error;
    }
  }

  // Identify design flaws
  async identifyDesignFlaws(companyId, minProjects = 2) {
    try {
      const { data, error } = await this.supabase
        .rpc('identify_design_flaws', {
          p_company_id: companyId,
          p_min_projects: minProjects
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error identifying design flaws:', error);
      throw error;
    }
  }

  // Get recurring issues with filters
  async getRecurringIssues(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('recurring_issues')
        .select(`
          *,
          projects:projects(name, status, architect_firm)
        `)
        .eq('company_id', companyId);

      if (filters.category) {
        query = query.eq('issue_category', filters.category);
      }

      if (filters.rootCause) {
        query = query.eq('root_cause_type', filters.rootCause);
      }

      if (filters.minOccurrences) {
        query = query.gte('occurrence_count', filters.minOccurrences);
      }

      if (filters.minCostImpact) {
        query = query.gte('total_cost_impact', filters.minCostImpact);
      }

      const { data, error } = await query
        .order('total_cost_impact', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recurring issues:', error);
      throw error;
    }
  }

  // Get design flaw tracker data
  async getDesignFlaws(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('design_flaw_tracker')
        .select('*')
        .eq('company_id', companyId);

      if (filters.architectFirm) {
        query = query.eq('architect_firm', filters.architectFirm);
      }

      if (filters.buildingType) {
        query = query.contains('building_types', [filters.buildingType]);
      }

      if (filters.minSeverity) {
        query = query.gte('severity_score', filters.minSeverity);
      }

      const { data, error } = await query
        .order('typical_cost_impact', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching design flaws:', error);
      throw error;
    }
  }

  // Get best practices library
  async getBestPractices(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('best_practices')
        .select('*')
        .eq('company_id', companyId);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minSuccessRate) {
        query = query.gte('success_rate_improvement', filters.minSuccessRate);
      }

      const { data, error } = await query
        .order('success_rate_improvement', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching best practices:', error);
      throw error;
    }
  }

  // Calculate project performance benchmarks
  async calculateProjectBenchmarks(companyId) {
    try {
      // Get all projects for the company
      const { data: projects, error: projectsError } = await this.supabase
        .from('projects')
        .select('id, name, budget, architect_firm')
        .eq('company_id', companyId);

      if (projectsError) throw projectsError;

      const benchmarks = [];

      for (const project of projects) {
        const { data: performance, error: perfError } = await this.supabase
          .rpc('calculate_project_performance', {
            p_project_id: project.id
          });

        if (perfError) {
          console.error(`Error calculating performance for project ${project.id}:`, perfError);
          continue;
        }

        if (performance && performance.length > 0) {
          const perf = performance[0];
          benchmarks.push({
            project_id: project.id,
            project_name: project.name,
            architect_firm: project.architect_firm,
            budget: project.budget,
            ...perf
          });
        }
      }

      return benchmarks;
    } catch (error) {
      console.error('Error calculating project benchmarks:', error);
      throw error;
    }
  }

  // Get project performance benchmarks
  async getProjectBenchmarks(companyId, filters = {}) {
    try {
      let query = this.supabase
        .from('project_benchmarks')
        .select(`
          *,
          project:projects(name, architect_firm, budget, status)
        `)
        .eq('company_id', companyId);

      if (filters.performanceGrade) {
        query = query.eq('performance_grade', filters.performanceGrade);
      }

      if (filters.minQualityScore) {
        query = query.gte('quality_score', filters.minQualityScore);
      }

      const { data, error } = await query
        .order('quality_score', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching project benchmarks:', error);
      throw error;
    }
  }

  // Identify success patterns
  async identifySuccessPatterns(companyId) {
    try {
      const { data, error } = await this.supabase
        .rpc('identify_success_patterns', {
          p_company_id: companyId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error identifying success patterns:', error);
      throw error;
    }
  }

  // Get success patterns
  async getSuccessPatterns(companyId) {
    try {
      const { data, error } = await this.supabase
        .from('success_patterns')
        .select('*')
        .eq('company_id', companyId)
        .order('confidence_level', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching success patterns:', error);
      throw error;
    }
  }

  // Compare projects
  async compareProjects(projectA, projectB) {
    try {
      // Get project details
      const { data: projects, error: projectsError } = await this.supabase
        .from('projects')
        .select('*')
        .in('id', [projectA, projectB]);

      if (projectsError) throw projectsError;

      // Get blockers for both projects
      const { data: blockersA, error: blockersErrorA } = await this.supabase
        .from('blockers')
        .select('*')
        .eq('project_id', projectA);

      const { data: blockersB, error: blockersErrorB } = await this.supabase
        .from('blockers')
        .select('*')
        .eq('project_id', projectB);

      if (blockersErrorA || blockersErrorB) {
        throw blockersErrorA || blockersErrorB;
      }

      const projectDataA = projects.find(p => p.id === projectA);
      const projectDataB = projects.find(p => p.id === projectB);

      // Calculate similarity factors
      const similarityFactors = this.calculateSimilarityFactors(
        projectDataA, projectDataB, blockersA, blockersB
      );

      // Calculate performance delta
      const performanceDelta = this.calculatePerformanceDelta(
        blockersA, blockersB
      );

      return {
        projects: { projectA: projectDataA, projectB: projectDataB },
        blockers: { projectA: blockersA, projectB: blockersB },
        similarity: similarityFactors,
        performance: performanceDelta
      };
    } catch (error) {
      console.error('Error comparing projects:', error);
      throw error;
    }
  }

  // Calculate similarity factors between projects
  calculateSimilarityFactors(projectA, projectB, blockersA, blockersB) {
    const factors = {};

    // Building type similarity
    factors.buildingType = projectA.building_type === projectB.building_type ? 100 : 0;

    // Budget similarity (within 20% considered similar)
    const budgetDiff = Math.abs(projectA.budget - projectB.budget) / Math.max(projectA.budget, projectB.budget);
    factors.budget = Math.max(0, 100 - (budgetDiff * 500));

    // Architect similarity
    factors.architect = projectA.architect_firm === projectB.architect_firm ? 100 : 0;

    // Blocker category similarity
    const categoriesA = [...new Set(blockersA.map(b => b.category))];
    const categoriesB = [...new Set(blockersB.map(b => b.category))];
    const commonCategories = categoriesA.filter(cat => categoriesB.includes(cat));
    const totalCategories = [...new Set([...categoriesA, ...categoriesB])];
    factors.blockerCategories = totalCategories.length > 0 ?
      (commonCategories.length / totalCategories.length) * 100 : 0;

    // Overall similarity score
    const weights = { buildingType: 0.3, budget: 0.2, architect: 0.2, blockerCategories: 0.3 };
    factors.overall = Object.keys(weights).reduce((sum, key) =>
      sum + (factors[key] * weights[key]), 0
    );

    return factors;
  }

  // Calculate performance delta between projects
  calculatePerformanceDelta(blockersA, blockersB) {
    const delta = {};

    // Total blockers
    delta.totalBlockers = {
      projectA: blockersA.length,
      projectB: blockersB.length,
      difference: blockersA.length - blockersB.length
    };

    // Average resolution time
    const avgResolutionA = blockersA.filter(b => b.resolved_date).reduce((sum, b) => {
      const days = (new Date(b.resolved_date) - new Date(b.created_date)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0) / blockersA.filter(b => b.resolved_date).length || 0;

    const avgResolutionB = blockersB.filter(b => b.resolved_date).reduce((sum, b) => {
      const days = (new Date(b.resolved_date) - new Date(b.created_date)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0) / blockersB.filter(b => b.resolved_date).length || 0;

    delta.averageResolution = {
      projectA: avgResolutionA,
      projectB: avgResolutionB,
      difference: avgResolutionA - avgResolutionB
    };

    // Cost impact
    const costImpactA = blockersA.reduce((sum, b) => sum + (b.cost_impact || 0), 0);
    const costImpactB = blockersB.reduce((sum, b) => sum + (b.cost_impact || 0), 0);

    delta.costImpact = {
      projectA: costImpactA,
      projectB: costImpactB,
      difference: costImpactA - costImpactB
    };

    return delta;
  }

  // Get correlation analysis data
  async getCorrelationAnalysis(companyId) {
    try {
      // Analyze correlations between project factors and outcomes
      const { data: projects, error: projectsError } = await this.supabase
        .from('projects')
        .select(`
          *,
          blockers(id, category, created_date, resolved_date, cost_impact)
        `)
        .eq('company_id', companyId);

      if (projectsError) throw projectsError;

      const correlations = this.calculateCorrelations(projects);
      return correlations;
    } catch (error) {
      console.error('Error getting correlation analysis:', error);
      throw error;
    }
  }

  // Calculate correlations between project factors and outcomes
  calculateCorrelations(projects) {
    const correlations = [];

    // Early drawings upload correlation
    const withEarlyDrawings = projects.filter(p => p.drawings_uploaded_pre_start);
    const withoutEarlyDrawings = projects.filter(p => !p.drawings_uploaded_pre_start);

    if (withEarlyDrawings.length > 0 && withoutEarlyDrawings.length > 0) {
      const avgBlockersWithEarly = withEarlyDrawings.reduce((sum, p) =>
        sum + p.blockers.length, 0) / withEarlyDrawings.length;
      const avgBlockersWithoutEarly = withoutEarlyDrawings.reduce((sum, p) =>
        sum + p.blockers.length, 0) / withoutEarlyDrawings.length;

      const improvement = ((avgBlockersWithoutEarly - avgBlockersWithEarly) / avgBlockersWithoutEarly) * 100;

      correlations.push({
        factor: 'Early Drawings Upload',
        insight: `Projects with drawings uploaded pre-start had ${Math.round(Math.abs(improvement))}% ${improvement > 0 ? 'fewer' : 'more'} blockers`,
        improvement: improvement,
        confidence: this.calculateConfidence(withEarlyDrawings.length + withoutEarlyDrawings.length),
        sample_size: withEarlyDrawings.length + withoutEarlyDrawings.length
      });
    }

    // Coordination meeting frequency correlation
    const frequentMeetings = projects.filter(p => p.coordination_meeting_frequency === 'weekly');
    const infrequentMeetings = projects.filter(p => p.coordination_meeting_frequency !== 'weekly');

    if (frequentMeetings.length > 0 && infrequentMeetings.length > 0) {
      const avgBlockersFrequent = frequentMeetings.reduce((sum, p) =>
        sum + p.blockers.length, 0) / frequentMeetings.length;
      const avgBlockersInfrequent = infrequentMeetings.reduce((sum, p) =>
        sum + p.blockers.length, 0) / infrequentMeetings.length;

      const improvement = ((avgBlockersInfrequent - avgBlockersFrequent) / avgBlockersInfrequent) * 100;

      correlations.push({
        factor: 'Weekly Coordination Meetings',
        insight: `Projects with weekly coordination meetings had ${Math.round(Math.abs(improvement))}% ${improvement > 0 ? 'fewer' : 'more'} coordination blockers`,
        improvement: improvement,
        confidence: this.calculateConfidence(frequentMeetings.length + infrequentMeetings.length),
        sample_size: frequentMeetings.length + infrequentMeetings.length
      });
    }

    return correlations.sort((a, b) => Math.abs(b.improvement) - Math.abs(a.improvement));
  }

  // Calculate statistical confidence based on sample size
  calculateConfidence(sampleSize) {
    if (sampleSize >= 20) return 90;
    if (sampleSize >= 10) return 75;
    if (sampleSize >= 5) return 60;
    return 40;
  }

  // Get trade performance analysis
  async getTradePerformanceAnalysis(companyId) {
    try {
      const { data: blockers, error } = await this.supabase
        .from('blockers')
        .select(`
          *,
          project:projects!inner(company_id, name)
        `)
        .eq('project.company_id', companyId);

      if (error) throw error;

      const tradeAnalysis = this.analyzeTradePerformance(blockers);
      return tradeAnalysis;
    } catch (error) {
      console.error('Error getting trade performance analysis:', error);
      throw error;
    }
  }

  // Analyze trade performance across projects
  analyzeTradePerformance(blockers) {
    const tradeStats = {};

    blockers.forEach(blocker => {
      const trade = blocker.trade || 'Unknown';

      if (!tradeStats[trade]) {
        tradeStats[trade] = {
          totalBlockers: 0,
          totalResolutionTime: 0,
          resolvedBlockers: 0,
          totalCostImpact: 0,
          categories: {},
          projects: new Set()
        };
      }

      const stats = tradeStats[trade];
      stats.totalBlockers++;
      stats.totalCostImpact += blocker.cost_impact || 0;
      stats.projects.add(blocker.project_id);

      if (blocker.resolved_date) {
        stats.resolvedBlockers++;
        const resolutionTime = (new Date(blocker.resolved_date) - new Date(blocker.created_date)) / (1000 * 60 * 60 * 24);
        stats.totalResolutionTime += resolutionTime;
      }

      const category = blocker.category || 'Other';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    // Calculate performance metrics for each trade
    const tradePerformance = Object.entries(tradeStats).map(([trade, stats]) => ({
      trade,
      totalBlockers: stats.totalBlockers,
      averageResolutionTime: stats.resolvedBlockers > 0 ?
        stats.totalResolutionTime / stats.resolvedBlockers : null,
      resolutionRate: (stats.resolvedBlockers / stats.totalBlockers) * 100,
      averageCostImpact: stats.totalCostImpact / stats.totalBlockers,
      projectsWorkedOn: stats.projects.size,
      topCategories: Object.entries(stats.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, count]) => ({ category, count }))
    }));

    return tradePerformance.sort((a, b) => a.averageResolutionTime - b.averageResolutionTime);
  }

  // Generate organizational learning report
  async generateLearningReport(companyId, options = {}) {
    try {
      const [
        overview,
        recurringIssues,
        designFlaws,
        bestPractices,
        successPatterns,
        correlations,
        tradePerformance,
        benchmarks
      ] = await Promise.all([
        this.getDashboardOverview(companyId),
        this.getRecurringIssues(companyId),
        this.getDesignFlaws(companyId),
        this.getBestPractices(companyId),
        this.getSuccessPatterns(companyId),
        this.getCorrelationAnalysis(companyId),
        this.getTradePerformanceAnalysis(companyId),
        this.getProjectBenchmarks(companyId)
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        companyId,
        executive_summary: this.generateExecutiveSummary(overview, recurringIssues, successPatterns),
        sections: {
          recurring_issues: {
            title: 'Recurring Issues Analysis',
            data: recurringIssues.slice(0, 10),
            insights: this.generateRecurringIssuesInsights(recurringIssues)
          },
          design_flaws: {
            title: 'Design Flaw Identification',
            data: designFlaws,
            insights: this.generateDesignFlawInsights(designFlaws)
          },
          best_practices: {
            title: 'Best Practices Library',
            data: bestPractices,
            insights: this.generateBestPracticesInsights(bestPractices)
          },
          success_patterns: {
            title: 'Success Pattern Analysis',
            data: successPatterns,
            insights: this.generateSuccessPatternsInsights(successPatterns)
          },
          correlations: {
            title: 'Correlation Analysis',
            data: correlations,
            insights: this.generateCorrelationInsights(correlations)
          },
          trade_performance: {
            title: 'Trade Performance Analysis',
            data: tradePerformance,
            insights: this.generateTradeInsights(tradePerformance)
          },
          project_benchmarks: {
            title: 'Project Performance Benchmarks',
            data: benchmarks,
            insights: this.generateBenchmarkInsights(benchmarks)
          }
        },
        recommendations: this.generateRecommendations(
          recurringIssues, designFlaws, successPatterns, correlations
        )
      };

      return report;
    } catch (error) {
      console.error('Error generating learning report:', error);
      throw error;
    }
  }

  // Generate executive summary
  generateExecutiveSummary(overview, recurringIssues, successPatterns) {
    return {
      total_projects_analyzed: overview?.analyzed_projects || 0,
      critical_issues_identified: overview?.critical_recurring_issues || 0,
      best_practices_documented: overview?.total_best_practices || 0,
      success_patterns_found: overview?.identified_success_patterns || 0,
      potential_savings: recurringIssues.slice(0, 5).reduce((sum, issue) =>
        sum + (issue.total_cost_impact || 0), 0
      ),
      key_insight: recurringIssues.length > 0 ?
        `Top recurring issue: ${recurringIssues[0]?.issue_description}` :
        'No significant recurring issues identified'
    };
  }

  // Generate insights for recurring issues
  generateRecurringIssuesInsights(issues) {
    if (issues.length === 0) return ['No recurring issues identified'];

    const insights = [];
    const topIssue = issues[0];

    insights.push(`Most costly recurring issue: "${topIssue.issue_description}" (${topIssue.occurrence_count} occurrences, £${topIssue.total_cost_impact?.toLocaleString()})`);

    const categories = issues.reduce((acc, issue) => {
      acc[issue.issue_category] = (acc[issue.issue_category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
    if (topCategory) {
      insights.push(`Most problematic category: ${topCategory[0]} (${topCategory[1]} different recurring issues)`);
    }

    return insights;
  }

  // Generate insights for design flaws
  generateDesignFlawInsights(flaws) {
    if (flaws.length === 0) return ['No significant design flaws identified'];

    const insights = [];
    const criticalFlaws = flaws.filter(f => f.severity_score >= 7);

    if (criticalFlaws.length > 0) {
      insights.push(`${criticalFlaws.length} critical design flaws identified requiring immediate attention`);
    }

    const architects = flaws.reduce((acc, flaw) => {
      if (flaw.architect_firm) {
        acc[flaw.architect_firm] = (acc[flaw.architect_firm] || 0) + 1;
      }
      return acc;
    }, {});

    const problematicArchitect = Object.entries(architects).sort(([,a], [,b]) => b - a)[0];
    if (problematicArchitect && problematicArchitect[1] > 1) {
      insights.push(`Architect firm "${problematicArchitect[0]}" associated with ${problematicArchitect[1]} design flaws`);
    }

    return insights;
  }

  // Generate insights for best practices
  generateBestPracticesInsights(practices) {
    if (practices.length === 0) return ['No best practices documented yet'];

    const insights = [];
    const topPractice = practices[0];

    insights.push(`Most effective practice: "${topPractice.practice_description}" (${topPractice.success_rate_improvement}% improvement)`);

    const totalTimeSaved = practices.reduce((sum, p) => sum + (p.average_time_saved || 0), 0);
    if (totalTimeSaved > 0) {
      insights.push(`Combined time savings potential: ${totalTimeSaved} days across all practices`);
    }

    return insights;
  }

  // Generate insights for success patterns
  generateSuccessPatternsInsights(patterns) {
    if (patterns.length === 0) return ['Insufficient data for pattern analysis'];

    const insights = [];
    const highConfidencePatterns = patterns.filter(p => p.confidence_level >= 75);

    insights.push(`${highConfidencePatterns.length} high-confidence success patterns identified`);

    if (patterns.length > 0) {
      const topPattern = patterns[0];
      insights.push(`Key success factor: ${topPattern.success_factor}`);
    }

    return insights;
  }

  // Generate insights for correlations
  generateCorrelationInsights(correlations) {
    if (correlations.length === 0) return ['Insufficient data for correlation analysis'];

    const insights = [];
    const significantCorrelations = correlations.filter(c => Math.abs(c.improvement) >= 20);

    significantCorrelations.slice(0, 3).forEach(correlation => {
      insights.push(correlation.insight);
    });

    return insights;
  }

  // Generate insights for trade performance
  generateTradeInsights(trades) {
    if (trades.length === 0) return ['No trade performance data available'];

    const insights = [];
    const fastestTrade = trades[0];
    const slowestTrade = trades[trades.length - 1];

    if (fastestTrade && slowestTrade && fastestTrade !== slowestTrade) {
      insights.push(`Fastest resolving trade: ${fastestTrade.trade} (${fastestTrade.averageResolutionTime?.toFixed(1)} days average)`);
      insights.push(`Slowest resolving trade: ${slowestTrade.trade} (${slowestTrade.averageResolutionTime?.toFixed(1)} days average)`);
    }

    const highPerformers = trades.filter(t => t.resolutionRate >= 90);
    if (highPerformers.length > 0) {
      insights.push(`${highPerformers.length} trades achieve 90%+ resolution rates`);
    }

    return insights;
  }

  // Generate insights for benchmarks
  generateBenchmarkInsights(benchmarks) {
    if (benchmarks.length === 0) return ['No project benchmarks available'];

    const insights = [];
    const gradeA = benchmarks.filter(b => b.performance_grade === 'A');
    const gradeF = benchmarks.filter(b => b.performance_grade === 'F');

    insights.push(`${gradeA.length} projects achieved Grade A performance`);

    if (gradeF.length > 0) {
      insights.push(`${gradeF.length} projects require significant improvement (Grade F)`);
    }

    const avgDensity = benchmarks.reduce((sum, b) => sum + (b.blocker_density || 0), 0) / benchmarks.length;
    insights.push(`Average blocker density: ${avgDensity.toFixed(2)} blockers per £1M`);

    return insights;
  }

  // Generate recommendations based on analysis
  generateRecommendations(recurringIssues, designFlaws, successPatterns, correlations) {
    const recommendations = [];

    // Top recurring issues recommendations
    if (recurringIssues.length > 0) {
      const topIssue = recurringIssues[0];
      recommendations.push({
        priority: 'High',
        category: 'Process Improvement',
        title: 'Address Top Recurring Issue',
        description: `Focus on resolving "${topIssue.issue_description}" which has occurred ${topIssue.occurrence_count} times`,
        action: topIssue.prevention_recommendation || 'Conduct root cause analysis and implement prevention strategy',
        expected_impact: `Potential savings of £${topIssue.total_cost_impact?.toLocaleString()}`
      });
    }

    // Design flaw recommendations
    const criticalFlaws = designFlaws.filter(f => f.severity_score >= 7);
    if (criticalFlaws.length > 0) {
      recommendations.push({
        priority: 'High',
        category: 'Design Process',
        title: 'Address Critical Design Flaws',
        description: `${criticalFlaws.length} critical design flaws identified requiring immediate attention`,
        action: 'Implement enhanced design review process and coordinate with architect firms',
        expected_impact: 'Reduce design-related blockers by 30-50%'
      });
    }

    // Success pattern recommendations
    if (successPatterns.length > 0) {
      const topPattern = successPatterns[0];
      recommendations.push({
        priority: 'Medium',
        category: 'Best Practices',
        title: 'Implement Success Pattern',
        description: `Adopt "${topPattern.pattern_name}" across all projects`,
        action: topPattern.success_factor,
        expected_impact: 'Improve project outcomes based on proven patterns'
      });
    }

    // Correlation-based recommendations
    const strongCorrelations = correlations.filter(c => Math.abs(c.improvement) >= 30);
    strongCorrelations.slice(0, 2).forEach(correlation => {
      recommendations.push({
        priority: 'Medium',
        category: 'Process Optimization',
        title: `Implement ${correlation.factor}`,
        description: correlation.insight,
        action: `Ensure ${correlation.factor.toLowerCase()} is standard practice`,
        expected_impact: `${Math.abs(correlation.improvement).toFixed(0)}% improvement in blocker reduction`
      });
    });

    return recommendations;
  }

  // Export learning report to various formats
  async exportLearningReport(companyId, format = 'json', options = {}) {
    try {
      const report = await this.generateLearningReport(companyId, options);

      switch (format) {
        case 'json':
          return {
            data: JSON.stringify(report, null, 2),
            filename: `cross-project-intelligence-${companyId}-${new Date().toISOString().split('T')[0]}.json`,
            mimeType: 'application/json'
          };

        case 'csv':
          return this.exportToCSV(report);

        case 'pdf':
          return this.exportToPDF(report);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting learning report:', error);
      throw error;
    }
  }

  // Export to CSV format
  exportToCSV(report) {
    const csvSections = [];

    // Recurring Issues CSV
    if (report.sections.recurring_issues.data.length > 0) {
      const headers = ['Issue Description', 'Category', 'Occurrences', 'Cost Impact', 'Root Cause', 'Prevention Recommendation'];
      const rows = report.sections.recurring_issues.data.map(issue => [
        issue.issue_description,
        issue.issue_category,
        issue.occurrence_count,
        issue.total_cost_impact || 0,
        issue.root_cause_type || '',
        issue.prevention_recommendation || ''
      ]);

      csvSections.push('Recurring Issues');
      csvSections.push(headers.join(','));
      csvSections.push(...rows.map(row => row.join(',')));
      csvSections.push('');
    }

    return {
      data: csvSections.join('\n'),
      filename: `cross-project-intelligence-${report.companyId}-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  }

  // Export to PDF format (placeholder - would need PDF library)
  exportToPDF(report) {
    // This would typically use a PDF generation library like jsPDF or puppeteer
    // For now, return formatted text that could be converted to PDF
    const pdfContent = [
      'CROSS-PROJECT INTELLIGENCE REPORT',
      '=' .repeat(50),
      '',
      'EXECUTIVE SUMMARY',
      '-'.repeat(20),
      `Projects Analyzed: ${report.executive_summary.total_projects_analyzed}`,
      `Critical Issues: ${report.executive_summary.critical_issues_identified}`,
      `Best Practices: ${report.executive_summary.best_practices_documented}`,
      `Success Patterns: ${report.executive_summary.success_patterns_found}`,
      '',
      'TOP RECOMMENDATIONS',
      '-'.repeat(20)
    ];

    report.recommendations.slice(0, 5).forEach((rec, index) => {
      pdfContent.push(`${index + 1}. ${rec.title} (${rec.priority} Priority)`);
      pdfContent.push(`   ${rec.description}`);
      pdfContent.push(`   Action: ${rec.action}`);
      pdfContent.push(`   Impact: ${rec.expected_impact}`);
      pdfContent.push('');
    });

    return {
      data: pdfContent.join('\n'),
      filename: `cross-project-intelligence-${report.companyId}-${new Date().toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain'
    };
  }
}

export default new CrossProjectIntelligenceAPI();