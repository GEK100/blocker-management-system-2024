-- Extension of Time (EOT) Claims Management Schema
-- Comprehensive system for generating professional EOT claim documentation from blocker data

-- Contract Types enum for different construction contract forms
CREATE TYPE contract_type_enum AS ENUM (
    'JCT_SBC', 'JCT_DB', 'JCT_MW', 'JCT_IC', 'JCT_MTC',
    'NEC3_ECC', 'NEC4_ECC', 'NEC3_PSC', 'NEC4_PSC',
    'FIDIC_RED', 'FIDIC_YELLOW', 'FIDIC_SILVER', 'FIDIC_GREEN',
    'BESPOKE', 'OTHER'
);

-- EOT Claim Status enum
CREATE TYPE eot_claim_status_enum AS ENUM (
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED',
    'PARTIALLY_APPROVED', 'WITHDRAWN', 'SUPERSEDED'
);

-- Evidence Types enum
CREATE TYPE evidence_type_enum AS ENUM (
    'PHOTO', 'DOCUMENT', 'DRAWING', 'CORRESPONDENCE', 'PROGRAMME',
    'WEATHER_REPORT', 'SURVEY', 'SPECIFICATION', 'VARIATION_ORDER',
    'INSTRUCTION', 'MEETING_MINUTES', 'EXPERT_REPORT', 'OTHER'
);

-- Main EOT Claims table
CREATE TABLE eot_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Claim Identification
    claim_reference_number VARCHAR(50) NOT NULL,
    claim_title VARCHAR(200) NOT NULL,
    claim_description TEXT,

    -- Contract Information
    contract_type contract_type_enum NOT NULL,
    contract_reference VARCHAR(100),
    clause_reference VARCHAR(200),
    clause_description TEXT,

    -- Time Periods
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    claim_period_start DATE NOT NULL,
    claim_period_end DATE NOT NULL,
    contract_completion_date DATE,
    revised_completion_date DATE,

    -- Delay Analysis
    total_delay_days INTEGER NOT NULL DEFAULT 0,
    claimed_extension_days INTEGER NOT NULL DEFAULT 0,
    concurrent_delay_days INTEGER DEFAULT 0,
    critical_path_delay_days INTEGER DEFAULT 0,

    -- Financial Impact
    monetary_value DECIMAL(15,2) DEFAULT 0,
    direct_costs DECIMAL(15,2) DEFAULT 0,
    indirect_costs DECIMAL(15,2) DEFAULT 0,
    loss_and_expense DECIMAL(15,2) DEFAULT 0,

    -- Generated Content
    auto_generated_narrative TEXT,
    delay_analysis_summary TEXT,
    cause_and_effect_analysis TEXT,
    critical_path_justification TEXT,

    -- Status and Metadata
    status eot_claim_status_enum DEFAULT 'DRAFT',
    is_auto_generated BOOLEAN DEFAULT TRUE,
    auto_generation_version INTEGER DEFAULT 1,
    last_regenerated_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT unique_claim_reference_per_project UNIQUE(project_id, claim_reference_number)
);

-- Linking table between EOT claims and blockers
CREATE TABLE eot_blockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eot_claim_id UUID NOT NULL REFERENCES eot_claims(claim_id) ON DELETE CASCADE,
    blocker_id UUID NOT NULL REFERENCES blockers(id) ON DELETE CASCADE,

    -- Delay Attribution
    delay_contribution_days INTEGER NOT NULL DEFAULT 0,
    delay_percentage DECIMAL(5,2), -- Percentage of total claim delay
    is_critical_path BOOLEAN DEFAULT FALSE,
    is_concurrent_delay BOOLEAN DEFAULT FALSE,

    -- Causation Analysis
    causation_category VARCHAR(100), -- e.g., 'Employer Risk', 'Contractor Risk', 'Neutral Event'
    cause_description TEXT,
    effect_description TEXT,
    mitigation_attempts TEXT,

    -- Evidence linking
    supporting_narrative TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_blocker_per_claim UNIQUE(eot_claim_id, blocker_id)
);

-- Supporting Evidence table
CREATE TABLE eot_supporting_evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES eot_claims(claim_id) ON DELETE CASCADE,
    blocker_id UUID REFERENCES blockers(id) ON DELETE SET NULL, -- Optional link to specific blocker

    -- Evidence Details
    evidence_type evidence_type_enum NOT NULL,
    evidence_title VARCHAR(200) NOT NULL,
    evidence_description TEXT,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(50),

    -- Evidence Metadata
    evidence_date DATE,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    source_reference VARCHAR(200), -- Reference to original document/source
    relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 10),

    -- Document Management
    version_number INTEGER DEFAULT 1,
    is_superseded BOOLEAN DEFAULT FALSE,
    superseded_by UUID REFERENCES eot_supporting_evidence(evidence_id),

    -- Access Control
    is_confidential BOOLEAN DEFAULT FALSE,
    access_level VARCHAR(50) DEFAULT 'PROJECT_TEAM',

    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Clause Library for auto-population
CREATE TABLE contract_clause_library (
    clause_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_type contract_type_enum NOT NULL,
    clause_reference VARCHAR(100) NOT NULL,
    clause_title VARCHAR(200) NOT NULL,
    clause_text TEXT,

    -- Categorization
    clause_category VARCHAR(100), -- e.g., 'Extension of Time', 'Variations', 'Force Majeure'
    delay_type VARCHAR(100), -- e.g., 'Employer Risk Event', 'Compensation Event'
    is_time_related BOOLEAN DEFAULT FALSE,
    is_cost_related BOOLEAN DEFAULT FALSE,

    -- Template text for claims
    standard_narrative_template TEXT,
    typical_evidence_requirements TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_clause_per_contract_type UNIQUE(contract_type, clause_reference)
);

-- Critical Path Activities for delay analysis
CREATE TABLE critical_path_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Activity Details
    activity_code VARCHAR(50) NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    activity_description TEXT,

    -- Scheduling
    planned_start_date DATE,
    planned_finish_date DATE,
    actual_start_date DATE,
    actual_finish_date DATE,
    planned_duration INTEGER, -- in days
    actual_duration INTEGER,

    -- Critical Path Analysis
    is_on_critical_path BOOLEAN DEFAULT FALSE,
    total_float_days INTEGER DEFAULT 0,
    sequence_order INTEGER,

    -- Linking to blockers
    affected_by_blockers UUID[] DEFAULT '{}', -- Array of blocker IDs

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_activity_code_per_project UNIQUE(project_id, activity_code)
);

-- Weather and External Events for force majeure claims
CREATE TABLE external_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- 'WEATHER', 'FORCE_MAJEURE', 'REGULATORY', 'MARKET'
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT,

    -- Timing
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    event_duration_days INTEGER,

    -- Impact Assessment
    impact_level VARCHAR(50), -- 'LOW', 'MEDIUM', 'HIGH', 'SEVERE'
    affected_activities TEXT[],
    estimated_delay_days INTEGER DEFAULT 0,

    -- Evidence
    official_source VARCHAR(200), -- e.g., 'Met Office', 'Government Notice'
    source_reference VARCHAR(200),
    evidence_files TEXT[],

    -- Claim Integration
    is_included_in_claims BOOLEAN DEFAULT FALSE,
    related_claim_ids UUID[] DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-generation templates for different contract types
CREATE TABLE eot_claim_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_type contract_type_enum NOT NULL,
    template_name VARCHAR(200) NOT NULL,

    -- Template Structure
    narrative_structure JSONB, -- JSON structure for narrative generation
    required_sections TEXT[],
    standard_clauses TEXT[],

    -- Content Templates
    introduction_template TEXT,
    background_template TEXT,
    delay_analysis_template TEXT,
    conclusion_template TEXT,

    -- Formatting
    document_style JSONB, -- Styling preferences
    export_format VARCHAR(50) DEFAULT 'PDF',

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_eot_claims_project_id ON eot_claims(project_id);
CREATE INDEX idx_eot_claims_company_id ON eot_claims(company_id);
CREATE INDEX idx_eot_claims_status ON eot_claims(status);
CREATE INDEX idx_eot_claims_submission_date ON eot_claims(submission_date);
CREATE INDEX idx_eot_claims_claim_period ON eot_claims(claim_period_start, claim_period_end);

CREATE INDEX idx_eot_blockers_claim_id ON eot_blockers(eot_claim_id);
CREATE INDEX idx_eot_blockers_blocker_id ON eot_blockers(blocker_id);
CREATE INDEX idx_eot_blockers_critical_path ON eot_blockers(is_critical_path);

CREATE INDEX idx_eot_evidence_claim_id ON eot_supporting_evidence(claim_id);
CREATE INDEX idx_eot_evidence_type ON eot_supporting_evidence(evidence_type);
CREATE INDEX idx_eot_evidence_date ON eot_supporting_evidence(evidence_date);

CREATE INDEX idx_critical_path_project_id ON critical_path_activities(project_id);
CREATE INDEX idx_critical_path_dates ON critical_path_activities(planned_start_date, planned_finish_date);

CREATE INDEX idx_external_events_project_id ON external_events(project_id);
CREATE INDEX idx_external_events_dates ON external_events(event_start_date, event_end_date);

-- Enable Row Level Security
ALTER TABLE eot_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE eot_blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE eot_supporting_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clause_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_path_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE eot_claim_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company isolation
CREATE POLICY "Users can only access EOT claims from their company" ON eot_claims
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can only access EOT blockers from their company" ON eot_blockers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM eot_claims ec
            WHERE ec.claim_id = eot_blockers.eot_claim_id
            AND ec.company_id = get_user_company_id()
        )
    );

CREATE POLICY "Users can only access EOT evidence from their company" ON eot_supporting_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM eot_claims ec
            WHERE ec.claim_id = eot_supporting_evidence.claim_id
            AND ec.company_id = get_user_company_id()
        )
    );

CREATE POLICY "Users can access contract clause library" ON contract_clause_library
    FOR SELECT USING (true);

CREATE POLICY "Users can only access critical path activities from their company" ON critical_path_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = critical_path_activities.project_id
            AND p.company_id = get_user_company_id()
        )
    );

CREATE POLICY "Users can only access external events from their company" ON external_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = external_events.project_id
            AND p.company_id = get_user_company_id()
        )
    );

CREATE POLICY "Users can access EOT claim templates" ON eot_claim_templates
    FOR SELECT USING (true);

-- Super admin access policies
CREATE POLICY "Super admins can access all EOT data" ON eot_claims
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can access all EOT blockers" ON eot_blockers
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can access all EOT evidence" ON eot_supporting_evidence
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can manage contract clauses" ON contract_clause_library
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can access all critical path data" ON critical_path_activities
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can access all external events" ON external_events
    FOR ALL USING (is_super_admin());

CREATE POLICY "Super admins can manage EOT templates" ON eot_claim_templates
    FOR ALL USING (is_super_admin());

-- Seed data for contract clause library
INSERT INTO contract_clause_library (contract_type, clause_reference, clause_title, clause_text, clause_category, delay_type, is_time_related, is_cost_related, standard_narrative_template) VALUES

-- JCT Standard Building Contract clauses
('JCT_SBC', '2.28', 'Extension of Time - Relevant Events', 'The Architect/Contract Administrator shall grant a fair and reasonable extension of time if completion of the Works is likely to be delayed beyond the Completion Date by a Relevant Event.', 'Extension of Time', 'Employer Risk Event', true, false, 'This claim is submitted under Clause 2.28 of the JCT Standard Building Contract in respect of [RELEVANT_EVENT]. The delay has arisen due to [CAUSE] which constitutes a Relevant Event under the contract.'),

('JCT_SBC', '2.26.1', 'Relevant Events - Variations', 'A Relevant Event is any variation required by an Architect/Contract Administrator''s instruction or by a variation required by a Variation.', 'Variations', 'Employer Risk Event', true, true, 'The Contractor submits this Extension of Time claim following variations instructed by the Architect under Clause 2.26.1. The additional work has necessarily extended the critical path of the Works.'),

('JCT_SBC', '2.26.6', 'Relevant Events - Late Instructions', 'A Relevant Event includes the late receipt of any necessary instruction, drawing, detail or level for which the Contractor specifically applied in writing.', 'Information', 'Employer Risk Event', true, false, 'The delay has been caused by the late provision of information specifically requested by the Contractor, constituting a Relevant Event under Clause 2.26.6.'),

('JCT_SBC', '2.26.13', 'Relevant Events - Exceptionally Adverse Weather', 'A Relevant Event includes exceptionally adverse weather conditions.', 'Weather', 'Neutral Event', true, false, 'The Works have been delayed by exceptionally adverse weather conditions as defined under Clause 2.26.13. Weather records demonstrate conditions significantly beyond seasonal norms.'),

-- NEC4 ECC clauses
('NEC4_ECC', '60.1', 'Compensation Events - Employer Instructions', 'A compensation event arises when the Project Manager gives an instruction changing the Works Information.', 'Compensation Events', 'Employer Risk Event', true, true, 'This notification relates to a compensation event under Clause 60.1(1) following an instruction from the Project Manager that changed the Works Information.'),

('NEC4_ECC', '60.1(12)', 'Compensation Events - Physical Conditions', 'A compensation event arises when the Contractor encounters physical conditions which are within the Site and which an experienced contractor would have judged at the Contract Date to have such a small chance of occurring that it would have been unreasonable for him to have allowed for them.', 'Ground Conditions', 'Employer Risk Event', true, true, 'Unforeseen ground conditions have been encountered that constitute a compensation event under Clause 60.1(12). These conditions could not reasonably have been foreseen by an experienced contractor.'),

('NEC4_ECC', '60.1(19)', 'Compensation Events - Prevention', 'A compensation event arises when the Employer or Others prevent the Contractor from Providing the Works.', 'Prevention', 'Employer Risk Event', true, true, 'The Contractor has been prevented from carrying out the Works by [PREVENTION_CAUSE], constituting a compensation event under Clause 60.1(19).'),

-- FIDIC Red Book clauses
('FIDIC_RED', '8.4', 'Extension of Time for Completion', 'The Contractor shall be entitled to an extension of the Time for Completion if and to the extent that completion for the purposes of Sub-Clause 10.1 is or will be delayed by any of the following causes.', 'Extension of Time', 'Various', true, false, 'The Contractor claims an extension of time under Clause 8.4 due to [DELAY_CAUSE] which has delayed completion of the Works.'),

('FIDIC_RED', '8.4(b)', 'Variations and Other Substantial Changes', 'An extension may be granted for a Variation or other substantial change in the quantity of an item of work included in the Contract.', 'Variations', 'Employer Risk Event', true, true, 'This claim arises from substantial changes in work quantities constituting grounds for extension under Clause 8.4(b).'),

('FIDIC_RED', '8.4(f)', 'Exceptionally Adverse Climatic Conditions', 'An extension may be granted for exceptionally adverse climatic conditions.', 'Weather', 'Neutral Event', true, false, 'Exceptionally adverse climatic conditions have caused delays warranting an extension under Clause 8.4(f).');

-- Insert EOT claim templates
INSERT INTO eot_claim_templates (contract_type, template_name, narrative_structure, required_sections, introduction_template, delay_analysis_template) VALUES

('JCT_SBC', 'Standard EOT Claim Template',
 '{"sections": ["introduction", "background", "delay_events", "critical_path_analysis", "conclusion"]}',
 ARRAY['Contract Details', 'Programme Information', 'Delay Events', 'Critical Path Impact', 'Extension Claimed'],
 'This Extension of Time claim is submitted in accordance with Clause 2.28 of the JCT Standard Building Contract 2016. The claim relates to delays encountered during the period [CLAIM_PERIOD] which have impacted the critical path of the Works.',
 'Analysis of the project programme demonstrates that the delay events have extended the critical path by [DELAY_DAYS] days. The following activities have been directly impacted: [AFFECTED_ACTIVITIES].'
),

('NEC4_ECC', 'Compensation Event Template',
 '{"sections": ["notification", "event_description", "programme_impact", "cost_impact", "quotation"]}',
 ARRAY['Event Notification', 'Event Description', 'Programme Analysis', 'Cost Assessment', 'Quotation Summary'],
 'This compensation event notification is submitted under Clause 61.3 of the NEC4 Engineering and Construction Contract. The event described herein constitutes a compensation event under Clause 60.1.',
 'The programme analysis shows that the compensation event has affected the Accepted Programme resulting in a delay to the Completion Date of [DELAY_DAYS] days.'
);

-- Functions for auto-generation

-- Function to generate EOT claim reference number
CREATE OR REPLACE FUNCTION generate_eot_claim_reference(project_id UUID, contract_type contract_type_enum)
RETURNS VARCHAR(50) AS $$
DECLARE
    project_code VARCHAR(20);
    claim_count INTEGER;
    contract_prefix VARCHAR(10);
    reference_number VARCHAR(50);
BEGIN
    -- Get project code
    SELECT code INTO project_code FROM projects WHERE id = project_id;

    -- Get claim count for this project
    SELECT COUNT(*) + 1 INTO claim_count FROM eot_claims WHERE project_id = generate_eot_claim_reference.project_id;

    -- Set contract prefix
    contract_prefix := CASE contract_type
        WHEN 'JCT_SBC' THEN 'JCT'
        WHEN 'NEC4_ECC' THEN 'NEC'
        WHEN 'FIDIC_RED' THEN 'FID'
        ELSE 'EOT'
    END;

    -- Generate reference
    reference_number := project_code || '-' || contract_prefix || '-EOT-' || LPAD(claim_count::TEXT, 3, '0');

    RETURN reference_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate EOT claim from blockers
CREATE OR REPLACE FUNCTION auto_generate_eot_claim(
    p_project_id UUID,
    p_contract_type contract_type_enum,
    p_claim_period_start DATE,
    p_claim_period_end DATE,
    p_blocker_ids UUID[]
) RETURNS UUID AS $$
DECLARE
    claim_id UUID;
    total_days INTEGER := 0;
    critical_days INTEGER := 0;
    narrative TEXT := '';
    blocker_record RECORD;
    claim_title TEXT;
    company_id UUID;
BEGIN
    -- Get company ID from project
    SELECT p.company_id INTO company_id FROM projects p WHERE p.id = p_project_id;

    -- Calculate total delay days from blockers
    SELECT COALESCE(SUM(
        CASE
            WHEN b.resolution_date IS NOT NULL
            THEN (b.resolution_date - b.identified_date)
            ELSE (CURRENT_DATE - b.identified_date)
        END
    ), 0) INTO total_days
    FROM blockers b
    WHERE b.id = ANY(p_blocker_ids);

    -- Generate claim title
    claim_title := 'Extension of Time Claim - ' || to_char(p_claim_period_start, 'Mon YYYY');

    -- Create the claim
    INSERT INTO eot_claims (
        company_id,
        project_id,
        claim_reference_number,
        claim_title,
        contract_type,
        claim_period_start,
        claim_period_end,
        total_delay_days,
        claimed_extension_days,
        status,
        auto_generated_narrative
    ) VALUES (
        company_id,
        p_project_id,
        generate_eot_claim_reference(p_project_id, p_contract_type),
        claim_title,
        p_contract_type,
        p_claim_period_start,
        p_claim_period_end,
        total_days,
        total_days, -- Initially claim full delay
        'DRAFT',
        'Auto-generated claim based on blocker analysis for the period ' || p_claim_period_start || ' to ' || p_claim_period_end
    ) RETURNING claim_id INTO claim_id;

    -- Link blockers to the claim
    FOR blocker_record IN
        SELECT b.*,
               CASE
                   WHEN b.resolution_date IS NOT NULL
                   THEN (b.resolution_date - b.identified_date)
                   ELSE (CURRENT_DATE - b.identified_date)
               END as delay_days
        FROM blockers b
        WHERE b.id = ANY(p_blocker_ids)
    LOOP
        INSERT INTO eot_blockers (
            eot_claim_id,
            blocker_id,
            delay_contribution_days,
            delay_percentage,
            causation_category,
            cause_description
        ) VALUES (
            claim_id,
            blocker_record.id,
            blocker_record.delay_days,
            CASE WHEN total_days > 0 THEN (blocker_record.delay_days::DECIMAL / total_days * 100) ELSE 0 END,
            blocker_record.category,
            blocker_record.description
        );
    END LOOP;

    RETURN claim_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_eot_claims_updated_at BEFORE UPDATE ON eot_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eot_blockers_updated_at BEFORE UPDATE ON eot_blockers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eot_evidence_updated_at BEFORE UPDATE ON eot_supporting_evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_critical_path_updated_at BEFORE UPDATE ON critical_path_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_events_updated_at BEFORE UPDATE ON external_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();