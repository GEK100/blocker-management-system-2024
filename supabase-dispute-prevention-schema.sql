-- Dispute Prevention & Resolution Database Schema
-- Comprehensive early warning system and evidence compilation for contractual disputes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums for dispute categorization
CREATE TYPE dispute_type AS ENUM (
    'payment',
    'delay',
    'quality',
    'scope',
    'variation',
    'termination',
    'safety',
    'environmental'
);

CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE escalation_stage AS ENUM (
    'monitoring',
    'early_warning',
    'formal_notice',
    'legal_action',
    'adjudication',
    'arbitration',
    'litigation'
);

CREATE TYPE deadline_type AS ENUM (
    'notice',
    'warning',
    'claim',
    'response',
    'variation',
    'payment',
    'completion',
    'remedy'
);

CREATE TYPE deadline_status AS ENUM (
    'pending',
    'met',
    'missed',
    'waived',
    'extended'
);

CREATE TYPE evidence_type AS ENUM (
    'contemporaneous_record',
    'photographic',
    'communication',
    'technical_document',
    'financial_record',
    'witness_statement',
    'expert_opinion',
    'third_party_verification'
);

CREATE TYPE warning_type AS ENUM (
    'payment_risk',
    'delay_claim',
    'quality_dispute',
    'scope_disagreement',
    'communication_breakdown',
    'contractual_breach',
    'relationship_deterioration'
);

CREATE TYPE contract_type AS ENUM (
    'JCT_2016',
    'NEC4',
    'FIDIC',
    'ICE',
    'RIBA',
    'bespoke'
);

-- Dispute Risks Tracker
CREATE TABLE dispute_risks (
    risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES subcontractors(id),
    dispute_type dispute_type NOT NULL,
    risk_level risk_level NOT NULL DEFAULT 'low',
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100) DEFAULT 0,
    trigger_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_escalation_date TIMESTAMPTZ,
    contract_clause_references TEXT[],
    escalation_stage escalation_stage DEFAULT 'monitoring',
    mitigation_actions TEXT[],
    estimated_value DECIMAL(12,2),
    likelihood_percentage DECIMAL(5,2) DEFAULT 0,
    impact_assessment TEXT,
    responsible_party TEXT, -- who should take action
    next_review_date TIMESTAMPTZ,
    resolution_deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractual Deadlines Management
CREATE TABLE contractual_deadlines (
    deadline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    dispute_risk_id UUID REFERENCES dispute_risks(risk_id),
    deadline_type deadline_type NOT NULL,
    contract_clause_reference TEXT,
    contractual_days INTEGER NOT NULL,
    trigger_event TEXT NOT NULL,
    trigger_date TIMESTAMPTZ NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status deadline_status DEFAULT 'pending',
    days_remaining INTEGER,
    auto_alert_sent BOOLEAN DEFAULT FALSE,
    alert_levels INTEGER[] DEFAULT '{7,3,1}', -- days before deadline to alert
    completion_date TIMESTAMPTZ,
    extension_granted_days INTEGER DEFAULT 0,
    waiver_reason TEXT,
    responsible_party TEXT,
    notification_recipients TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence Packages for Legal Support
CREATE TABLE evidence_packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    dispute_risk_id UUID NOT NULL REFERENCES dispute_risks(risk_id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    evidence_type evidence_type NOT NULL,
    blocker_ids UUID[], -- related blockers
    document_references TEXT[],
    photo_references TEXT[],
    communication_logs JSONB,
    witness_details JSONB,
    timestamps JSONB, -- critical timing evidence
    legal_readiness_score INTEGER CHECK (legal_readiness_score >= 0 AND legal_readiness_score <= 100),
    chain_of_custody JSONB, -- audit trail for legal admissibility
    verification_status BOOLEAN DEFAULT FALSE,
    last_verified_date TIMESTAMPTZ,
    compiled_by UUID REFERENCES profiles(id),
    reviewed_by UUID REFERENCES profiles(id),
    legal_privilege BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Early Warning System
CREATE TABLE early_warnings (
    warning_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    dispute_risk_id UUID REFERENCES dispute_risks(risk_id),
    warning_type warning_type NOT NULL,
    detection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity INTEGER CHECK (severity >= 1 AND severity <= 5) DEFAULT 1,
    confidence_level DECIMAL(5,2) DEFAULT 0, -- AI confidence in prediction
    trigger_criteria JSONB, -- what caused this warning
    recommended_actions TEXT[],
    days_to_critical INTEGER, -- estimated days until critical escalation
    auto_generated BOOLEAN DEFAULT TRUE,
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_date TIMESTAMPTZ,
    action_taken TEXT,
    outcome TEXT,
    false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Intelligence
CREATE TABLE contract_clauses (
    clause_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contract_type contract_type NOT NULL,
    clause_number TEXT NOT NULL,
    clause_title TEXT NOT NULL,
    clause_text TEXT,
    clause_category TEXT, -- payment, delay, variation, etc.
    notice_period_days INTEGER,
    response_period_days INTEGER,
    keywords TEXT[], -- for automatic matching
    dispute_relevance INTEGER CHECK (dispute_relevance >= 1 AND dispute_relevance <= 5),
    precedent_cases TEXT[],
    legal_interpretation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Monitoring
CREATE TABLE communication_monitoring (
    monitor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES subcontractors(id),
    communication_type TEXT, -- email, blocker comment, meeting note
    communication_date TIMESTAMPTZ NOT NULL,
    sender_id UUID REFERENCES profiles(id),
    recipient_ids UUID[],
    subject_line TEXT,
    content_summary TEXT,
    sentiment_score DECIMAL(5,2), -- -1 to +1, negative indicates hostility
    escalation_indicators TEXT[],
    legal_significance INTEGER CHECK (legal_significance >= 1 AND legal_significance <= 5),
    notice_given BOOLEAN DEFAULT FALSE,
    notice_type TEXT,
    response_required BOOLEAN DEFAULT FALSE,
    response_deadline TIMESTAMPTZ,
    response_received BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispute Resolution History
CREATE TABLE dispute_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    dispute_risk_id UUID NOT NULL REFERENCES dispute_risks(risk_id),
    resolution_method TEXT, -- negotiation, mediation, adjudication, arbitration, litigation
    initiated_date TIMESTAMPTZ NOT NULL,
    resolution_date TIMESTAMPTZ,
    outcome TEXT, -- settled, won, lost, withdrawn
    settlement_amount DECIMAL(12,2),
    legal_costs DECIMAL(12,2),
    time_to_resolution_days INTEGER,
    success_factors TEXT[],
    lessons_learned TEXT,
    precedent_value TEXT,
    external_advisors JSONB,
    documentation_package_id UUID REFERENCES evidence_packages(package_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispute Prevention Dashboard View
CREATE VIEW dispute_prevention_dashboard AS
SELECT
    c.id as company_id,
    c.name as company_name,

    -- Risk Summary
    (SELECT COUNT(*) FROM dispute_risks dr WHERE dr.company_id = c.id AND dr.status = 'active') as active_dispute_risks,
    (SELECT COUNT(*) FROM dispute_risks dr WHERE dr.company_id = c.id AND dr.risk_level = 'critical') as critical_risks,
    (SELECT COUNT(*) FROM dispute_risks dr WHERE dr.company_id = c.id AND dr.risk_level = 'high') as high_risks,

    -- Deadline Management
    (SELECT COUNT(*) FROM contractual_deadlines cd WHERE cd.company_id = c.id AND cd.status = 'pending') as pending_deadlines,
    (SELECT COUNT(*) FROM contractual_deadlines cd WHERE cd.company_id = c.id AND cd.due_date <= NOW() + INTERVAL '7 days') as urgent_deadlines,
    (SELECT COUNT(*) FROM contractual_deadlines cd WHERE cd.company_id = c.id AND cd.status = 'missed') as missed_deadlines,

    -- Early Warnings
    (SELECT COUNT(*) FROM early_warnings ew WHERE ew.company_id = c.id AND ew.detection_date >= NOW() - INTERVAL '30 days') as recent_warnings,
    (SELECT COUNT(*) FROM early_warnings ew WHERE ew.company_id = c.id AND ew.severity >= 4) as severe_warnings,

    -- Evidence Readiness
    (SELECT COUNT(*) FROM evidence_packages ep
     JOIN dispute_risks dr ON ep.dispute_risk_id = dr.risk_id
     WHERE dr.company_id = c.id AND ep.legal_readiness_score >= 80) as legal_ready_packages,

    -- Communication Health
    (SELECT COALESCE(AVG(cm.sentiment_score), 0)
     FROM communication_monitoring cm
     WHERE cm.company_id = c.id AND cm.communication_date >= NOW() - INTERVAL '30 days') as avg_communication_sentiment

FROM companies c;

-- Indexes for performance
CREATE INDEX idx_dispute_risks_company ON dispute_risks(company_id);
CREATE INDEX idx_dispute_risks_project ON dispute_risks(project_id);
CREATE INDEX idx_dispute_risks_level ON dispute_risks(risk_level);
CREATE INDEX idx_dispute_risks_type ON dispute_risks(dispute_type);
CREATE INDEX idx_dispute_risks_status ON dispute_risks(status);

CREATE INDEX idx_contractual_deadlines_company ON contractual_deadlines(company_id);
CREATE INDEX idx_contractual_deadlines_project ON contractual_deadlines(project_id);
CREATE INDEX idx_contractual_deadlines_due_date ON contractual_deadlines(due_date);
CREATE INDEX idx_contractual_deadlines_status ON contractual_deadlines(status);

CREATE INDEX idx_evidence_packages_company ON evidence_packages(company_id);
CREATE INDEX idx_evidence_packages_dispute ON evidence_packages(dispute_risk_id);
CREATE INDEX idx_evidence_packages_readiness ON evidence_packages(legal_readiness_score);

CREATE INDEX idx_early_warnings_company ON early_warnings(company_id);
CREATE INDEX idx_early_warnings_project ON early_warnings(project_id);
CREATE INDEX idx_early_warnings_type ON early_warnings(warning_type);
CREATE INDEX idx_early_warnings_severity ON early_warnings(severity);

CREATE INDEX idx_communication_monitoring_company ON communication_monitoring(company_id);
CREATE INDEX idx_communication_monitoring_project ON communication_monitoring(project_id);
CREATE INDEX idx_communication_monitoring_date ON communication_monitoring(communication_date);
CREATE INDEX idx_communication_monitoring_sentiment ON communication_monitoring(sentiment_score);

-- Dispute Risk Detection Functions

-- Function to calculate dispute risk score
CREATE OR REPLACE FUNCTION calculate_dispute_risk_score(
    p_project_id UUID,
    p_subcontractor_id UUID DEFAULT NULL,
    p_dispute_type dispute_type DEFAULT NULL
)
RETURNS TABLE (
    risk_score INTEGER,
    risk_level risk_level,
    contributing_factors JSONB,
    recommended_actions TEXT[]
) AS $$
DECLARE
    v_unresolved_blockers INTEGER;
    v_old_blockers INTEGER;
    v_escalating_language INTEGER;
    v_delay_days INTEGER;
    v_cost_overrun DECIMAL;
    v_communication_sentiment DECIMAL;
    v_score INTEGER := 0;
    v_factors JSONB := '{}';
    v_actions TEXT[] := ARRAY[]::TEXT[];
    v_level risk_level;
BEGIN
    -- Count unresolved blockers
    SELECT COUNT(*) INTO v_unresolved_blockers
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND b.status != 'resolved';

    -- Count old unresolved blockers (>30 days)
    SELECT COUNT(*) INTO v_old_blockers
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND b.status != 'resolved'
        AND b.created_date < NOW() - INTERVAL '30 days';

    -- Count escalating language indicators
    SELECT COUNT(*) INTO v_escalating_language
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND (
            b.description ILIKE '%claim%' OR
            b.description ILIKE '%additional cost%' OR
            b.description ILIKE '%variation%' OR
            b.description ILIKE '%delay%' OR
            b.description ILIKE '%dispute%' OR
            b.description ILIKE '%breach%'
        );

    -- Calculate total delay days
    SELECT COALESCE(SUM(EXTRACT(DAYS FROM (COALESCE(b.resolved_date, NOW()) - b.created_date))), 0)
    INTO v_delay_days
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND b.category IN ('delay', 'coordination');

    -- Get average communication sentiment
    SELECT COALESCE(AVG(cm.sentiment_score), 0) INTO v_communication_sentiment
    FROM communication_monitoring cm
    WHERE cm.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR cm.subcontractor_id = p_subcontractor_id)
        AND cm.communication_date >= NOW() - INTERVAL '30 days';

    -- Calculate risk score (0-100)
    v_score := LEAST(100,
        (v_unresolved_blockers * 5) +
        (v_old_blockers * 10) +
        (v_escalating_language * 15) +
        (LEAST(v_delay_days / 10, 20)) +
        (CASE WHEN v_communication_sentiment < -0.3 THEN 20 ELSE 0 END)
    );

    -- Build contributing factors
    v_factors := jsonb_build_object(
        'unresolved_blockers', v_unresolved_blockers,
        'old_blockers', v_old_blockers,
        'escalating_language', v_escalating_language,
        'delay_days', v_delay_days,
        'communication_sentiment', v_communication_sentiment
    );

    -- Determine risk level and actions
    IF v_score >= 80 THEN
        v_level := 'critical';
        v_actions := ARRAY[
            'Immediate legal consultation required',
            'Prepare formal notice documents',
            'Compile comprehensive evidence package',
            'Consider suspension of work if contractually permitted',
            'Schedule urgent senior management meeting'
        ];
    ELSIF v_score >= 60 THEN
        v_level := 'high';
        v_actions := ARRAY[
            'Schedule meeting with subcontractor senior management',
            'Review contract obligations and deadlines',
            'Begin evidence compilation',
            'Consider mediation or alternative dispute resolution',
            'Notify insurance providers if applicable'
        ];
    ELSIF v_score >= 30 THEN
        v_level := 'medium';
        v_actions := ARRAY[
            'Increase monitoring and communication frequency',
            'Document all interactions carefully',
            'Review contract clauses for relevant procedures',
            'Consider early intervention meeting'
        ];
    ELSE
        v_level := 'low';
        v_actions := ARRAY[
            'Continue standard monitoring',
            'Maintain good record keeping',
            'Ensure timely responses to communications'
        ];
    END IF;

    RETURN QUERY SELECT v_score, v_level, v_factors, v_actions;
END;
$$ LANGUAGE plpgsql;

-- Function to detect payment dispute indicators
CREATE OR REPLACE FUNCTION detect_payment_dispute_indicators(
    p_project_id UUID,
    p_subcontractor_id UUID DEFAULT NULL
)
RETURNS TABLE (
    indicator_type TEXT,
    severity INTEGER,
    evidence_count INTEGER,
    description TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Old unresolved blockers indicator
    SELECT
        'old_unresolved_blockers' as indicator_type,
        CASE
            WHEN COUNT(*) >= 10 THEN 5
            WHEN COUNT(*) >= 5 THEN 3
            ELSE 1
        END as severity,
        COUNT(*)::INTEGER as evidence_count,
        'Subcontractor has ' || COUNT(*) || ' unresolved blockers older than 30 days' as description,
        'Review payment schedules and consider interim payment if justified' as recommended_action
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND b.status != 'resolved'
        AND b.created_date < NOW() - INTERVAL '30 days'
    GROUP BY p_project_id
    HAVING COUNT(*) >= 5

    UNION ALL

    -- Claim language indicator
    SELECT
        'claim_language_detected' as indicator_type,
        CASE
            WHEN COUNT(*) >= 5 THEN 4
            WHEN COUNT(*) >= 3 THEN 3
            ELSE 2
        END as severity,
        COUNT(*)::INTEGER as evidence_count,
        'Detected claim-related language in ' || COUNT(*) || ' blocker descriptions' as description,
        'Document all additional work and review contract variation procedures' as recommended_action
    FROM blockers b
    WHERE b.project_id = p_project_id
        AND (p_subcontractor_id IS NULL OR b.subcontractor_id = p_subcontractor_id)
        AND (
            b.description ILIKE '%additional cost%' OR
            b.description ILIKE '%claim%' OR
            b.description ILIKE '%variation%' OR
            b.description ILIKE '%extra work%'
        )
    GROUP BY p_project_id
    HAVING COUNT(*) >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function to generate evidence package
CREATE OR REPLACE FUNCTION generate_evidence_package(
    p_dispute_risk_id UUID,
    p_package_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_package_id UUID;
    v_dispute_risk RECORD;
    v_package_name TEXT;
    v_blockers RECORD;
    v_communications JSONB := '[]';
    v_photos TEXT[] := ARRAY[]::TEXT[];
    v_witnesses JSONB := '[]';
    v_readiness_score INTEGER := 0;
BEGIN
    -- Get dispute risk details
    SELECT * INTO v_dispute_risk FROM dispute_risks WHERE risk_id = p_dispute_risk_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispute risk not found: %', p_dispute_risk_id;
    END IF;

    -- Generate package name if not provided
    v_package_name := COALESCE(
        p_package_name,
        'Evidence Package - ' || v_dispute_risk.dispute_type || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD')
    );

    -- Create evidence package
    INSERT INTO evidence_packages (
        company_id,
        dispute_risk_id,
        package_name,
        evidence_type,
        legal_readiness_score,
        compiled_by
    ) VALUES (
        v_dispute_risk.company_id,
        p_dispute_risk_id,
        v_package_name,
        'contemporaneous_record',
        0, -- will be calculated
        auth.uid()
    ) RETURNING package_id INTO v_package_id;

    -- Collect related blockers
    UPDATE evidence_packages
    SET blocker_ids = (
        SELECT array_agg(b.id)
        FROM blockers b
        WHERE b.project_id = v_dispute_risk.project_id
            AND (v_dispute_risk.subcontractor_id IS NULL OR b.subcontractor_id = v_dispute_risk.subcontractor_id)
            AND (
                b.category::TEXT = v_dispute_risk.dispute_type::TEXT OR
                b.description ILIKE '%' || v_dispute_risk.dispute_type::TEXT || '%'
            )
    )
    WHERE package_id = v_package_id;

    -- Calculate readiness score based on evidence completeness
    SELECT
        CASE
            WHEN blocker_count >= 10 THEN 40
            WHEN blocker_count >= 5 THEN 25
            WHEN blocker_count >= 1 THEN 15
            ELSE 0
        END +
        CASE
            WHEN photo_count >= 20 THEN 30
            WHEN photo_count >= 10 THEN 20
            WHEN photo_count >= 5 THEN 10
            ELSE 0
        END +
        CASE
            WHEN communication_count >= 10 THEN 20
            WHEN communication_count >= 5 THEN 15
            WHEN communication_count >= 1 THEN 10
            ELSE 0
        END +
        10 -- base score for having package
    INTO v_readiness_score
    FROM (
        SELECT
            COALESCE(array_length(ep.blocker_ids, 1), 0) as blocker_count,
            COALESCE(array_length(ep.photo_references, 1), 0) as photo_count,
            COALESCE(jsonb_array_length(ep.communication_logs), 0) as communication_count
        FROM evidence_packages ep
        WHERE ep.package_id = v_package_id
    ) counts;

    -- Update readiness score
    UPDATE evidence_packages
    SET legal_readiness_score = LEAST(v_readiness_score, 100)
    WHERE package_id = v_package_id;

    RETURN v_package_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check contractual deadlines
CREATE OR REPLACE FUNCTION check_contractual_deadlines(
    p_company_id UUID
)
RETURNS TABLE (
    deadline_id UUID,
    project_name TEXT,
    deadline_type deadline_type,
    days_remaining INTEGER,
    urgency_level TEXT,
    required_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.deadline_id,
        p.name as project_name,
        cd.deadline_type,
        EXTRACT(DAYS FROM (cd.due_date - NOW()))::INTEGER as days_remaining,
        CASE
            WHEN cd.due_date <= NOW() THEN 'OVERDUE'
            WHEN cd.due_date <= NOW() + INTERVAL '1 day' THEN 'CRITICAL'
            WHEN cd.due_date <= NOW() + INTERVAL '3 days' THEN 'URGENT'
            WHEN cd.due_date <= NOW() + INTERVAL '7 days' THEN 'HIGH'
            ELSE 'NORMAL'
        END as urgency_level,
        CASE cd.deadline_type
            WHEN 'notice' THEN 'Send formal notice immediately'
            WHEN 'warning' THEN 'Issue contractual warning'
            WHEN 'claim' THEN 'Submit detailed claim documentation'
            WHEN 'response' THEN 'Provide formal response to other party'
            ELSE 'Review contract requirements and take appropriate action'
        END as required_action
    FROM contractual_deadlines cd
    JOIN projects p ON cd.project_id = p.id
    WHERE cd.company_id = p_company_id
        AND cd.status = 'pending'
        AND cd.due_date <= NOW() + INTERVAL '14 days'
    ORDER BY cd.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic monitoring

-- Trigger to update dispute risk when blockers change
CREATE OR REPLACE FUNCTION update_dispute_risk_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_dispute_risk_id UUID;
    v_risk_data RECORD;
BEGIN
    -- Check if this blocker indicates dispute risk
    IF NEW.description ILIKE '%claim%' OR
       NEW.description ILIKE '%dispute%' OR
       NEW.description ILIKE '%additional cost%' OR
       NEW.description ILIKE '%variation%' OR
       NEW.created_date < NOW() - INTERVAL '30 days' THEN

        -- Check for existing dispute risk
        SELECT risk_id INTO v_dispute_risk_id
        FROM dispute_risks dr
        WHERE dr.project_id = NEW.project_id
            AND (dr.subcontractor_id = NEW.subcontractor_id OR dr.subcontractor_id IS NULL)
            AND dr.status = 'active'
        LIMIT 1;

        -- Get risk calculation
        SELECT * INTO v_risk_data
        FROM calculate_dispute_risk_score(NEW.project_id, NEW.subcontractor_id)
        LIMIT 1;

        IF v_dispute_risk_id IS NULL THEN
            -- Create new dispute risk
            INSERT INTO dispute_risks (
                company_id, project_id, subcontractor_id,
                dispute_type, risk_level, risk_score,
                mitigation_actions
            )
            SELECT
                p.company_id, NEW.project_id, NEW.subcontractor_id,
                CASE
                    WHEN NEW.description ILIKE '%payment%' OR NEW.description ILIKE '%cost%' THEN 'payment'::dispute_type
                    WHEN NEW.description ILIKE '%delay%' OR NEW.description ILIKE '%time%' THEN 'delay'::dispute_type
                    WHEN NEW.description ILIKE '%quality%' OR NEW.description ILIKE '%defect%' THEN 'quality'::dispute_type
                    WHEN NEW.description ILIKE '%scope%' OR NEW.description ILIKE '%variation%' THEN 'scope'::dispute_type
                    ELSE 'payment'::dispute_type
                END,
                v_risk_data.risk_level,
                v_risk_data.risk_score,
                v_risk_data.recommended_actions
            FROM projects p
            WHERE p.id = NEW.project_id;
        ELSE
            -- Update existing risk
            UPDATE dispute_risks
            SET
                risk_level = v_risk_data.risk_level,
                risk_score = v_risk_data.risk_score,
                mitigation_actions = v_risk_data.recommended_actions,
                updated_at = NOW()
            WHERE risk_id = v_dispute_risk_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dispute_risk
    AFTER INSERT OR UPDATE ON blockers
    FOR EACH ROW
    EXECUTE FUNCTION update_dispute_risk_trigger();

-- Trigger to send deadline alerts
CREATE OR REPLACE FUNCTION deadline_alert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if we need to send alerts
    IF NEW.status = 'pending' AND NEW.due_date <= NOW() + INTERVAL '7 days' AND NOT NEW.auto_alert_sent THEN
        -- Insert early warning
        INSERT INTO early_warnings (
            company_id, project_id, warning_type, severity,
            recommended_actions, days_to_critical
        ) VALUES (
            NEW.company_id, NEW.project_id, 'contractual_breach',
            CASE
                WHEN NEW.due_date <= NOW() + INTERVAL '1 day' THEN 5
                WHEN NEW.due_date <= NOW() + INTERVAL '3 days' THEN 4
                ELSE 3
            END,
            ARRAY['Review contractual deadline: ' || NEW.deadline_type::TEXT],
            EXTRACT(DAYS FROM (NEW.due_date - NOW()))::INTEGER
        );

        -- Mark alert as sent
        UPDATE contractual_deadlines
        SET auto_alert_sent = TRUE
        WHERE deadline_id = NEW.deadline_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deadline_alert
    AFTER INSERT OR UPDATE ON contractual_deadlines
    FOR EACH ROW
    EXECUTE FUNCTION deadline_alert_trigger();

-- Row Level Security
ALTER TABLE dispute_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractual_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_resolutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company isolation
CREATE POLICY dispute_risks_company_isolation ON dispute_risks
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY contractual_deadlines_company_isolation ON contractual_deadlines
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY evidence_packages_company_isolation ON evidence_packages
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY early_warnings_company_isolation ON early_warnings
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY contract_clauses_company_isolation ON contract_clauses
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY communication_monitoring_company_isolation ON communication_monitoring
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY dispute_resolutions_company_isolation ON dispute_resolutions
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

-- Super admin policies
CREATE POLICY dispute_risks_super_admin ON dispute_risks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY contractual_deadlines_super_admin ON contractual_deadlines
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY evidence_packages_super_admin ON evidence_packages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY early_warnings_super_admin ON early_warnings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY contract_clauses_super_admin ON contract_clauses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY communication_monitoring_super_admin ON communication_monitoring
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY dispute_resolutions_super_admin ON dispute_resolutions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- Comments for documentation
COMMENT ON TABLE dispute_risks IS 'Tracks potential disputes with early warning indicators and risk scoring';
COMMENT ON TABLE contractual_deadlines IS 'Manages critical contractual deadlines with automatic alerts';
COMMENT ON TABLE evidence_packages IS 'Compiles and organizes evidence for legal proceedings or settlements';
COMMENT ON TABLE early_warnings IS 'Early warning system for dispute prevention and intervention';
COMMENT ON TABLE contract_clauses IS 'Contract intelligence for automatic clause matching and deadline tracking';
COMMENT ON TABLE communication_monitoring IS 'Monitors communication patterns for dispute risk indicators';
COMMENT ON TABLE dispute_resolutions IS 'Historical record of dispute outcomes and lessons learned';