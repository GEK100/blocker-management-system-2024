import { supabase } from './supabase';

class DisputePreventionAPI {
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
          total_active_risks: 12,
          critical_risks: 3,
          high_risks: 5,
          medium_risks: 4,
          low_risks: 0,
          risk_trend_direction: 'improving',
          urgent_deadlines: 2,
          missed_deadlines: 1,
          total_deadlines: 18,
          unacknowledged_warnings: 4,
          recent_warnings: 7,
          total_warnings: 23,
          legal_ready_packages: 8,
          total_evidence_packages: 12,
          negative_communications: 3,
          total_communications: 45,
          average_sentiment_score: 0.2,
          dispute_prevention_score: 78.5,
          cost_at_risk: 285000,
          prevention_savings: 120000
        };
      }

      const { data, error } = await this.supabase
        .from('dispute_prevention_dashboard')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      // Return mock data as fallback
      return {
        total_active_risks: 12,
        critical_risks: 3,
        high_risks: 5,
        medium_risks: 4,
        low_risks: 0,
        risk_trend_direction: 'improving',
        urgent_deadlines: 2,
        missed_deadlines: 1,
        total_deadlines: 18,
        unacknowledged_warnings: 4,
        recent_warnings: 7,
        total_warnings: 23,
        legal_ready_packages: 8,
        total_evidence_packages: 12,
        negative_communications: 3,
        total_communications: 45,
        average_sentiment_score: 0.2,
        dispute_prevention_score: 78.5,
        cost_at_risk: 285000,
        prevention_savings: 120000
      };
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock dispute risks data
        const mockData = [
          {
            risk_id: 'risk-1',
            project_id: 'project-1',
            dispute_type: 'quality',
            risk_level: 'critical',
            risk_score: 92,
            escalation_stage: 'formal_notice',
            status: 'active',
            estimated_delay_days: 45,
            created_date: '2024-01-15T10:00:00Z',
            last_updated: '2024-01-20T14:30:00Z',
            risk_factors: [
              'Multiple quality failures requiring rework',
              'Workmanship not meeting specification',
              'Repeated defects in electrical installations'
            ],
            mitigation_actions: [
              'Schedule immediate quality review meeting',
              'Implement enhanced quality control measures',
              'Arrange additional training for subcontractor team'
            ],
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress',
              planned_completion: '2024-12-31'
            },
            subcontractor: {
              company_name: 'Elite Electrical Services',
              trade_type: 'electrical'
            }
          },
          {
            risk_id: 'risk-2',
            project_id: 'project-2',
            dispute_type: 'delay',
            risk_level: 'critical',
            risk_score: 88,
            escalation_stage: 'early_warning',
            status: 'active',
            estimated_value: 95000,
            created_date: '2024-01-12T09:15:00Z',
            last_updated: '2024-01-18T16:45:00Z',
            risk_factors: [
              'Project delayed by 3 weeks due to design changes',
              'Subcontractor claiming additional compensation',
              'Critical path activities affected'
            ],
            mitigation_actions: [
              'Conduct delay impact analysis',
              'Review change order procedures',
              'Negotiate schedule recovery plan'
            ],
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress',
              budget: 5200000
            },
            subcontractor: {
              company_name: 'Precision HVAC Solutions',
              trade_type: 'hvac'
            }
          },
          {
            risk_id: 'risk-3',
            project_id: 'project-1',
            dispute_type: 'quality',
            risk_level: 'critical',
            risk_score: 85,
            escalation_stage: 'early_warning',
            status: 'active',
            estimated_value: 78000,
            created_date: '2024-01-10T11:20:00Z',
            last_updated: '2024-01-19T13:15:00Z',
            risk_factors: [
              'Work rejected due to quality standards',
              'Multiple rework requests issued',
              'Subcontractor disputing quality requirements'
            ],
            mitigation_actions: [
              'Schedule quality inspection meeting',
              'Review specification requirements',
              'Implement enhanced quality control procedures'
            ],
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress',
              planned_completion: '2024-12-31'
            },
            subcontractor: {
              company_name: 'Premium Plumbing Co.',
              trade_type: 'plumbing'
            }
          },
          {
            risk_id: 'risk-4',
            project_id: 'project-3',
            dispute_type: 'scope',
            risk_level: 'high',
            risk_score: 72,
            escalation_stage: 'discussion',
            status: 'monitoring',
            estimated_value: 52000,
            created_date: '2024-01-08T14:30:00Z',
            last_updated: '2024-01-17T10:20:00Z',
            risk_factors: [
              'Scope interpretation differences',
              'Additional work requests disputed',
              'Contract language ambiguity'
            ],
            mitigation_actions: [
              'Clarify scope documentation',
              'Schedule scope alignment meeting',
              'Review contract terms with legal team'
            ],
            project: {
              name: 'Retail Center Beta',
              status: 'in_progress',
              budget: 4400000
            },
            subcontractor: {
              company_name: 'Modern Drywall Systems',
              trade_type: 'drywall'
            }
          },
          {
            risk_id: 'risk-5',
            project_id: 'project-2',
            dispute_type: 'payment',
            risk_level: 'high',
            risk_score: 68,
            escalation_stage: 'discussion',
            status: 'monitoring',
            estimated_value: 43000,
            created_date: '2024-01-05T08:45:00Z',
            last_updated: '2024-01-16T15:30:00Z',
            risk_factors: [
              'Payment milestone disagreement',
              'Work completion percentage disputed',
              'Change order payment delays'
            ],
            mitigation_actions: [
              'Review milestone completion criteria',
              'Conduct joint progress assessment',
              'Expedite change order approvals'
            ],
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress',
              budget: 5200000
            },
            subcontractor: {
              company_name: 'Advanced Steel Fabricators',
              trade_type: 'structural'
            }
          }
        ];

        // Apply filters to mock data
        let filteredData = [...mockData];

        if (filters.riskLevel) {
          filteredData = filteredData.filter(risk => risk.risk_level === filters.riskLevel);
        }
        if (filters.disputeType) {
          filteredData = filteredData.filter(risk => risk.dispute_type === filters.disputeType);
        }
        if (filters.escalationStage) {
          filteredData = filteredData.filter(risk => risk.escalation_stage === filters.escalationStage);
        }
        if (filters.status) {
          filteredData = filteredData.filter(risk => risk.status === filters.status);
        }
        if (filters.projectId) {
          filteredData = filteredData.filter(risk => risk.project_id === filters.projectId);
        }

        return filteredData;
      }

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
      // Return mock data as fallback
      return [
        {
          risk_id: 'risk-1',
          project_id: 'project-1',
          dispute_type: 'payment',
          risk_level: 'critical',
          risk_score: 92,
          escalation_stage: 'formal_notice',
          status: 'active',
          estimated_value: 125000,
          created_date: '2024-01-15T10:00:00Z',
          last_updated: '2024-01-20T14:30:00Z',
          risk_factors: [
            'Invoice payment overdue by 45 days',
            'Multiple payment disputes in past',
            'Subcontractor threatening legal action'
          ],
          mitigation_actions: [
            'Schedule immediate payment negotiation meeting',
            'Review contract payment terms',
            'Engage legal counsel for dispute resolution'
          ],
          project: {
            name: 'Office Complex Alpha',
            status: 'in_progress',
            planned_completion: '2024-12-31'
          },
          subcontractor: {
            company_name: 'Elite Electrical Services',
            trade_type: 'electrical'
          }
        },
        {
          risk_id: 'risk-2',
          project_id: 'project-2',
          dispute_type: 'delay',
          risk_level: 'critical',
          risk_score: 88,
          escalation_stage: 'early_warning',
          status: 'active',
          estimated_value: 95000,
          created_date: '2024-01-12T09:15:00Z',
          last_updated: '2024-01-18T16:45:00Z',
          risk_factors: [
            'Project delayed by 3 weeks due to design changes',
            'Subcontractor claiming additional compensation',
            'Critical path activities affected'
          ],
          mitigation_actions: [
            'Conduct delay impact analysis',
            'Review change order procedures',
            'Negotiate schedule recovery plan'
          ],
          project: {
            name: 'Hospital Wing Delta',
            status: 'in_progress',
            budget: 5200000
          },
          subcontractor: {
            company_name: 'Precision HVAC Solutions',
            trade_type: 'hvac'
          }
        }
      ];
    }
  }

  // Get contractual deadlines
  async getContractualDeadlines(companyId, filters = {}) {
    try {
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock contractual deadlines data
        const mockData = [
          {
            deadline_id: 'deadline-1',
            project_id: 'project-1',
            deadline_type: 'payment_certification',
            title: 'Monthly Payment Application #3',
            description: 'Submit and process payment application for January work completed',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            status: 'pending',
            criticality: 'high',
            responsible_party: 'Project Manager',
            consequences_of_miss: 'Payment delays, potential cash flow issues for subcontractor',
            created_date: '2024-01-10T09:00:00Z',
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'payment',
              risk_level: 'critical'
            }
          },
          {
            deadline_id: 'deadline-2',
            project_id: 'project-2',
            deadline_type: 'notice_requirement',
            title: 'Change Order Notification Deadline',
            description: 'Provide formal notice of design changes affecting HVAC scope',
            due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
            status: 'pending',
            criticality: 'critical',
            responsible_party: 'Design Team',
            consequences_of_miss: 'Loss of right to claim additional time and costs',
            created_date: '2024-01-12T11:30:00Z',
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'delay',
              risk_level: 'critical'
            }
          },
          {
            deadline_id: 'deadline-3',
            project_id: 'project-1',
            deadline_type: 'completion_milestone',
            title: 'Electrical Rough-in Completion',
            description: 'Complete electrical rough-in work for floors 1-3',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            status: 'pending',
            criticality: 'medium',
            responsible_party: 'Elite Electrical Services',
            consequences_of_miss: 'Schedule delays, potential liquidated damages',
            created_date: '2024-01-08T14:15:00Z',
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: null
          },
          {
            deadline_id: 'deadline-4',
            project_id: 'project-3',
            deadline_type: 'compliance_filing',
            title: 'Building Permit Renewal',
            description: 'Submit application for building permit extension',
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
            status: 'pending',
            criticality: 'high',
            responsible_party: 'Permit Expediter',
            consequences_of_miss: 'Work stoppage, regulatory penalties',
            created_date: '2024-01-05T16:45:00Z',
            project: {
              name: 'Retail Center Beta',
              status: 'in_progress'
            },
            dispute_risk: null
          },
          {
            deadline_id: 'deadline-5',
            project_id: 'project-2',
            deadline_type: 'inspection_request',
            title: 'Fire Safety System Inspection',
            description: 'Schedule and complete fire safety system inspection',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            status: 'pending',
            criticality: 'medium',
            responsible_party: 'Fire Safety Contractor',
            consequences_of_miss: 'Delayed occupancy, additional inspection fees',
            created_date: '2024-01-09T12:20:00Z',
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress'
            },
            dispute_risk: null
          },
          {
            deadline_id: 'deadline-6',
            project_id: 'project-1',
            deadline_type: 'payment_certification',
            title: 'Final Payment Release',
            description: 'Process final payment to plumbing contractor',
            due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (missed)
            status: 'missed',
            criticality: 'high',
            responsible_party: 'Accounts Payable',
            consequences_of_miss: 'Interest charges, damaged relationship, potential legal action',
            created_date: '2024-01-01T10:00:00Z',
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'payment',
              risk_level: 'critical'
            }
          }
        ];

        // Apply filters to mock data
        let filteredData = [...mockData];

        if (filters.status) {
          filteredData = filteredData.filter(deadline => deadline.status === filters.status);
        }
        if (filters.deadlineType) {
          filteredData = filteredData.filter(deadline => deadline.deadline_type === filters.deadlineType);
        }
        if (filters.urgent) {
          const urgentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(deadline => new Date(deadline.due_date) <= urgentDate);
        }
        if (filters.projectId) {
          filteredData = filteredData.filter(deadline => deadline.project_id === filters.projectId);
        }

        return filteredData;
      }

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
      // Return mock data as fallback
      return [
        {
          deadline_id: 'deadline-1',
          project_id: 'project-1',
          deadline_type: 'payment_certification',
          title: 'Monthly Payment Application #3',
          description: 'Submit and process payment application for January work completed',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          criticality: 'high',
          responsible_party: 'Project Manager',
          consequences_of_miss: 'Payment delays, potential cash flow issues for subcontractor',
          created_date: '2024-01-10T09:00:00Z',
          project: {
            name: 'Office Complex Alpha',
            status: 'in_progress'
          },
          dispute_risk: {
            dispute_type: 'payment',
            risk_level: 'critical'
          }
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock early warnings data
        const mockData = [
          {
            warning_id: 'warning-1',
            project_id: 'project-1',
            warning_type: 'payment_delay_pattern',
            title: 'Payment Processing Delays Detected',
            description: 'Pattern of delayed payments to Elite Electrical Services may trigger dispute',
            severity: 5,
            detection_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            trigger_criteria: [
              'Payment overdue by 30+ days',
              'Multiple follow-up requests received',
              'Subcontractor expressing frustration'
            ],
            potential_impact: 'High risk of payment dispute, possible work stoppage',
            recommended_actions: [
              'Expedite payment processing immediately',
              'Schedule face-to-face meeting with subcontractor',
              'Review payment procedures to prevent future delays'
            ],
            acknowledged_by: null,
            acknowledged_date: null,
            action_taken: null,
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'payment',
              risk_level: 'critical'
            }
          },
          {
            warning_id: 'warning-2',
            project_id: 'project-2',
            warning_type: 'scope_creep_indicator',
            title: 'Unauthorized Scope Expansion Detected',
            description: 'HVAC contractor performing work beyond original scope without formal change order',
            severity: 4,
            detection_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            trigger_criteria: [
              'Work observed outside original scope',
              'No change order documentation found',
              'Contractor expecting additional compensation'
            ],
            potential_impact: 'Scope dispute likely, potential cost overruns',
            recommended_actions: [
              'Halt unauthorized work immediately',
              'Document all completed additional work',
              'Negotiate formal change order or removal of additional work'
            ],
            acknowledged_by: null,
            acknowledged_date: null,
            action_taken: null,
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'scope',
              risk_level: 'high'
            }
          },
          {
            warning_id: 'warning-3',
            project_id: 'project-1',
            warning_type: 'quality_rejection_pattern',
            title: 'Repeated Quality Rejections',
            description: 'Plumbing work rejected for quality issues multiple times, contractor becoming defensive',
            severity: 4,
            detection_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            trigger_criteria: [
              '3+ quality rejections in past 2 weeks',
              'Contractor disputing quality standards',
              'Tension observed during quality discussions'
            ],
            potential_impact: 'Quality dispute escalation, project delays',
            recommended_actions: [
              'Schedule joint quality review meeting',
              'Clarify quality standards and expectations',
              'Consider third-party quality assessment'
            ],
            acknowledged_by: 'user-123',
            acknowledged_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            action_taken: 'Quality meeting scheduled for tomorrow',
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'quality',
              risk_level: 'critical'
            }
          },
          {
            warning_id: 'warning-4',
            project_id: 'project-3',
            warning_type: 'communication_breakdown',
            title: 'Communication Frequency Declining',
            description: 'Significant reduction in communication with drywall contractor over past 2 weeks',
            severity: 3,
            detection_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            trigger_criteria: [
              'Communications down 70% from baseline',
              'Missed last 2 coordination meetings',
              'Not responding to project updates'
            ],
            potential_impact: 'Relationship deterioration, coordination issues',
            recommended_actions: [
              'Reach out immediately to understand issues',
              'Schedule face-to-face meeting',
              'Review any recent incidents or conflicts'
            ],
            acknowledged_by: 'user-456',
            acknowledged_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            action_taken: 'Meeting arranged with contractor for next week',
            project: {
              name: 'Retail Center Beta',
              status: 'in_progress'
            },
            dispute_risk: null
          },
          {
            warning_id: 'warning-5',
            project_id: 'project-2',
            warning_type: 'schedule_pressure_indicator',
            title: 'Critical Path Activities Behind Schedule',
            description: 'Steel fabrication delays putting pressure on all subsequent trades',
            severity: 4,
            detection_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            trigger_criteria: [
              'Critical path activities 2+ weeks behind',
              'Multiple trades affected by delays',
              'Pressure mounting for schedule recovery'
            ],
            potential_impact: 'Delay claims likely, potential liquidated damages',
            recommended_actions: [
              'Conduct delay impact analysis',
              'Negotiate schedule recovery plan',
              'Document delay causes and responsibility'
            ],
            acknowledged_by: null,
            acknowledged_date: null,
            action_taken: null,
            project: {
              name: 'Hospital Wing Delta',
              status: 'in_progress'
            },
            dispute_risk: {
              dispute_type: 'delay',
              risk_level: 'critical'
            }
          },
          {
            warning_id: 'warning-6',
            project_id: 'project-1',
            warning_type: 'change_order_resistance',
            title: 'Contractor Resisting Change Orders',
            description: 'Electrical contractor pushing back on minor design changes, claiming major impact',
            severity: 3,
            detection_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            trigger_criteria: [
              'Contractor claiming excessive costs for minor changes',
              'Resistance to change order discussions',
              'Claiming changes are outside scope'
            ],
            potential_impact: 'Change order disputes, inflated costs',
            recommended_actions: [
              'Review change order procedures with contractor',
              'Get independent cost assessment for changes',
              'Clarify change order process and expectations'
            ],
            acknowledged_by: 'user-789',
            acknowledged_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            action_taken: 'Independent cost review completed, negotiations ongoing',
            project: {
              name: 'Office Complex Alpha',
              status: 'in_progress'
            },
            dispute_risk: null
          }
        ];

        // Apply filters to mock data
        let filteredData = [...mockData];

        if (filters.warningType) {
          filteredData = filteredData.filter(warning => warning.warning_type === filters.warningType);
        }
        if (filters.severity) {
          filteredData = filteredData.filter(warning => warning.severity >= filters.severity);
        }
        if (filters.acknowledged === false) {
          filteredData = filteredData.filter(warning => !warning.acknowledged_by);
        }
        if (filters.projectId) {
          filteredData = filteredData.filter(warning => warning.project_id === filters.projectId);
        }
        if (filters.recent) {
          const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(warning => new Date(warning.detection_date) >= recentDate);
        }

        return filteredData;
      }

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
      // Return mock data as fallback
      return [
        {
          warning_id: 'warning-1',
          project_id: 'project-1',
          warning_type: 'payment_delay_pattern',
          title: 'Payment Processing Delays Detected',
          description: 'Pattern of delayed payments to Elite Electrical Services may trigger dispute',
          severity: 5,
          detection_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          trigger_criteria: [
            'Payment overdue by 30+ days',
            'Multiple follow-up requests received',
            'Subcontractor expressing frustration'
          ],
          potential_impact: 'High risk of payment dispute, possible work stoppage',
          recommended_actions: [
            'Expedite payment processing immediately',
            'Schedule face-to-face meeting with subcontractor',
            'Review payment procedures to prevent future delays'
          ],
          acknowledged_by: null,
          acknowledged_date: null,
          action_taken: null,
          project: {
            name: 'Office Complex Alpha',
            status: 'in_progress'
          },
          dispute_risk: {
            dispute_type: 'payment',
            risk_level: 'critical'
          }
        }
      ];
    }
  }

  // Get evidence packages
  async getEvidencePackages(companyId, filters = {}) {
    try {
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock evidence packages data
        const mockData = [
          {
            package_id: 'package-1',
            dispute_risk_id: 'risk-1',
            evidence_type: 'payment_documentation',
            package_name: 'Payment Dispute Evidence - Elite Electrical',
            description: 'Comprehensive documentation package for payment dispute with Elite Electrical Services',
            legal_readiness_score: 92,
            completeness_percentage: 95,
            last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            created_date: '2024-01-15T10:00:00Z',
            document_list: [
              {
                document_type: 'contract',
                document_name: 'Original Subcontract Agreement',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'invoice',
                document_name: 'Outstanding Invoices #301-305',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'correspondence',
                document_name: 'Email Chain - Payment Requests',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'payment_records',
                document_name: 'Payment History & Schedules',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'change_orders',
                document_name: 'Approved Change Orders',
                status: 'partial',
                relevance: 'medium'
              }
            ],
            missing_documents: [
              'Signed delivery receipts for disputed work'
            ],
            legal_strength_assessment: 'Strong case with comprehensive documentation. Minor gaps in delivery confirmation.',
            recommended_actions: [
              'Obtain signed delivery receipts from field supervisor',
              'Organize chronological file of all communications',
              'Prepare payment timeline summary'
            ],
            dispute_risk: {
              dispute_type: 'payment',
              risk_level: 'critical',
              project: {
                name: 'Office Complex Alpha'
              }
            }
          },
          {
            package_id: 'package-2',
            dispute_risk_id: 'risk-2',
            evidence_type: 'delay_documentation',
            package_name: 'Delay Claim Defense - HVAC Schedule',
            description: 'Evidence package defending against HVAC contractor delay claims',
            legal_readiness_score: 85,
            completeness_percentage: 88,
            last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            created_date: '2024-01-12T09:15:00Z',
            document_list: [
              {
                document_type: 'schedule',
                document_name: 'Original Project Schedule',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'change_orders',
                document_name: 'Design Change Notifications',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'meeting_minutes',
                document_name: 'Weekly Progress Meeting Minutes',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'weather_reports',
                document_name: 'Weather Impact Documentation',
                status: 'partial',
                relevance: 'medium'
              },
              {
                document_type: 'daily_reports',
                document_name: 'Site Supervision Daily Reports',
                status: 'partial',
                relevance: 'high'
              }
            ],
            missing_documents: [
              'Complete weather impact analysis',
              'Third-party schedule impact assessment'
            ],
            legal_strength_assessment: 'Good defensive position. Need better documentation of weather delays and independent analysis.',
            recommended_actions: [
              'Commission independent schedule analysis',
              'Compile complete weather impact documentation',
              'Interview project team for delay causation testimony'
            ],
            dispute_risk: {
              dispute_type: 'delay',
              risk_level: 'critical',
              project: {
                name: 'Hospital Wing Delta'
              }
            }
          },
          {
            package_id: 'package-3',
            dispute_risk_id: 'risk-3',
            evidence_type: 'quality_documentation',
            package_name: 'Quality Standards Defense - Plumbing',
            description: 'Evidence supporting quality rejection decisions for plumbing work',
            legal_readiness_score: 78,
            completeness_percentage: 82,
            last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_date: '2024-01-10T11:20:00Z',
            document_list: [
              {
                document_type: 'specifications',
                document_name: 'Project Specifications - Plumbing',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'inspection_reports',
                document_name: 'Quality Inspection Reports',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'photographs',
                document_name: 'Photo Documentation of Issues',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'correspondence',
                document_name: 'Quality Issue Communications',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'standards',
                document_name: 'Industry Standard References',
                status: 'partial',
                relevance: 'medium'
              }
            ],
            missing_documents: [
              'Independent third-party quality assessment',
              'Contractor response to quality issues'
            ],
            legal_strength_assessment: 'Moderate case strength. Need independent verification and contractor responses.',
            recommended_actions: [
              'Obtain independent quality assessment',
              'Document contractor responses to quality issues',
              'Compile industry standard compliance evidence'
            ],
            dispute_risk: {
              dispute_type: 'quality',
              risk_level: 'critical',
              project: {
                name: 'Office Complex Alpha'
              }
            }
          },
          {
            package_id: 'package-4',
            dispute_risk_id: 'risk-4',
            evidence_type: 'scope_documentation',
            package_name: 'Scope Definition - Drywall Contract',
            description: 'Documentation package for scope interpretation dispute',
            legal_readiness_score: 88,
            completeness_percentage: 91,
            last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            created_date: '2024-01-08T14:30:00Z',
            document_list: [
              {
                document_type: 'contract',
                document_name: 'Subcontract Agreement - Scope Section',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'drawings',
                document_name: 'Contract Drawings & Details',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'specifications',
                document_name: 'Technical Specifications',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'correspondence',
                document_name: 'Pre-contract Scope Discussions',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'proposals',
                document_name: 'Original Contractor Proposal',
                status: 'complete',
                relevance: 'high'
              }
            ],
            missing_documents: [],
            legal_strength_assessment: 'Strong case with clear scope definition and comprehensive documentation.',
            recommended_actions: [
              'Prepare scope comparison analysis',
              'Document any verbal scope clarifications',
              'Review for any scope ambiguities'
            ],
            dispute_risk: {
              dispute_type: 'scope',
              risk_level: 'high',
              project: {
                name: 'Retail Center Beta'
              }
            }
          },
          {
            package_id: 'package-5',
            dispute_risk_id: null,
            evidence_type: 'preventive_documentation',
            package_name: 'Preventive Evidence - Steel Fabrication',
            description: 'Proactive evidence compilation for potential steel fabrication issues',
            legal_readiness_score: 65,
            completeness_percentage: 70,
            last_updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_date: '2024-01-05T08:45:00Z',
            document_list: [
              {
                document_type: 'contract',
                document_name: 'Steel Fabrication Contract',
                status: 'complete',
                relevance: 'critical'
              },
              {
                document_type: 'schedule',
                document_name: 'Steel Delivery Schedule',
                status: 'complete',
                relevance: 'high'
              },
              {
                document_type: 'correspondence',
                document_name: 'Coordination Communications',
                status: 'partial',
                relevance: 'medium'
              },
              {
                document_type: 'inspection_reports',
                document_name: 'Material Inspection Reports',
                status: 'partial',
                relevance: 'medium'
              }
            ],
            missing_documents: [
              'Complete fabrication drawings approval chain',
              'Delivery logistics documentation',
              'Quality control procedures'
            ],
            legal_strength_assessment: 'Adequate baseline documentation. Needs strengthening for potential disputes.',
            recommended_actions: [
              'Complete documentation gaps',
              'Establish regular communication records',
              'Document all delivery and quality issues promptly'
            ],
            dispute_risk: null
          }
        ];

        // Apply filters to mock data
        let filteredData = [...mockData];

        if (filters.evidenceType) {
          filteredData = filteredData.filter(pkg => pkg.evidence_type === filters.evidenceType);
        }
        if (filters.minReadinessScore) {
          filteredData = filteredData.filter(pkg => pkg.legal_readiness_score >= filters.minReadinessScore);
        }
        if (filters.disputeRiskId) {
          filteredData = filteredData.filter(pkg => pkg.dispute_risk_id === filters.disputeRiskId);
        }

        return filteredData;
      }

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
      // Return mock data as fallback
      return [
        {
          package_id: 'package-1',
          dispute_risk_id: 'risk-1',
          evidence_type: 'payment_documentation',
          package_name: 'Payment Dispute Evidence - Elite Electrical',
          description: 'Comprehensive documentation package for payment dispute with Elite Electrical Services',
          legal_readiness_score: 92,
          completeness_percentage: 95,
          last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_date: '2024-01-15T10:00:00Z',
          document_list: [
            {
              document_type: 'contract',
              document_name: 'Original Subcontract Agreement',
              status: 'complete',
              relevance: 'high'
            },
            {
              document_type: 'invoice',
              document_name: 'Outstanding Invoices #301-305',
              status: 'complete',
              relevance: 'critical'
            }
          ],
          missing_documents: [
            'Signed delivery receipts for disputed work'
          ],
          legal_strength_assessment: 'Strong case with comprehensive documentation. Minor gaps in delivery confirmation.',
          recommended_actions: [
            'Obtain signed delivery receipts from field supervisor',
            'Organize chronological file of all communications',
            'Prepare payment timeline summary'
          ],
          dispute_risk: {
            dispute_type: 'payment',
            risk_level: 'critical',
            project: {
              name: 'Office Complex Alpha'
            }
          }
        }
      ];
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
      // Check if Supabase is available
      const { data: session } = await this.supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock communication monitoring data
        const mockData = [
          {
            communication_id: 'comm-1',
            project_id: 'project-1',
            subcontractor_id: 'sub-1',
            communication_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            communication_type: 'email',
            subject: 'Outstanding Payment Invoice #305',
            content: 'We have not received payment for Invoice #305 submitted 45 days ago. This is the third follow-up request. Please expedite payment to avoid any work stoppages.',
            sender: 'contractor',
            sentiment_score: -0.6,
            urgency_level: 'high',
            escalation_indicators: [
              'payment overdue mention',
              'work stoppage threat',
              'third follow-up'
            ],
            key_phrases: [
              'outstanding payment',
              'third follow-up',
              'work stoppages'
            ],
            dispute_risk_level: 'high',
            requires_attention: true,
            project: {
              name: 'Office Complex Alpha'
            },
            subcontractor: {
              company_name: 'Elite Electrical Services'
            }
          },
          {
            communication_id: 'comm-2',
            project_id: 'project-2',
            subcontractor_id: 'sub-2',
            communication_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            communication_type: 'meeting_notes',
            subject: 'Weekly Progress Meeting - HVAC Coordination',
            content: 'Discussed schedule delays due to design changes. HVAC contractor expressed frustration with constant revisions affecting their work sequence. Requested formal change order for additional costs.',
            sender: 'internal',
            sentiment_score: -0.3,
            urgency_level: 'medium',
            escalation_indicators: [
              'schedule delays',
              'contractor frustration',
              'change order request'
            ],
            key_phrases: [
              'design changes',
              'work sequence',
              'additional costs'
            ],
            dispute_risk_level: 'medium',
            requires_attention: true,
            project: {
              name: 'Hospital Wing Delta'
            },
            subcontractor: {
              company_name: 'Precision HVAC Solutions'
            }
          },
          {
            communication_id: 'comm-3',
            project_id: 'project-1',
            subcontractor_id: 'sub-3',
            communication_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            communication_type: 'phone_call',
            subject: 'Quality Inspection Results Discussion',
            content: 'Plumbing contractor disputed quality inspection results. Claims specifications are unclear and industry standards are being applied incorrectly. Requested meeting with design team.',
            sender: 'contractor',
            sentiment_score: -0.4,
            urgency_level: 'medium',
            escalation_indicators: [
              'disputed results',
              'claims unclear specifications',
              'meeting request'
            ],
            key_phrases: [
              'quality inspection',
              'unclear specifications',
              'industry standards'
            ],
            dispute_risk_level: 'medium',
            requires_attention: true,
            project: {
              name: 'Office Complex Alpha'
            },
            subcontractor: {
              company_name: 'Premium Plumbing Co.'
            }
          },
          {
            communication_id: 'comm-4',
            project_id: 'project-3',
            subcontractor_id: 'sub-4',
            communication_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            communication_type: 'email',
            subject: 'Scope Clarification Request',
            content: 'Thank you for the project updates. We are proceeding with drywall installation as planned. Please confirm the additional work in the lobby area is included in our original scope.',
            sender: 'contractor',
            sentiment_score: 0.2,
            urgency_level: 'low',
            escalation_indicators: [],
            key_phrases: [
              'scope clarification',
              'additional work',
              'lobby area'
            ],
            dispute_risk_level: 'low',
            requires_attention: false,
            project: {
              name: 'Retail Center Beta'
            },
            subcontractor: {
              company_name: 'Modern Drywall Systems'
            }
          },
          {
            communication_id: 'comm-5',
            project_id: 'project-2',
            subcontractor_id: 'sub-5',
            communication_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            communication_type: 'email',
            subject: 'Steel Delivery Schedule Update',
            content: 'Steel fabrication is running behind schedule due to material delays. Expect 2-week delay in delivery. This will impact the critical path. Please advise on schedule adjustments.',
            sender: 'contractor',
            sentiment_score: -0.2,
            urgency_level: 'high',
            escalation_indicators: [
              'behind schedule',
              'critical path impact',
              'schedule adjustments needed'
            ],
            key_phrases: [
              'delivery schedule',
              'material delays',
              'critical path'
            ],
            dispute_risk_level: 'medium',
            requires_attention: true,
            project: {
              name: 'Hospital Wing Delta'
            },
            subcontractor: {
              company_name: 'Advanced Steel Fabricators'
            }
          },
          {
            communication_id: 'comm-6',
            project_id: 'project-1',
            subcontractor_id: 'sub-1',
            communication_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            communication_type: 'text_message',
            subject: 'Site Access Issue',
            content: 'Good morning! Quick update - we will be delayed today due to crane blocking our material access. Should resolve by noon. Thanks for coordinating with steel crew.',
            sender: 'contractor',
            sentiment_score: 0.4,
            urgency_level: 'low',
            escalation_indicators: [],
            key_phrases: [
              'site access',
              'material access',
              'crane coordination'
            ],
            dispute_risk_level: 'low',
            requires_attention: false,
            project: {
              name: 'Office Complex Alpha'
            },
            subcontractor: {
              company_name: 'Elite Electrical Services'
            }
          },
          {
            communication_id: 'comm-7',
            project_id: 'project-2',
            subcontractor_id: 'sub-2',
            communication_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
            communication_type: 'formal_letter',
            subject: 'Notice of Potential Delay Claim',
            content: 'This letter serves as formal notice that design changes issued on January 8th will result in significant delays to our HVAC installation. We reserve the right to claim additional time and costs.',
            sender: 'contractor',
            sentiment_score: -0.7,
            urgency_level: 'critical',
            escalation_indicators: [
              'formal notice',
              'delay claim',
              'reserves rights',
              'significant delays'
            ],
            key_phrases: [
              'formal notice',
              'design changes',
              'delay claim',
              'additional costs'
            ],
            dispute_risk_level: 'high',
            requires_attention: true,
            project: {
              name: 'Hospital Wing Delta'
            },
            subcontractor: {
              company_name: 'Precision HVAC Solutions'
            }
          },
          {
            communication_id: 'comm-8',
            project_id: 'project-3',
            subcontractor_id: 'sub-4',
            communication_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            communication_type: 'email',
            subject: 'Material Delivery Confirmation',
            content: 'All drywall materials have been delivered and inspected. Quality looks excellent. Ready to begin installation Monday morning. Looking forward to another successful project together.',
            sender: 'contractor',
            sentiment_score: 0.8,
            urgency_level: 'low',
            escalation_indicators: [],
            key_phrases: [
              'material delivery',
              'quality excellent',
              'successful project'
            ],
            dispute_risk_level: 'low',
            requires_attention: false,
            project: {
              name: 'Retail Center Beta'
            },
            subcontractor: {
              company_name: 'Modern Drywall Systems'
            }
          }
        ];

        // Apply filters to mock data
        let filteredData = [...mockData];

        if (filters.projectId) {
          filteredData = filteredData.filter(comm => comm.project_id === filters.projectId);
        }
        if (filters.sentimentThreshold) {
          filteredData = filteredData.filter(comm => comm.sentiment_score <= filters.sentimentThreshold);
        }
        if (filters.recent) {
          const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          filteredData = filteredData.filter(comm => new Date(comm.communication_date) >= recentDate);
        }

        return filteredData;
      }

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
      // Return mock data as fallback
      return [
        {
          communication_id: 'comm-1',
          project_id: 'project-1',
          subcontractor_id: 'sub-1',
          communication_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          communication_type: 'email',
          subject: 'Outstanding Payment Invoice #305',
          content: 'We have not received payment for Invoice #305 submitted 45 days ago. This is the third follow-up request. Please expedite payment to avoid any work stoppages.',
          sender: 'contractor',
          sentiment_score: -0.6,
          urgency_level: 'high',
          escalation_indicators: [
            'payment overdue mention',
            'work stoppage threat',
            'third follow-up'
          ],
          key_phrases: [
            'outstanding payment',
            'third follow-up',
            'work stoppages'
          ],
          dispute_risk_level: 'high',
          requires_attention: true,
          project: {
            name: 'Office Complex Alpha'
          },
          subcontractor: {
            company_name: 'Elite Electrical Services'
          }
        }
      ];
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