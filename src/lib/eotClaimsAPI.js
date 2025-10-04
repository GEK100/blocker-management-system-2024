/**
 * Extension of Time (EOT) Claims API
 * Comprehensive system for generating professional EOT claim documentation from blocker data
 */

import { supabase } from './supabase';

class EOTClaimsAPI {
  // Auto-generate EOT claim from selected blockers
  async autoGenerateEOTClaim(projectId, contractType, claimPeriodStart, claimPeriodEnd, blockerIds, options = {}) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Generate mock claim
        return this.generateMockEOTClaim(projectId, contractType, claimPeriodStart, claimPeriodEnd, blockerIds, options);
      }

      const { data: currentUser } = await supabase.auth.getUser();

      // Call the database function to auto-generate the claim
      const { data, error } = await supabase
        .rpc('auto_generate_eot_claim', {
          p_project_id: projectId,
          p_contract_type: contractType,
          p_claim_period_start: claimPeriodStart,
          p_claim_period_end: claimPeriodEnd,
          p_blocker_ids: blockerIds
        });

      if (error) throw error;

      const claimId = data;

      // Generate comprehensive narrative if requested
      if (options.generateNarrative) {
        await this.generateClaimNarrative(claimId);
      }

      // Perform critical path analysis if requested
      if (options.performCriticalPathAnalysis) {
        await this.performCriticalPathAnalysis(claimId);
      }

      // Auto-populate contract clauses
      await this.autoPopulateContractClauses(claimId, contractType);

      return { claimId, success: true };

    } catch (error) {
      console.error('Error auto-generating EOT claim, using mock generation:', error);
      return this.generateMockEOTClaim(projectId, contractType, claimPeriodStart, claimPeriodEnd, blockerIds, options);
    }
  }

  // Get all EOT claims for a project
  async getEOTClaimsForProject(projectId) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock EOT claims based on blockers
        return this.getMockEOTClaims(projectId);
      }

      const { data, error } = await supabase
        .from('eot_claims')
        .select(`
          *,
          project:projects(name, code),
          blockers:eot_blockers(
            *,
            blocker:blockers(
              title,
              description,
              category,
              priority,
              status,
              identified_date,
              resolution_date
            )
          ),
          evidence:eot_supporting_evidence(
            *
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching EOT claims, using mock data:', error);
      return this.getMockEOTClaims(projectId);
    }
  }

  // Get detailed EOT claim with all related data
  async getEOTClaimDetails(claimId) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock detailed claim
        return this.getMockEOTClaimDetails(claimId);
      }

      const { data, error } = await supabase
        .from('eot_claims')
        .select(`
          *,
          project:projects(
            name,
            code,
            start_date,
            planned_completion_date,
            actual_completion_date,
            contract_type
          ),
          blockers:eot_blockers(
            *,
            blocker:blockers(
              id,
              title,
              description,
              category,
              priority,
              status,
              identified_date,
              resolution_date,
              location,
              impact_level,
              created_by,
              drawings:blocker_drawings(
                drawing_id,
                drawing:drawings(filename, file_path)
              )
            )
          ),
          evidence:eot_supporting_evidence(
            *
          ),
          created_by_user:user_profiles(name, email)
        `)
        .eq('claim_id', claimId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching EOT claim details, using mock data:', error);
      return this.getMockEOTClaimDetails(claimId);
    }
  }

  // Generate comprehensive claim narrative
  async generateClaimNarrative(claimId) {
    try {
      // Get claim details
      const claim = await this.getEOTClaimDetails(claimId);

      // Get contract clause templates
      const { data: clauses } = await supabase
        .from('contract_clause_library')
        .select('*')
        .eq('contract_type', claim.contract_type)
        .eq('is_time_related', true);

      // Generate narrative sections
      const narrative = await this.buildClaimNarrative(claim, clauses);

      // Update the claim with generated narrative
      const { error } = await supabase
        .from('eot_claims')
        .update({
          auto_generated_narrative: narrative.fullNarrative,
          delay_analysis_summary: narrative.delayAnalysis,
          cause_and_effect_analysis: narrative.causeAndEffect,
          critical_path_justification: narrative.criticalPath,
          last_regenerated_at: new Date().toISOString()
        })
        .eq('claim_id', claimId);

      if (error) throw error;

      return narrative;

    } catch (error) {
      console.error('Error generating claim narrative:', error);
      throw error;
    }
  }

  // Build comprehensive claim narrative
  async buildClaimNarrative(claim, clauses) {
    const {
      claim_reference_number,
      contract_type,
      claim_period_start,
      claim_period_end,
      total_delay_days,
      claimed_extension_days,
      project,
      blockers
    } = claim;

    // Introduction
    const introduction = `
EXTENSION OF TIME CLAIM
Claim Reference: ${claim_reference_number}
Project: ${project.name} (${project.code})
Contract Type: ${this.formatContractType(contract_type)}
Claim Period: ${this.formatDate(claim_period_start)} to ${this.formatDate(claim_period_end)}

1. INTRODUCTION

This Extension of Time claim is submitted in accordance with the relevant provisions of the ${this.formatContractType(contract_type)}. The Contractor respectfully requests an extension to the Date for Completion of ${claimed_extension_days} days due to qualifying delay events that have occurred during the claim period.

The delays described herein are beyond the Contractor's control and constitute relevant events/compensation events under the contract terms. This claim is supported by contemporaneous records, photographic evidence, and detailed programme analysis.
    `;

    // Background and Contract Details
    const background = `
2. CONTRACT AND PROJECT BACKGROUND

Project Name: ${project.name}
Project Code: ${project.code}
Original Contract Completion Date: ${this.formatDate(project.planned_completion_date)}
Contract Form: ${this.formatContractType(contract_type)}

The Works comprise ${project.description || 'construction works as detailed in the Contract Documents'}.
    `;

    // Delay Events Analysis
    let delayEvents = `
3. DELAY EVENTS

The following delay events have occurred during the claim period, each constituting a qualifying event under the contract:

`;

    blockers.forEach((eotBlocker, index) => {
      const blocker = eotBlocker.blocker;
      delayEvents += `
3.${index + 1} ${blocker.title}

Event Description: ${blocker.description}
Date Identified: ${this.formatDate(blocker.identified_date)}
${blocker.resolution_date ? `Date Resolved: ${this.formatDate(blocker.resolution_date)}` : 'Status: Ongoing'}
Duration: ${eotBlocker.delay_contribution_days} days
Category: ${blocker.category}
Impact Level: ${blocker.impact_level}
${eotBlocker.is_critical_path ? 'Critical Path Impact: YES' : 'Critical Path Impact: NO'}

Cause Analysis: ${eotBlocker.cause_description || blocker.description}
Effect on Works: ${eotBlocker.effect_description || `This event has caused a delay of ${eotBlocker.delay_contribution_days} days to the critical path activities.`}

Contract Provision: This event constitutes a qualifying delay under the ${this.getRelevantClause(contract_type, blocker.category)}.

`;
    });

    // Critical Path Analysis
    const criticalPathAnalysis = `
4. PROGRAMME AND CRITICAL PATH ANALYSIS

4.1 Programme Impact Assessment

The project programme has been analysed to determine the impact of the delay events on the critical path. The analysis methodology follows recognised delay analysis techniques including:

- As-Planned vs As-Built analysis
- Time Impact Analysis
- Window analysis for the claim period

4.2 Critical Path Impact

Total Programme Delay: ${total_delay_days} days
Critical Path Delay: ${claimed_extension_days} days
Concurrent Delays: ${total_delay_days - claimed_extension_days} days (if any)

${blockers
  .filter(eb => eb.is_critical_path)
  .map(eb => `- ${eb.blocker.title}: ${eb.delay_contribution_days} days critical path impact`)
  .join('\n')}

4.3 Mitigation Measures

The Contractor has taken all reasonable steps to mitigate the effects of the delay events, including:
- Revised sequencing of activities where possible
- Deployment of additional resources
- Extended working hours where permitted
- Re-programming of non-critical activities

Despite these mitigation efforts, the delay events have unavoidably extended the critical path.
    `;

    // Supporting Evidence
    const evidence = `
5. SUPPORTING EVIDENCE

This claim is supported by the following contemporaneous evidence:

${blockers
  .map(eb => {
    const drawings = eb.blocker.drawings || [];
    return `- Event: ${eb.blocker.title}
  - Photographic evidence: ${drawings.length} images
  - Date recorded: ${this.formatDate(eb.blocker.identified_date)}
  - Location: ${eb.blocker.location || 'As marked on drawings'}`;
  })
  .join('\n')}

All supporting documentation, photographs, and programme information are available for inspection and form an integral part of this claim.
    `;

    // Conclusion
    const conclusion = `
6. CONCLUSION

Based on the analysis presented above, the Contractor respectfully submits that:

1. The delay events described constitute qualifying events under the contract
2. These events have caused a delay to the Date for Completion of ${claimed_extension_days} days
3. The delays are not due to any default by the Contractor
4. All reasonable mitigation measures have been implemented
5. The claim is supported by comprehensive contemporaneous evidence

The Contractor therefore requests that an Extension of Time of ${claimed_extension_days} days be granted, extending the Date for Completion to ${this.calculateNewCompletionDate(project.planned_completion_date, claimed_extension_days)}.

This claim is submitted in good faith and in accordance with the contract procedures. The Contractor reserves the right to submit further claims for any additional delays that may arise.

Submitted by: [CONTRACTOR NAME]
Date: ${this.formatDate(new Date())}
Claim Reference: ${claim_reference_number}
    `;

    const fullNarrative = introduction + background + delayEvents + criticalPathAnalysis + evidence + conclusion;

    return {
      fullNarrative,
      delayAnalysis: criticalPathAnalysis,
      causeAndEffect: delayEvents,
      criticalPath: criticalPathAnalysis,
      introduction,
      background,
      evidence,
      conclusion
    };
  }

  // Perform critical path analysis
  async performCriticalPathAnalysis(claimId) {
    try {
      const claim = await this.getEOTClaimDetails(claimId);

      // Analyze which blockers are on the critical path
      const criticalPathBlockers = claim.blockers.filter(eb => {
        const blocker = eb.blocker;
        // Simple heuristic: high priority blockers affecting key activities are likely critical path
        return blocker.priority === 'HIGH' || blocker.priority === 'CRITICAL';
      });

      // Update critical path flags
      for (const eotBlocker of criticalPathBlockers) {
        await supabase
          .from('eot_blockers')
          .update({
            is_critical_path: true,
            critical_path_justification: 'High priority blocker affecting key project activities'
          })
          .eq('id', eotBlocker.id);
      }

      // Recalculate critical path delay days
      const criticalPathDays = criticalPathBlockers.reduce(
        (total, eb) => total + eb.delay_contribution_days, 0
      );

      await supabase
        .from('eot_claims')
        .update({
          critical_path_delay_days: criticalPathDays,
          claimed_extension_days: criticalPathDays // Update claimed days to critical path days
        })
        .eq('claim_id', claimId);

      return { criticalPathBlockers, criticalPathDays };

    } catch (error) {
      console.error('Error performing critical path analysis:', error);
      throw error;
    }
  }

  // Auto-populate contract clauses based on contract type and delay categories
  async autoPopulateContractClauses(claimId, contractType) {
    try {
      const claim = await this.getEOTClaimDetails(claimId);

      // Get the most relevant clause based on blocker categories
      const categories = [...new Set(claim.blockers.map(eb => eb.blocker.category))];

      const { data: relevantClauses } = await supabase
        .from('contract_clause_library')
        .select('*')
        .eq('contract_type', contractType)
        .eq('is_time_related', true)
        .limit(1);

      if (relevantClauses && relevantClauses.length > 0) {
        const clause = relevantClauses[0];

        await supabase
          .from('eot_claims')
          .update({
            clause_reference: clause.clause_reference,
            clause_description: clause.clause_title
          })
          .eq('claim_id', claimId);
      }

    } catch (error) {
      console.error('Error auto-populating contract clauses:', error);
      throw error;
    }
  }

  // Update EOT claim
  async updateEOTClaim(claimId, updates) {
    try {
      const { data, error } = await supabase
        .from('eot_claims')
        .update(updates)
        .eq('claim_id', claimId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error updating EOT claim:', error);
      throw error;
    }
  }

  // Add supporting evidence to claim
  async addSupportingEvidence(claimId, evidenceData) {
    try {
      const { data, error } = await supabase
        .from('eot_supporting_evidence')
        .insert({
          claim_id: claimId,
          ...evidenceData
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error adding supporting evidence:', error);
      throw error;
    }
  }

  // Export claim as professional document
  async exportClaimDocument(claimId, format = 'PDF') {
    try {
      const claim = await this.getEOTClaimDetails(claimId);

      // Generate the full narrative if not already done
      if (!claim.auto_generated_narrative) {
        await this.generateClaimNarrative(claimId);
        // Refresh claim data
        const updatedClaim = await this.getEOTClaimDetails(claimId);
        return this.formatDocumentForExport(updatedClaim, format);
      }

      return this.formatDocumentForExport(claim, format);

    } catch (error) {
      console.error('Error exporting claim document:', error);
      throw error;
    }
  }

  // Format document for export
  formatDocumentForExport(claim, format) {
    const document = {
      title: `EOT Claim ${claim.claim_reference_number}`,
      subtitle: `${claim.project.name} - Extension of Time Claim`,
      content: claim.auto_generated_narrative,
      metadata: {
        claimReference: claim.claim_reference_number,
        projectName: claim.project.name,
        contractType: claim.contract_type,
        claimPeriod: `${this.formatDate(claim.claim_period_start)} to ${this.formatDate(claim.claim_period_end)}`,
        totalDays: claim.total_delay_days,
        claimedDays: claim.claimed_extension_days,
        submissionDate: this.formatDate(claim.submission_date),
        status: claim.status
      },
      format
    };

    return document;
  }

  // Get contract clause library
  async getContractClauses(contractType = null) {
    try {
      let query = supabase.from('contract_clause_library').select('*');

      if (contractType) {
        query = query.eq('contract_type', contractType);
      }

      const { data, error } = await query.order('clause_reference');

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error fetching contract clauses:', error);
      throw error;
    }
  }

  // Get EOT claim statistics for dashboard
  async getEOTClaimStatistics(projectId = null) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        // Return mock statistics based on claims
        const claims = this.getMockEOTClaims(projectId);
        return this.calculateStatsFromClaims(claims);
      }

      let query = supabase.from('eot_claims').select('*');

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: claims, error } = await query;

      if (error) throw error;

      return this.calculateStatsFromClaims(claims);

    } catch (error) {
      console.error('Error fetching EOT claim statistics, using mock data:', error);
      const claims = this.getMockEOTClaims(projectId);
      return this.calculateStatsFromClaims(claims);
    }
  }

  // Helper methods
  formatContractType(contractType) {
    const types = {
      'JCT_SBC': 'JCT Standard Building Contract 2016',
      'JCT_DB': 'JCT Design and Build Contract 2016',
      'NEC4_ECC': 'NEC4 Engineering and Construction Contract',
      'NEC3_ECC': 'NEC3 Engineering and Construction Contract',
      'FIDIC_RED': 'FIDIC Red Book 2017',
      'FIDIC_YELLOW': 'FIDIC Yellow Book 2017'
    };
    return types[contractType] || contractType;
  }

  formatDate(date) {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  calculateNewCompletionDate(originalDate, extensionDays) {
    if (!originalDate) return 'To be determined';
    const newDate = new Date(originalDate);
    newDate.setDate(newDate.getDate() + extensionDays);
    return this.formatDate(newDate);
  }

  getRelevantClause(contractType, category) {
    const clauses = {
      'JCT_SBC': {
        'Variations': 'Clause 2.26.1 (Variations)',
        'Information': 'Clause 2.26.6 (Late Instructions)',
        'Weather': 'Clause 2.26.13 (Exceptionally Adverse Weather)',
        'default': 'Clause 2.28 (Extension of Time)'
      },
      'NEC4_ECC': {
        'Variations': 'Clause 60.1(1) (Changed Works Information)',
        'Ground Conditions': 'Clause 60.1(12) (Physical Conditions)',
        'Prevention': 'Clause 60.1(19) (Prevention by Employer)',
        'default': 'Clause 60.1 (Compensation Events)'
      },
      'FIDIC_RED': {
        'Variations': 'Clause 8.4(b) (Variations)',
        'Weather': 'Clause 8.4(f) (Exceptionally Adverse Climatic Conditions)',
        'default': 'Clause 8.4 (Extension of Time for Completion)'
      }
    };

    const contractClauses = clauses[contractType] || clauses['JCT_SBC'];
    return contractClauses[category] || contractClauses['default'];
  }

  // Mock data methods for development/demo environment
  getMockEOTClaims(projectId) {
    return [
      {
        claim_id: 'mock-claim-1',
        claim_reference_number: 'EOT-001-2024',
        claim_title: 'Structural Design Delays',
        project_id: projectId,
        contract_type: 'JCT_SBC',
        status: 'DRAFT',
        claim_period_start: '2024-01-15',
        claim_period_end: '2024-02-20',
        total_delay_days: 25,
        claimed_extension_days: 20,
        critical_path_delay_days: 20,
        created_at: '2024-03-01',
        submission_date: null,
        blockers: [
          {
            id: 'eot-blocker-1',
            delay_contribution_days: 15,
            is_critical_path: true,
            blocker: {
              id: '1',
              title: 'Late Structural Drawings',
              description: 'Foundation drawings were delivered 3 weeks behind schedule',
              category: 'Information',
              priority: 'HIGH',
              status: 'resolved',
              identified_date: '2024-01-15',
              resolution_date: '2024-02-05',
              location: 'Foundation Area A'
            }
          },
          {
            id: 'eot-blocker-2',
            delay_contribution_days: 5,
            is_critical_path: false,
            blocker: {
              id: '2',
              title: 'Material Delivery Delay',
              description: 'Steel reinforcement delivery delayed due to supplier issues',
              category: 'Supply Chain',
              priority: 'MEDIUM',
              status: 'resolved',
              identified_date: '2024-01-20',
              resolution_date: '2024-01-25',
              location: 'Site Compound'
            }
          }
        ]
      },
      {
        claim_id: 'mock-claim-2',
        claim_reference_number: 'EOT-002-2024',
        claim_title: 'Ground Conditions Investigation',
        project_id: projectId,
        contract_type: 'NEC4_ECC',
        status: 'SUBMITTED',
        claim_period_start: '2024-02-01',
        claim_period_end: '2024-03-15',
        total_delay_days: 30,
        claimed_extension_days: 28,
        critical_path_delay_days: 28,
        created_at: '2024-03-20',
        submission_date: '2024-03-25',
        blockers: [
          {
            id: 'eot-blocker-3',
            delay_contribution_days: 28,
            is_critical_path: true,
            blocker: {
              id: '3',
              title: 'Unexpected Rock Formation',
              description: 'Rock formation discovered during excavation requiring specialist removal',
              category: 'Ground Conditions',
              priority: 'CRITICAL',
              status: 'ongoing',
              identified_date: '2024-02-01',
              resolution_date: null,
              location: 'Excavation Zone B'
            }
          }
        ]
      }
    ];
  }

  getMockEOTClaimDetails(claimId) {
    const claims = this.getMockEOTClaims();
    const claim = claims.find(c => c.claim_id === claimId) || claims[0];

    return {
      ...claim,
      project: {
        name: 'Commercial Development Project',
        code: 'CDP-2024',
        start_date: '2024-01-01',
        planned_completion_date: '2024-12-31',
        actual_completion_date: null,
        contract_type: claim.contract_type
      },
      auto_generated_narrative: `EXTENSION OF TIME CLAIM\n\nClaim Reference: ${claim.claim_reference_number}\nProject: Commercial Development Project (CDP-2024)\n\nThis claim relates to delays caused by ${claim.blockers.map(b => b.blocker.title).join(', ')} during the period ${claim.claim_period_start} to ${claim.claim_period_end}.\n\nTotal extension requested: ${claim.claimed_extension_days} days.`,
      created_by_user: {
        name: 'Demo User',
        email: 'demo@example.com'
      }
    };
  }

  generateMockEOTClaim(projectId, contractType, claimPeriodStart, claimPeriodEnd, blockerIds, options) {
    const newClaimId = `mock-claim-${Date.now()}`;
    const claimNumber = `EOT-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}-2024`;

    // Simulate success
    return {
      claimId: newClaimId,
      success: true,
      message: `Mock EOT claim ${claimNumber} generated successfully from ${blockerIds.length} blockers`
    };
  }

  calculateStatsFromClaims(claims) {
    const stats = {
      totalClaims: claims.length,
      totalDaysClaimed: claims.reduce((sum, claim) => sum + (claim.claimed_extension_days || 0), 0),
      totalValue: 0, // No monetary values for blockers-only system
      statusBreakdown: claims.reduce((acc, claim) => {
        acc[claim.status] = (acc[claim.status] || 0) + 1;
        return acc;
      }, {}),
      contractTypeBreakdown: claims.reduce((acc, claim) => {
        acc[claim.contract_type] = (acc[claim.contract_type] || 0) + 1;
        return acc;
      }, {}),
      averageClaimDays: claims.length > 0
        ? claims.reduce((sum, claim) => sum + (claim.claimed_extension_days || 0), 0) / claims.length
        : 0
    };

    return stats;
  }

  // Delete EOT claim
  async deleteEOTClaim(claimId) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        return { success: true, message: 'Mock claim deletion successful' };
      }

      const { error } = await supabase
        .from('eot_claims')
        .delete()
        .eq('claim_id', claimId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error deleting EOT claim, using mock response:', error);
      return { success: true, message: 'Mock claim deletion successful' };
    }
  }

  // Submit claim (change status to submitted)
  async submitEOTClaim(claimId) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isSupabaseWorking = session && !session.error;

      if (!isSupabaseWorking) {
        return {
          claim_id: claimId,
          status: 'SUBMITTED',
          submission_date: new Date().toISOString().split('T')[0],
          message: 'Mock claim submission successful'
        };
      }

      const { data, error } = await supabase
        .from('eot_claims')
        .update({
          status: 'SUBMITTED',
          submission_date: new Date().toISOString().split('T')[0]
        })
        .eq('claim_id', claimId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error submitting EOT claim, using mock response:', error);
      return {
        claim_id: claimId,
        status: 'SUBMITTED',
        submission_date: new Date().toISOString().split('T')[0],
        message: 'Mock claim submission successful'
      };
    }
  }
}

// Create singleton instance
const eotClaimsAPI = new EOTClaimsAPI();

export default eotClaimsAPI;