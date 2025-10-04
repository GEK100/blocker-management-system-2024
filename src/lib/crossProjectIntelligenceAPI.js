import { supabase } from './supabase';

class CrossProjectIntelligenceAPI {
  constructor() {
    this.supabase = supabase;
  }

  // Get comprehensive dashboard overview
  async getDashboardOverview(companyId) {
    try {
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock data for development
        return {
          analyzed_projects: 8,
          total_projects: 8,
          critical_recurring_issues: 5,
          recurring_issues_count: 12,
          design_flaws_found: 5,
          total_best_practices: 18,
          best_practices_identified: 18,
          identified_success_patterns: 7,
          cost_savings_achieved: 125000,
          productivity_improvement: 15.3,
          success_patterns_count: 7,
          lessons_learned_count: 23
        };
      }

      const { data, error } = await this.supabase
        .from('cross_project_intelligence_dashboard')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      // Return mock data as fallback
      return {
        analyzed_projects: 8,
        total_projects: 8,
        critical_recurring_issues: 5,
        recurring_issues_count: 12,
        design_flaws_found: 5,
        total_best_practices: 18,
        best_practices_identified: 18,
        identified_success_patterns: 7,
        cost_savings_achieved: 125000,
        productivity_improvement: 15.3,
        success_patterns_count: 7,
        lessons_learned_count: 23
      };
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock data for development
        return [
          {
            issue_id: 'mock-1',
            issue_description: 'Insufficient space for mechanical systems in ceiling void',
            issue_category: 'mechanical',
            occurrence_count: 8,
            total_cost_impact: 45000,
            root_cause_type: 'design_coordination',
            prevention_recommendation: 'Conduct thorough MEP coordination before finalizing ceiling heights',
            projects: [
              { name: 'Office Complex Alpha', status: 'completed', architect_firm: 'Modern Design Studio' },
              { name: 'Retail Center Beta', status: 'in_progress', architect_firm: 'Urban Architecture' }
            ]
          },
          {
            issue_id: 'mock-2',
            issue_description: 'Electrical conduit conflicts with structural elements',
            issue_category: 'electrical',
            occurrence_count: 6,
            total_cost_impact: 32000,
            root_cause_type: 'coordination_timing',
            prevention_recommendation: 'Schedule electrical rough-in reviews before concrete pour',
            projects: [
              { name: 'Hospital Wing Delta', status: 'completed', architect_firm: 'Healthcare Design Partners' }
            ]
          },
          {
            issue_id: 'mock-3',
            issue_description: 'Plumbing access panels blocked by architectural features',
            issue_category: 'plumbing',
            occurrence_count: 5,
            total_cost_impact: 28000,
            root_cause_type: 'design_oversight',
            prevention_recommendation: 'Include maintenance access requirements in initial design brief',
            projects: [
              { name: 'Apartment Complex Gamma', status: 'completed', architect_firm: 'Residential Designs Inc' }
            ]
          },
          {
            issue_id: 'mock-4',
            issue_description: 'Fire safety equipment access blocked during construction',
            issue_category: 'safety',
            occurrence_count: 4,
            total_cost_impact: 22000,
            root_cause_type: 'sequencing_error',
            prevention_recommendation: 'Create detailed construction sequencing plan for safety systems',
            projects: [
              { name: 'Shopping Mall Epsilon', status: 'in_progress', architect_firm: 'Commercial Architecture Group' }
            ]
          },
          {
            issue_id: 'mock-5',
            issue_description: 'Structural steel delivery delayed due to access constraints',
            issue_category: 'structural',
            occurrence_count: 3,
            total_cost_impact: 18000,
            root_cause_type: 'logistics_planning',
            prevention_recommendation: 'Conduct crane and delivery access study during pre-construction',
            projects: [
              { name: 'Corporate Tower Zeta', status: 'completed', architect_firm: 'Skyline Architects' }
            ]
          }
        ];
      }

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
      // Return mock data as fallback
      return [
        {
          issue_id: 'mock-1',
          issue_description: 'Insufficient space for mechanical systems in ceiling void',
          issue_category: 'mechanical',
          occurrence_count: 8,
          total_cost_impact: 45000,
          root_cause_type: 'design_coordination',
          prevention_recommendation: 'Conduct thorough MEP coordination before finalizing ceiling heights',
          projects: [
            { name: 'Office Complex Alpha', status: 'completed', architect_firm: 'Modern Design Studio' },
            { name: 'Retail Center Beta', status: 'in_progress', architect_firm: 'Urban Architecture' }
          ]
        },
        {
          issue_id: 'mock-2',
          issue_description: 'Electrical conduit conflicts with structural elements',
          issue_category: 'electrical',
          occurrence_count: 6,
          total_cost_impact: 32000,
          root_cause_type: 'coordination_timing',
          prevention_recommendation: 'Schedule electrical rough-in reviews before concrete pour',
          projects: [
            { name: 'Hospital Wing Delta', status: 'completed', architect_firm: 'Healthcare Design Partners' }
          ]
        },
        {
          issue_id: 'mock-3',
          issue_description: 'Plumbing access panels blocked by architectural features',
          issue_category: 'plumbing',
          occurrence_count: 5,
          total_cost_impact: 28000,
          root_cause_type: 'design_oversight',
          prevention_recommendation: 'Include maintenance access requirements in initial design brief',
          projects: [
            { name: 'Apartment Complex Gamma', status: 'completed', architect_firm: 'Residential Designs Inc' }
          ]
        },
        {
          issue_id: 'mock-4',
          issue_description: 'Fire safety equipment access blocked during construction',
          issue_category: 'safety',
          occurrence_count: 4,
          total_cost_impact: 22000,
          root_cause_type: 'sequencing_error',
          prevention_recommendation: 'Create detailed construction sequencing plan for safety systems',
          projects: [
            { name: 'Shopping Mall Epsilon', status: 'in_progress', architect_firm: 'Commercial Architecture Group' }
          ]
        },
        {
          issue_id: 'mock-5',
          issue_description: 'Structural steel delivery delayed due to access constraints',
          issue_category: 'structural',
          occurrence_count: 3,
          total_cost_impact: 18000,
          root_cause_type: 'logistics_planning',
          prevention_recommendation: 'Conduct crane and delivery access study during pre-construction',
          projects: [
            { name: 'Corporate Tower Zeta', status: 'completed', architect_firm: 'Skyline Architects' }
          ]
        }
      ];
    }
  }

  // Get design flaw tracker data
  async getDesignFlaws(companyId, filters = {}) {
    try {
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock data for development
        return [
          {
            flaw_id: 'mock-flaw-1',
            design_element: 'HVAC Ductwork Routing',
            severity_score: 8,
            projects_affected: ['project-1', 'project-2', 'project-3'],
            typical_cost_impact: 35000,
            architect_firm: 'Modern Design Studio',
            building_types: ['office', 'commercial'],
            recommended_design_change: 'Coordinate HVAC routing with structural framing during schematic design phase',
            detection_pattern: 'Recurring conflicts between mechanical systems and structural elements',
            prevention_strategy: 'Implement 3D coordination modeling for all MEP systems'
          },
          {
            flaw_id: 'mock-flaw-2',
            design_element: 'Window Placement vs. MEP Systems',
            severity_score: 7,
            projects_affected: ['project-2', 'project-4'],
            typical_cost_impact: 28000,
            architect_firm: 'Urban Architecture',
            building_types: ['residential', 'mixed_use'],
            recommended_design_change: 'Reserve dedicated zones for MEP systems near windows',
            detection_pattern: 'Window specifications conflict with required HVAC equipment placement',
            prevention_strategy: 'Early MEP consultant involvement in facade design'
          },
          {
            flaw_id: 'mock-flaw-3',
            design_element: 'Ceiling Height Coordination',
            severity_score: 6,
            projects_affected: ['project-1', 'project-3'],
            typical_cost_impact: 22000,
            architect_firm: 'Healthcare Design Partners',
            building_types: ['healthcare', 'institutional'],
            recommended_design_change: 'Add minimum 18" clearance above suspended ceiling for MEP systems',
            detection_pattern: 'Insufficient plenum space for mechanical equipment and ductwork',
            prevention_strategy: 'Standardize ceiling coordination requirements in design standards'
          },
          {
            flaw_id: 'mock-flaw-4',
            design_element: 'Structural Column Placement',
            severity_score: 5,
            projects_affected: ['project-5'],
            typical_cost_impact: 15000,
            architect_firm: 'Skyline Architects',
            building_types: ['office', 'commercial'],
            recommended_design_change: 'Align structural grid with equipment placement requirements',
            detection_pattern: 'Structural elements obstruct planned equipment access routes',
            prevention_strategy: 'Integrate structural and MEP coordination from conceptual design'
          },
          {
            flaw_id: 'mock-flaw-5',
            design_element: 'Electrical Room Access',
            severity_score: 4,
            projects_affected: ['project-2', 'project-6'],
            typical_cost_impact: 12000,
            architect_firm: 'Commercial Architecture Group',
            building_types: ['retail', 'commercial'],
            recommended_design_change: 'Ensure 36" minimum clear access around electrical panels',
            detection_pattern: 'Electrical equipment rooms lack adequate access clearance',
            prevention_strategy: 'Apply electrical code clearance requirements during space planning'
          }
        ];
      }

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
      // Return mock data as fallback
      return [
        {
          flaw_id: 'mock-flaw-1',
          design_element: 'HVAC Ductwork Routing',
          severity_score: 8,
          projects_affected: ['project-1', 'project-2', 'project-3'],
          typical_cost_impact: 35000,
          architect_firm: 'Modern Design Studio',
          building_types: ['office', 'commercial'],
          recommended_design_change: 'Coordinate HVAC routing with structural framing during schematic design phase',
          detection_pattern: 'Recurring conflicts between mechanical systems and structural elements',
          prevention_strategy: 'Implement 3D coordination modeling for all MEP systems'
        },
        {
          flaw_id: 'mock-flaw-2',
          design_element: 'Window Placement vs. MEP Systems',
          severity_score: 7,
          projects_affected: ['project-2', 'project-4'],
          typical_cost_impact: 28000,
          architect_firm: 'Urban Architecture',
          building_types: ['residential', 'mixed_use'],
          recommended_design_change: 'Reserve dedicated zones for MEP systems near windows',
          detection_pattern: 'Window specifications conflict with required HVAC equipment placement',
          prevention_strategy: 'Early MEP consultant involvement in facade design'
        },
        {
          flaw_id: 'mock-flaw-3',
          design_element: 'Ceiling Height Coordination',
          severity_score: 6,
          projects_affected: ['project-1', 'project-3'],
          typical_cost_impact: 22000,
          architect_firm: 'Healthcare Design Partners',
          building_types: ['healthcare', 'institutional'],
          recommended_design_change: 'Add minimum 18" clearance above suspended ceiling for MEP systems',
          detection_pattern: 'Insufficient plenum space for mechanical equipment and ductwork',
          prevention_strategy: 'Standardize ceiling coordination requirements in design standards'
        },
        {
          flaw_id: 'mock-flaw-4',
          design_element: 'Structural Column Placement',
          severity_score: 5,
          projects_affected: ['project-5'],
          typical_cost_impact: 15000,
          architect_firm: 'Skyline Architects',
          building_types: ['office', 'commercial'],
          recommended_design_change: 'Align structural grid with equipment placement requirements',
          detection_pattern: 'Structural elements obstruct planned equipment access routes',
          prevention_strategy: 'Integrate structural and MEP coordination from conceptual design'
        },
        {
          flaw_id: 'mock-flaw-5',
          design_element: 'Electrical Room Access',
          severity_score: 4,
          projects_affected: ['project-2', 'project-6'],
          typical_cost_impact: 12000,
          architect_firm: 'Commercial Architecture Group',
          building_types: ['retail', 'commercial'],
          recommended_design_change: 'Ensure 36" minimum clear access around electrical panels',
          detection_pattern: 'Electrical equipment rooms lack adequate access clearance',
          prevention_strategy: 'Apply electrical code clearance requirements during space planning'
        }
      ];
    }
  }

  // Get best practices library
  async getBestPractices(companyId, filters = {}) {
    try {
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock data for development
        return [
          {
            practice_id: 'mock-practice-1',
            category: 'coordination',
            practice_description: 'Weekly cross-trade coordination meetings during MEP rough-in',
            success_rate_improvement: 42.5,
            average_time_saved: 8.5,
            blocker_reduction_percentage: 65,
            projects_implemented: ['project-1', 'project-3', 'project-5'],
            implementation_guide: 'Schedule weekly 2-hour meetings with all MEP trades present. Use 3D models to identify and resolve conflicts before installation.',
            cost_savings_per_project: 25000,
            implementation_difficulty: 'Medium',
            required_resources: ['Project coordinator', '3D modeling software', 'Meeting room with projection']
          },
          {
            practice_id: 'mock-practice-2',
            category: 'design',
            practice_description: 'Early MEP consultant involvement in schematic design',
            success_rate_improvement: 38.2,
            average_time_saved: 12.0,
            blocker_reduction_percentage: 58,
            projects_implemented: ['project-2', 'project-4', 'project-6'],
            implementation_guide: 'Engage MEP consultants during initial design phases, not just design development. Include them in space planning discussions.',
            cost_savings_per_project: 32000,
            implementation_difficulty: 'Low',
            required_resources: ['Early consultant engagement budget', 'Design team coordination']
          },
          {
            practice_id: 'mock-practice-3',
            category: 'technology',
            practice_description: 'Building Information Modeling (BIM) clash detection protocols',
            success_rate_improvement: 35.8,
            average_time_saved: 15.5,
            blocker_reduction_percentage: 72,
            projects_implemented: ['project-1', 'project-2', 'project-7'],
            implementation_guide: 'Run automated clash detection weekly during design phase. Resolve all major clashes before construction documents.',
            cost_savings_per_project: 45000,
            implementation_difficulty: 'High',
            required_resources: ['BIM software licenses', 'Trained BIM coordinators', 'Standardized modeling protocols']
          },
          {
            practice_id: 'mock-practice-4',
            category: 'planning',
            practice_description: 'Pre-construction logistics and access planning',
            success_rate_improvement: 28.7,
            average_time_saved: 6.2,
            blocker_reduction_percentage: 45,
            projects_implemented: ['project-3', 'project-5'],
            implementation_guide: 'Conduct site logistics study before construction. Plan material delivery schedules and crane access routes.',
            cost_savings_per_project: 18000,
            implementation_difficulty: 'Medium',
            required_resources: ['Site survey team', 'Logistics coordinator', 'Crane and access planning software']
          },
          {
            practice_id: 'mock-practice-5',
            category: 'quality',
            practice_description: 'Progressive quality checkpoint system',
            success_rate_improvement: 25.4,
            average_time_saved: 4.8,
            blocker_reduction_percentage: 38,
            projects_implemented: ['project-4', 'project-6'],
            implementation_guide: 'Implement formal quality checkpoints at 25%, 50%, 75%, and 100% completion milestones for each trade.',
            cost_savings_per_project: 15000,
            implementation_difficulty: 'Low',
            required_resources: ['Quality control checklists', 'Dedicated QC inspector time']
          }
        ];
      }

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
      // Return mock data as fallback
      return [
        {
          practice_id: 'mock-practice-1',
          category: 'coordination',
          practice_description: 'Weekly cross-trade coordination meetings during MEP rough-in',
          success_rate_improvement: 42.5,
          average_time_saved: 8.5,
          blocker_reduction_percentage: 65,
          projects_implemented: ['project-1', 'project-3', 'project-5'],
          implementation_guide: 'Schedule weekly 2-hour meetings with all MEP trades present. Use 3D models to identify and resolve conflicts before installation.',
          cost_savings_per_project: 25000,
          implementation_difficulty: 'Medium',
          required_resources: ['Project coordinator', '3D modeling software', 'Meeting room with projection']
        },
        {
          practice_id: 'mock-practice-2',
          category: 'design',
          practice_description: 'Early MEP consultant involvement in schematic design',
          success_rate_improvement: 38.2,
          average_time_saved: 12.0,
          blocker_reduction_percentage: 58,
          projects_implemented: ['project-2', 'project-4', 'project-6'],
          implementation_guide: 'Engage MEP consultants during initial design phases, not just design development. Include them in space planning discussions.',
          cost_savings_per_project: 32000,
          implementation_difficulty: 'Low',
          required_resources: ['Early consultant engagement budget', 'Design team coordination']
        },
        {
          practice_id: 'mock-practice-3',
          category: 'technology',
          practice_description: 'Building Information Modeling (BIM) clash detection protocols',
          success_rate_improvement: 35.8,
          average_time_saved: 15.5,
          blocker_reduction_percentage: 72,
          projects_implemented: ['project-1', 'project-2', 'project-7'],
          implementation_guide: 'Run automated clash detection weekly during design phase. Resolve all major clashes before construction documents.',
          cost_savings_per_project: 45000,
          implementation_difficulty: 'High',
          required_resources: ['BIM software licenses', 'Trained BIM coordinators', 'Standardized modeling protocols']
        },
        {
          practice_id: 'mock-practice-4',
          category: 'planning',
          practice_description: 'Pre-construction logistics and access planning',
          success_rate_improvement: 28.7,
          average_time_saved: 6.2,
          blocker_reduction_percentage: 45,
          projects_implemented: ['project-3', 'project-5'],
          implementation_guide: 'Conduct site logistics study before construction. Plan material delivery schedules and crane access routes.',
          cost_savings_per_project: 18000,
          implementation_difficulty: 'Medium',
          required_resources: ['Site survey team', 'Logistics coordinator', 'Crane and access planning software']
        },
        {
          practice_id: 'mock-practice-5',
          category: 'quality',
          practice_description: 'Progressive quality checkpoint system',
          success_rate_improvement: 25.4,
          average_time_saved: 4.8,
          blocker_reduction_percentage: 38,
          projects_implemented: ['project-4', 'project-6'],
          implementation_guide: 'Implement formal quality checkpoints at 25%, 50%, 75%, and 100% completion milestones for each trade.',
          cost_savings_per_project: 15000,
          implementation_difficulty: 'Low',
          required_resources: ['Quality control checklists', 'Dedicated QC inspector time']
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock project benchmark data for development
        return [
          {
            benchmark_id: 'mock-benchmark-1',
            project_id: 'project-1',
            performance_grade: 'A',
            total_blockers: 8,
            average_resolution_time: 3.2,
            blocker_density: 2.1,
            cost_impact_percentage: 1.8,
            quality_score: 94,
            project: {
              name: 'Office Complex Alpha',
              architect_firm: 'Modern Design Studio',
              budget: 3800000,
              status: 'completed'
            },
            key_success_factors: [
              'Early drawing uploads',
              'Weekly coordination meetings',
              'Experienced project team'
            ],
            areas_for_improvement: [
              'Minor scheduling optimizations'
            ]
          },
          {
            benchmark_id: 'mock-benchmark-2',
            project_id: 'project-2',
            performance_grade: 'A',
            total_blockers: 6,
            average_resolution_time: 2.8,
            blocker_density: 1.8,
            cost_impact_percentage: 1.2,
            quality_score: 96,
            project: {
              name: 'Hospital Wing Delta',
              architect_firm: 'Healthcare Design Partners',
              budget: 3300000,
              status: 'completed'
            },
            key_success_factors: [
              'BIM coordination excellence',
              'Quality checkpoint system',
              'Strong architect partnership'
            ],
            areas_for_improvement: [
              'Continue excellent practices'
            ]
          },
          {
            benchmark_id: 'mock-benchmark-3',
            project_id: 'project-3',
            performance_grade: 'B',
            total_blockers: 14,
            average_resolution_time: 5.1,
            blocker_density: 3.2,
            cost_impact_percentage: 2.8,
            quality_score: 82,
            project: {
              name: 'Retail Center Beta',
              architect_firm: 'Urban Architecture',
              budget: 4400000,
              status: 'in_progress'
            },
            key_success_factors: [
              'Good trade coordination',
              'Adequate resource allocation'
            ],
            areas_for_improvement: [
              'Improve early design coordination',
              'Enhance material delivery planning'
            ]
          },
          {
            benchmark_id: 'mock-benchmark-4',
            project_id: 'project-4',
            performance_grade: 'B',
            total_blockers: 16,
            average_resolution_time: 6.3,
            blocker_density: 3.8,
            cost_impact_percentage: 3.2,
            quality_score: 78,
            project: {
              name: 'Apartment Complex Gamma',
              architect_firm: 'Residential Designs Inc',
              budget: 4200000,
              status: 'completed'
            },
            key_success_factors: [
              'Effective problem resolution',
              'Good client communication'
            ],
            areas_for_improvement: [
              'Reduce initial design conflicts',
              'Improve MEP coordination timing'
            ]
          },
          {
            benchmark_id: 'mock-benchmark-5',
            project_id: 'project-5',
            performance_grade: 'C',
            total_blockers: 23,
            average_resolution_time: 8.7,
            blocker_density: 5.2,
            cost_impact_percentage: 4.8,
            quality_score: 65,
            project: {
              name: 'Shopping Mall Epsilon',
              architect_firm: 'Commercial Architecture Group',
              budget: 4400000,
              status: 'in_progress'
            },
            key_success_factors: [
              'Large project management capability',
              'Multi-trade coordination experience'
            ],
            areas_for_improvement: [
              'Implement BIM coordination',
              'Enhance pre-construction planning',
              'Improve architect collaboration'
            ]
          },
          {
            benchmark_id: 'mock-benchmark-6',
            project_id: 'project-6',
            performance_grade: 'D',
            total_blockers: 31,
            average_resolution_time: 12.1,
            blocker_density: 7.8,
            cost_impact_percentage: 6.5,
            quality_score: 52,
            project: {
              name: 'Corporate Tower Zeta',
              architect_firm: 'Skyline Architects',
              budget: 4000000,
              status: 'completed'
            },
            key_success_factors: [
              'Project completion achieved',
              'Lessons learned documented'
            ],
            areas_for_improvement: [
              'Complete redesign of coordination process',
              'Implement early intervention strategies',
              'Establish architect performance requirements'
            ]
          }
        ];
      }

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
      // Return mock project benchmark data as fallback
      return [
        {
          benchmark_id: 'mock-benchmark-1',
          project_id: 'project-1',
          performance_grade: 'A',
          total_blockers: 8,
          average_resolution_time: 3.2,
          blocker_density: 2.1,
          cost_impact_percentage: 1.8,
          quality_score: 94,
          project: {
            name: 'Office Complex Alpha',
            architect_firm: 'Modern Design Studio',
            budget: 3800000,
            status: 'completed'
          },
          key_success_factors: [
            'Early drawing uploads',
            'Weekly coordination meetings',
            'Experienced project team'
          ],
          areas_for_improvement: [
            'Minor scheduling optimizations'
          ]
        },
        {
          benchmark_id: 'mock-benchmark-2',
          project_id: 'project-2',
          performance_grade: 'A',
          total_blockers: 6,
          average_resolution_time: 2.8,
          blocker_density: 1.8,
          cost_impact_percentage: 1.2,
          quality_score: 96,
          project: {
            name: 'Hospital Wing Delta',
            architect_firm: 'Healthcare Design Partners',
            budget: 3300000,
            status: 'completed'
          },
          key_success_factors: [
            'BIM coordination excellence',
            'Quality checkpoint system',
            'Strong architect partnership'
          ],
          areas_for_improvement: [
            'Continue excellent practices'
          ]
        },
        {
          benchmark_id: 'mock-benchmark-3',
          project_id: 'project-3',
          performance_grade: 'B',
          total_blockers: 14,
          average_resolution_time: 5.1,
          blocker_density: 3.2,
          cost_impact_percentage: 2.8,
          quality_score: 82,
          project: {
            name: 'Retail Center Beta',
            architect_firm: 'Urban Architecture',
            budget: 4400000,
            status: 'in_progress'
          },
          key_success_factors: [
            'Good trade coordination',
            'Adequate resource allocation'
          ],
          areas_for_improvement: [
            'Improve early design coordination',
            'Enhance material delivery planning'
          ]
        },
        {
          benchmark_id: 'mock-benchmark-4',
          project_id: 'project-4',
          performance_grade: 'B',
          total_blockers: 16,
          average_resolution_time: 6.3,
          blocker_density: 3.8,
          cost_impact_percentage: 3.2,
          quality_score: 78,
          project: {
            name: 'Apartment Complex Gamma',
            architect_firm: 'Residential Designs Inc',
            budget: 4200000,
            status: 'completed'
          },
          key_success_factors: [
            'Effective problem resolution',
            'Good client communication'
          ],
          areas_for_improvement: [
            'Reduce initial design conflicts',
            'Improve MEP coordination timing'
          ]
        },
        {
          benchmark_id: 'mock-benchmark-5',
          project_id: 'project-5',
          performance_grade: 'C',
          total_blockers: 23,
          average_resolution_time: 8.7,
          blocker_density: 5.2,
          cost_impact_percentage: 4.8,
          quality_score: 65,
          project: {
            name: 'Shopping Mall Epsilon',
            architect_firm: 'Commercial Architecture Group',
            budget: 4400000,
            status: 'in_progress'
          },
          key_success_factors: [
            'Large project management capability',
            'Multi-trade coordination experience'
          ],
          areas_for_improvement: [
            'Implement BIM coordination',
            'Enhance pre-construction planning',
            'Improve architect collaboration'
          ]
        },
        {
          benchmark_id: 'mock-benchmark-6',
          project_id: 'project-6',
          performance_grade: 'D',
          total_blockers: 31,
          average_resolution_time: 12.1,
          blocker_density: 7.8,
          cost_impact_percentage: 6.5,
          quality_score: 52,
          project: {
            name: 'Corporate Tower Zeta',
            architect_firm: 'Skyline Architects',
            budget: 4000000,
            status: 'completed'
          },
          key_success_factors: [
            'Project completion achieved',
            'Lessons learned documented'
          ],
          areas_for_improvement: [
            'Complete redesign of coordination process',
            'Implement early intervention strategies',
            'Establish architect performance requirements'
          ]
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock data for development
        return [
          {
            pattern_id: 'mock-pattern-1',
            pattern_name: 'Early Drawing Upload Success Pattern',
            success_factor: 'Projects with drawings uploaded 2+ weeks before construction start show 45% fewer coordination blockers',
            confidence_level: 87,
            supporting_projects: ['project-1', 'project-3', 'project-5', 'project-7'],
            success_metrics: {
              blocker_reduction: 45,
              cost_savings: 28000,
              time_savings: 12.5,
              quality_improvement: 15
            },
            implementation_requirements: [
              'Design team availability 2 weeks pre-construction',
              'Document management system setup',
              'Trade coordination schedule'
            ],
            risk_factors: ['Architect availability', 'Client approval delays'],
            replication_guide: 'Establish firm deadline for drawing uploads minimum 2 weeks before any trade work begins'
          },
          {
            pattern_id: 'mock-pattern-2',
            pattern_name: 'BIM Coordination Excellence Pattern',
            success_factor: 'Projects using weekly BIM clash detection during design phase show 62% reduction in field conflicts',
            confidence_level: 82,
            supporting_projects: ['project-2', 'project-4', 'project-6'],
            success_metrics: {
              blocker_reduction: 62,
              cost_savings: 42000,
              time_savings: 18.0,
              quality_improvement: 25
            },
            implementation_requirements: [
              'BIM software licenses for all consultants',
              'Weekly coordination meetings',
              'Trained BIM coordinators'
            ],
            risk_factors: ['Software learning curve', 'Consultant participation'],
            replication_guide: 'Require all consultants to maintain updated BIM models and participate in weekly clash detection reviews'
          },
          {
            pattern_id: 'mock-pattern-3',
            pattern_name: 'Experienced Architect Partnership Pattern',
            success_factor: 'Projects with architect firms having 5+ similar projects show 35% better coordination outcomes',
            confidence_level: 76,
            supporting_projects: ['project-1', 'project-2', 'project-8'],
            success_metrics: {
              blocker_reduction: 35,
              cost_savings: 22000,
              time_savings: 8.5,
              quality_improvement: 12
            },
            implementation_requirements: [
              'Architect portfolio review process',
              'Reference project evaluations',
              'Experience scoring criteria'
            ],
            risk_factors: ['Limited architect options', 'Higher fees for experienced firms'],
            replication_guide: 'Prioritize architect firms with demonstrated success in similar building types and scales'
          },
          {
            pattern_id: 'mock-pattern-4',
            pattern_name: 'Trade Sequencing Optimization Pattern',
            success_factor: 'Projects with detailed trade sequencing plans created pre-construction show 28% fewer delays',
            confidence_level: 73,
            supporting_projects: ['project-3', 'project-5', 'project-9'],
            success_metrics: {
              blocker_reduction: 28,
              cost_savings: 15000,
              time_savings: 6.2,
              quality_improvement: 8
            },
            implementation_requirements: [
              'Pre-construction planning time',
              'Trade input on sequencing',
              'Detailed schedule creation'
            ],
            risk_factors: ['Trade availability changes', 'Weather dependencies'],
            replication_guide: 'Develop comprehensive trade sequencing plan with input from all major trades before construction starts'
          },
          {
            pattern_id: 'mock-pattern-5',
            pattern_name: 'Quality Checkpoint System Pattern',
            success_factor: 'Projects with formal quality checkpoints at 25%, 50%, 75% completion show 32% fewer rework issues',
            confidence_level: 69,
            supporting_projects: ['project-4', 'project-6', 'project-10'],
            success_metrics: {
              blocker_reduction: 32,
              cost_savings: 18500,
              time_savings: 7.8,
              quality_improvement: 20
            },
            implementation_requirements: [
              'Quality control checklists',
              'Dedicated inspection time',
              'Documentation system'
            ],
            risk_factors: ['Inspector availability', 'Schedule pressure'],
            replication_guide: 'Implement mandatory quality checkpoints with formal sign-offs at key completion milestones'
          }
        ];
      }

      const { data, error } = await this.supabase
        .from('success_patterns')
        .select('*')
        .eq('company_id', companyId)
        .order('confidence_level', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching success patterns:', error);
      // Return mock data as fallback
      return [
        {
          pattern_id: 'mock-pattern-1',
          pattern_name: 'Early Drawing Upload Success Pattern',
          success_factor: 'Projects with drawings uploaded 2+ weeks before construction start show 45% fewer coordination blockers',
          confidence_level: 87,
          supporting_projects: ['project-1', 'project-3', 'project-5', 'project-7'],
          success_metrics: {
            blocker_reduction: 45,
            cost_savings: 28000,
            time_savings: 12.5,
            quality_improvement: 15
          },
          implementation_requirements: [
            'Design team availability 2 weeks pre-construction',
            'Document management system setup',
            'Trade coordination schedule'
          ],
          risk_factors: ['Architect availability', 'Client approval delays'],
          replication_guide: 'Establish firm deadline for drawing uploads minimum 2 weeks before any trade work begins'
        },
        {
          pattern_id: 'mock-pattern-2',
          pattern_name: 'BIM Coordination Excellence Pattern',
          success_factor: 'Projects using weekly BIM clash detection during design phase show 62% reduction in field conflicts',
          confidence_level: 82,
          supporting_projects: ['project-2', 'project-4', 'project-6'],
          success_metrics: {
            blocker_reduction: 62,
            cost_savings: 42000,
            time_savings: 18.0,
            quality_improvement: 25
          },
          implementation_requirements: [
            'BIM software licenses for all consultants',
            'Weekly coordination meetings',
            'Trained BIM coordinators'
          ],
          risk_factors: ['Software learning curve', 'Consultant participation'],
          replication_guide: 'Require all consultants to maintain updated BIM models and participate in weekly clash detection reviews'
        },
        {
          pattern_id: 'mock-pattern-3',
          pattern_name: 'Experienced Architect Partnership Pattern',
          success_factor: 'Projects with architect firms having 5+ similar projects show 35% better coordination outcomes',
          confidence_level: 76,
          supporting_projects: ['project-1', 'project-2', 'project-8'],
          success_metrics: {
            blocker_reduction: 35,
            cost_savings: 22000,
            time_savings: 8.5,
            quality_improvement: 12
          },
          implementation_requirements: [
            'Architect portfolio review process',
            'Reference project evaluations',
            'Experience scoring criteria'
          ],
          risk_factors: ['Limited architect options', 'Higher fees for experienced firms'],
          replication_guide: 'Prioritize architect firms with demonstrated success in similar building types and scales'
        },
        {
          pattern_id: 'mock-pattern-4',
          pattern_name: 'Trade Sequencing Optimization Pattern',
          success_factor: 'Projects with detailed trade sequencing plans created pre-construction show 28% fewer delays',
          confidence_level: 73,
          supporting_projects: ['project-3', 'project-5', 'project-9'],
          success_metrics: {
            blocker_reduction: 28,
            cost_savings: 15000,
            time_savings: 6.2,
            quality_improvement: 8
          },
          implementation_requirements: [
            'Pre-construction planning time',
            'Trade input on sequencing',
            'Detailed schedule creation'
          ],
          risk_factors: ['Trade availability changes', 'Weather dependencies'],
          replication_guide: 'Develop comprehensive trade sequencing plan with input from all major trades before construction starts'
        },
        {
          pattern_id: 'mock-pattern-5',
          pattern_name: 'Quality Checkpoint System Pattern',
          success_factor: 'Projects with formal quality checkpoints at 25%, 50%, 75% completion show 32% fewer rework issues',
          confidence_level: 69,
          supporting_projects: ['project-4', 'project-6', 'project-10'],
          success_metrics: {
            blocker_reduction: 32,
            cost_savings: 18500,
            time_savings: 7.8,
            quality_improvement: 20
          },
          implementation_requirements: [
            'Quality control checklists',
            'Dedicated inspection time',
            'Documentation system'
          ],
          risk_factors: ['Inspector availability', 'Schedule pressure'],
          replication_guide: 'Implement mandatory quality checkpoints with formal sign-offs at key completion milestones'
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock correlation data for development
        return [
          {
            factor: 'Early Drawings Upload',
            insight: 'Projects with drawings uploaded 2+ weeks before construction start had 45% fewer coordination blockers',
            improvement: 45.2,
            confidence: 87,
            sample_size: 12,
            correlation_strength: 'Strong',
            statistical_significance: 'High',
            supporting_data: {
              with_factor: { avg_blockers: 6.2, projects: 8 },
              without_factor: { avg_blockers: 11.3, projects: 4 }
            }
          },
          {
            factor: 'Weekly BIM Coordination Meetings',
            insight: 'Projects with weekly BIM coordination meetings during design phase had 38% fewer design conflicts',
            improvement: 38.1,
            confidence: 82,
            sample_size: 10,
            correlation_strength: 'Strong',
            statistical_significance: 'High',
            supporting_data: {
              with_factor: { avg_blockers: 7.1, projects: 6 },
              without_factor: { avg_blockers: 11.5, projects: 4 }
            }
          },
          {
            factor: 'Experienced Architect Firm (5+ Similar Projects)',
            insight: 'Projects with experienced architect firms showed 32% reduction in design-related blockers',
            improvement: 32.4,
            confidence: 76,
            sample_size: 9,
            correlation_strength: 'Moderate',
            statistical_significance: 'Medium',
            supporting_data: {
              with_factor: { avg_blockers: 8.3, projects: 5 },
              without_factor: { avg_blockers: 12.3, projects: 4 }
            }
          },
          {
            factor: 'Pre-Construction Trade Sequencing',
            insight: 'Projects with detailed trade sequencing plans had 28% fewer scheduling conflicts',
            improvement: 28.7,
            confidence: 71,
            sample_size: 8,
            correlation_strength: 'Moderate',
            statistical_significance: 'Medium',
            supporting_data: {
              with_factor: { avg_blockers: 9.1, projects: 4 },
              without_factor: { avg_blockers: 12.8, projects: 4 }
            }
          },
          {
            factor: 'Quality Checkpoint System',
            insight: 'Projects with formal quality checkpoints showed 25% reduction in rework-related blockers',
            improvement: 25.3,
            confidence: 68,
            sample_size: 7,
            correlation_strength: 'Moderate',
            statistical_significance: 'Medium',
            supporting_data: {
              with_factor: { avg_blockers: 9.8, projects: 3 },
              without_factor: { avg_blockers: 13.1, projects: 4 }
            }
          },
          {
            factor: 'Early MEP Consultant Involvement',
            insight: 'Projects with MEP consultants involved in schematic design had 22% fewer MEP conflicts',
            improvement: 22.1,
            confidence: 64,
            sample_size: 6,
            correlation_strength: 'Weak-Moderate',
            statistical_significance: 'Low-Medium',
            supporting_data: {
              with_factor: { avg_blockers: 10.2, projects: 3 },
              without_factor: { avg_blockers: 13.1, projects: 3 }
            }
          }
        ];
      }

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
      // Return mock correlation data as fallback
      return [
        {
          factor: 'Early Drawings Upload',
          insight: 'Projects with drawings uploaded 2+ weeks before construction start had 45% fewer coordination blockers',
          improvement: 45.2,
          confidence: 87,
          sample_size: 12,
          correlation_strength: 'Strong',
          statistical_significance: 'High',
          supporting_data: {
            with_factor: { avg_blockers: 6.2, projects: 8 },
            without_factor: { avg_blockers: 11.3, projects: 4 }
          }
        },
        {
          factor: 'Weekly BIM Coordination Meetings',
          insight: 'Projects with weekly BIM coordination meetings during design phase had 38% fewer design conflicts',
          improvement: 38.1,
          confidence: 82,
          sample_size: 10,
          correlation_strength: 'Strong',
          statistical_significance: 'High',
          supporting_data: {
            with_factor: { avg_blockers: 7.1, projects: 6 },
            without_factor: { avg_blockers: 11.5, projects: 4 }
          }
        },
        {
          factor: 'Experienced Architect Firm (5+ Similar Projects)',
          insight: 'Projects with experienced architect firms showed 32% reduction in design-related blockers',
          improvement: 32.4,
          confidence: 76,
          sample_size: 9,
          correlation_strength: 'Moderate',
          statistical_significance: 'Medium',
          supporting_data: {
            with_factor: { avg_blockers: 8.3, projects: 5 },
            without_factor: { avg_blockers: 12.3, projects: 4 }
          }
        },
        {
          factor: 'Pre-Construction Trade Sequencing',
          insight: 'Projects with detailed trade sequencing plans had 28% fewer scheduling conflicts',
          improvement: 28.7,
          confidence: 71,
          sample_size: 8,
          correlation_strength: 'Moderate',
          statistical_significance: 'Medium',
          supporting_data: {
            with_factor: { avg_blockers: 9.1, projects: 4 },
            without_factor: { avg_blockers: 12.8, projects: 4 }
          }
        },
        {
          factor: 'Quality Checkpoint System',
          insight: 'Projects with formal quality checkpoints showed 25% reduction in rework-related blockers',
          improvement: 25.3,
          confidence: 68,
          sample_size: 7,
          correlation_strength: 'Moderate',
          statistical_significance: 'Medium',
          supporting_data: {
            with_factor: { avg_blockers: 9.8, projects: 3 },
            without_factor: { avg_blockers: 13.1, projects: 4 }
          }
        },
        {
          factor: 'Early MEP Consultant Involvement',
          insight: 'Projects with MEP consultants involved in schematic design had 22% fewer MEP conflicts',
          improvement: 22.1,
          confidence: 64,
          sample_size: 6,
          correlation_strength: 'Weak-Moderate',
          statistical_significance: 'Low-Medium',
          supporting_data: {
            with_factor: { avg_blockers: 10.2, projects: 3 },
            without_factor: { avg_blockers: 13.1, projects: 3 }
          }
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock trade performance data for development
        return [
          {
            trade: 'Electrical',
            totalBlockers: 18,
            averageResolutionTime: 4.2,
            resolutionRate: 94.4,
            averageCostImpact: 3200,
            projectsWorkedOn: 6,
            topCategories: [
              { category: 'coordination', count: 8 },
              { category: 'material_delay', count: 5 },
              { category: 'design_change', count: 3 }
            ],
            performance_grade: 'A',
            improvement_recommendations: [
              'Continue current coordination practices',
              'Pre-order critical materials earlier'
            ]
          },
          {
            trade: 'HVAC',
            totalBlockers: 22,
            averageResolutionTime: 5.8,
            resolutionRate: 86.4,
            averageCostImpact: 4500,
            projectsWorkedOn: 5,
            topCategories: [
              { category: 'space_conflict', count: 9 },
              { category: 'equipment_access', count: 7 },
              { category: 'coordination', count: 4 }
            ],
            performance_grade: 'B',
            improvement_recommendations: [
              'Improve early space coordination',
              'Plan equipment access routes during design'
            ]
          },
          {
            trade: 'Plumbing',
            totalBlockers: 15,
            averageResolutionTime: 6.3,
            resolutionRate: 80.0,
            averageCostImpact: 2800,
            projectsWorkedOn: 4,
            topCategories: [
              { category: 'access_issues', count: 6 },
              { category: 'coordination', count: 5 },
              { category: 'material_delay', count: 3 }
            ],
            performance_grade: 'B',
            improvement_recommendations: [
              'Address access planning earlier',
              'Improve coordination meeting attendance'
            ]
          },
          {
            trade: 'Structural Steel',
            totalBlockers: 12,
            averageResolutionTime: 8.1,
            resolutionRate: 83.3,
            averageCostImpact: 8200,
            projectsWorkedOn: 3,
            topCategories: [
              { category: 'delivery_logistics', count: 5 },
              { category: 'crane_access', count: 4 },
              { category: 'sequencing', count: 2 }
            ],
            performance_grade: 'C',
            improvement_recommendations: [
              'Enhance delivery and crane access planning',
              'Improve construction sequencing coordination'
            ]
          },
          {
            trade: 'Drywall',
            totalBlockers: 9,
            averageResolutionTime: 3.2,
            resolutionRate: 100.0,
            averageCostImpact: 1500,
            projectsWorkedOn: 4,
            topCategories: [
              { category: 'preceding_work', count: 4 },
              { category: 'material_quality', count: 3 },
              { category: 'scheduling', count: 2 }
            ],
            performance_grade: 'A',
            improvement_recommendations: [
              'Maintain excellent performance standards',
              'Share best practices with other trades'
            ]
          },
          {
            trade: 'Flooring',
            totalBlockers: 7,
            averageResolutionTime: 9.5,
            resolutionRate: 71.4,
            averageCostImpact: 2200,
            projectsWorkedOn: 3,
            topCategories: [
              { category: 'surface_prep', count: 3 },
              { category: 'material_delay', count: 2 },
              { category: 'moisture_issues', count: 2 }
            ],
            performance_grade: 'D',
            improvement_recommendations: [
              'Improve surface preparation coordination',
              'Address moisture control issues systematically'
            ]
          }
        ];
      }

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
      // Return mock trade performance data as fallback
      return [
        {
          trade: 'Electrical',
          totalBlockers: 18,
          averageResolutionTime: 4.2,
          resolutionRate: 94.4,
          averageCostImpact: 3200,
          projectsWorkedOn: 6,
          topCategories: [
            { category: 'coordination', count: 8 },
            { category: 'material_delay', count: 5 },
            { category: 'design_change', count: 3 }
          ],
          performance_grade: 'A',
          improvement_recommendations: [
            'Continue current coordination practices',
            'Pre-order critical materials earlier'
          ]
        },
        {
          trade: 'HVAC',
          totalBlockers: 22,
          averageResolutionTime: 5.8,
          resolutionRate: 86.4,
          averageCostImpact: 4500,
          projectsWorkedOn: 5,
          topCategories: [
            { category: 'space_conflict', count: 9 },
            { category: 'equipment_access', count: 7 },
            { category: 'coordination', count: 4 }
          ],
          performance_grade: 'B',
          improvement_recommendations: [
            'Improve early space coordination',
            'Plan equipment access routes during design'
          ]
        },
        {
          trade: 'Plumbing',
          totalBlockers: 15,
          averageResolutionTime: 6.3,
          resolutionRate: 80.0,
          averageCostImpact: 2800,
          projectsWorkedOn: 4,
          topCategories: [
            { category: 'access_issues', count: 6 },
            { category: 'coordination', count: 5 },
            { category: 'material_delay', count: 3 }
          ],
          performance_grade: 'B',
          improvement_recommendations: [
            'Address access planning earlier',
            'Improve coordination meeting attendance'
          ]
        },
        {
          trade: 'Structural Steel',
          totalBlockers: 12,
          averageResolutionTime: 8.1,
          resolutionRate: 83.3,
          averageCostImpact: 8200,
          projectsWorkedOn: 3,
          topCategories: [
            { category: 'delivery_logistics', count: 5 },
            { category: 'crane_access', count: 4 },
            { category: 'sequencing', count: 2 }
          ],
          performance_grade: 'C',
          improvement_recommendations: [
            'Enhance delivery and crane access planning',
            'Improve construction sequencing coordination'
          ]
        },
        {
          trade: 'Drywall',
          totalBlockers: 9,
          averageResolutionTime: 3.2,
          resolutionRate: 100.0,
          averageCostImpact: 1500,
          projectsWorkedOn: 4,
          topCategories: [
            { category: 'preceding_work', count: 4 },
            { category: 'material_quality', count: 3 },
            { category: 'scheduling', count: 2 }
          ],
          performance_grade: 'A',
          improvement_recommendations: [
            'Maintain excellent performance standards',
            'Share best practices with other trades'
          ]
        },
        {
          trade: 'Flooring',
          totalBlockers: 7,
          averageResolutionTime: 9.5,
          resolutionRate: 71.4,
          averageCostImpact: 2200,
          projectsWorkedOn: 3,
          topCategories: [
            { category: 'surface_prep', count: 3 },
            { category: 'material_delay', count: 2 },
            { category: 'moisture_issues', count: 2 }
          ],
          performance_grade: 'D',
          improvement_recommendations: [
            'Improve surface preparation coordination',
            'Address moisture control issues systematically'
          ]
        }
      ];
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