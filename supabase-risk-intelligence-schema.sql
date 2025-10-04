-- Predictive Risk Intelligence Database Schema
-- This schema implements comprehensive project risk analysis and prediction capabilities

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for risk intelligence system
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_indicator_type AS ENUM ('blocker_spike', 'resolution_slowdown', 'contractor_degradation', 'repeat_pattern', 'schedule_threat', 'quality_decline');
CREATE TYPE trend_direction AS ENUM ('improving', 'stable', 'declining', 'critical');
CREATE TYPE prediction_outcome AS ENUM ('on_time', 'minor_delay', 'major_delay', 'cost_overrun', 'scope_change');

-- Project Health Scores Table
-- Tracks daily health scores and trends for all projects
CREATE TABLE project_health_scores (
    score_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    score_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_health_score INTEGER NOT NULL CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
    blocker_velocity_score INTEGER NOT NULL CHECK (blocker_velocity_score >= 0 AND blocker_velocity_score <= 100),
    resolution_trend_score INTEGER NOT NULL CHECK (resolution_trend_score >= 0 AND resolution_trend_score <= 100),
    critical_blocker_score INTEGER NOT NULL CHECK (critical_blocker_score >= 0 AND critical_blocker_score <= 100),
    repeat_issue_score INTEGER NOT NULL CHECK (repeat_issue_score >= 0 AND repeat_issue_score <= 100),
    blocker_velocity_trend trend_direction NOT NULL DEFAULT 'stable',
    repeat_issue_count INTEGER NOT NULL DEFAULT 0,
    risk_level risk_level NOT NULL DEFAULT 'low',
    prediction_confidence DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (prediction_confidence >= 0 AND prediction_confidence <= 100),
    weekly_blocker_count INTEGER NOT NULL DEFAULT 0,
    average_resolution_days DECIMAL(10,2) NOT NULL DEFAULT 0,
    critical_blocker_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    resolution_rate_trend DECIMAL(5,2) NOT NULL DEFAULT 0,
    predicted_delay_days INTEGER DEFAULT 0,
    schedule_confidence DECIMAL(5,2) DEFAULT 95.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, score_date)
);

-- Risk Indicators Table
-- Stores detected risk patterns and alerts
CREATE TABLE risk_indicators (
    indicator_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    indicator_type risk_indicator_type NOT NULL,
    detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    risk_level risk_level NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    impact_assessment TEXT,
    trigger_data JSONB NOT NULL DEFAULT '{}',
    threshold_breached BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    predicted_impact_days INTEGER DEFAULT 0,
    confidence_score DECIMAL(5,2) DEFAULT 75.0,
    historical_pattern_match BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Similar Project Comparisons Table
-- Tracks patterns across projects for predictive analysis
CREATE TABLE similar_project_comparisons (
    comparison_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    comparison_project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
    shared_risk_patterns JSONB NOT NULL DEFAULT '{}',
    outcome_comparison JSONB NOT NULL DEFAULT '{}',
    pattern_match_details TEXT,
    timeline_similarity DECIMAL(5,2) DEFAULT 0,
    blocker_pattern_similarity DECIMAL(5,2) DEFAULT 0,
    contractor_pattern_similarity DECIMAL(5,2) DEFAULT 0,
    final_outcome prediction_outcome,
    actual_delay_days INTEGER DEFAULT 0,
    cost_variance_percentage DECIMAL(5,2) DEFAULT 0,
    lessons_learned TEXT,
    risk_materialization_timeline JSONB DEFAULT '{}',
    predictive_indicators JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, comparison_project_id)
);

-- Risk Pattern Library Table
-- Stores learned patterns for future prediction
CREATE TABLE risk_pattern_library (
    pattern_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type risk_indicator_type NOT NULL,
    pattern_signature JSONB NOT NULL,
    historical_frequency INTEGER DEFAULT 1,
    average_impact_days DECIMAL(10,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    mitigation_strategies TEXT[],
    early_warning_signals JSONB DEFAULT '{}',
    pattern_confidence DECIMAL(5,2) DEFAULT 50.0,
    last_detected_date DATE,
    detection_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Predictive Alerts Table
-- Stores generated alerts and notifications
CREATE TABLE predictive_alerts (
    alert_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    risk_level risk_level NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recommended_actions TEXT[],
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    predicted_impact TEXT,
    urgency_score INTEGER CHECK (urgency_score >= 1 AND urgency_score <= 10),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    escalation_level INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Risk Timeline Table
-- Tracks when risks were predicted vs when they materialized
CREATE TABLE project_risk_timeline (
    timeline_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    risk_type VARCHAR(100) NOT NULL,
    predicted_date DATE NOT NULL,
    materialized_date DATE,
    prediction_accuracy_days INTEGER,
    early_warning_days INTEGER,
    risk_severity INTEGER CHECK (risk_severity >= 1 AND risk_severity <= 10),
    actual_impact_days INTEGER DEFAULT 0,
    mitigation_effectiveness DECIMAL(5,2) DEFAULT 0,
    lessons_learned TEXT,
    pattern_matched_id UUID REFERENCES risk_pattern_library(pattern_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_project_health_scores_project_date ON project_health_scores(project_id, score_date DESC);
CREATE INDEX idx_project_health_scores_company ON project_health_scores(company_id);
CREATE INDEX idx_project_health_scores_risk_level ON project_health_scores(risk_level, score_date DESC);
CREATE INDEX idx_risk_indicators_project ON risk_indicators(project_id, detected_date DESC);
CREATE INDEX idx_risk_indicators_company ON risk_indicators(company_id);
CREATE INDEX idx_risk_indicators_active ON risk_indicators(is_active, risk_level);
CREATE INDEX idx_similar_project_comparisons_project ON similar_project_comparisons(project_id);
CREATE INDEX idx_similar_project_comparisons_similarity ON similar_project_comparisons(similarity_score DESC);
CREATE INDEX idx_predictive_alerts_project ON predictive_alerts(project_id, created_at DESC);
CREATE INDEX idx_predictive_alerts_unresolved ON predictive_alerts(is_resolved, risk_level);
CREATE INDEX idx_risk_pattern_library_company ON risk_pattern_library(company_id, pattern_type);
CREATE INDEX idx_project_risk_timeline_project ON project_risk_timeline(project_id, predicted_date DESC);

-- Row Level Security Policies
ALTER TABLE project_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE similar_project_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_pattern_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risk_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_health_scores
CREATE POLICY "Company members can view project health scores" ON project_health_scores
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert/update project health scores" ON project_health_scores
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for risk_indicators
CREATE POLICY "Company members can view risk indicators" ON risk_indicators
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage risk indicators" ON risk_indicators
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for similar_project_comparisons
CREATE POLICY "Company members can view project comparisons" ON similar_project_comparisons
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for risk_pattern_library
CREATE POLICY "Company members can view risk patterns" ON risk_pattern_library
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for predictive_alerts
CREATE POLICY "Company members can view predictive alerts" ON predictive_alerts
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can acknowledge alerts" ON predictive_alerts
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for project_risk_timeline
CREATE POLICY "Company members can view risk timeline" ON project_risk_timeline
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

-- Super admin bypass for all tables
CREATE POLICY "Super admin full access project_health_scores" ON project_health_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin full access risk_indicators" ON risk_indicators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin full access similar_project_comparisons" ON similar_project_comparisons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin full access risk_pattern_library" ON risk_pattern_library
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin full access predictive_alerts" ON predictive_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admin full access project_risk_timeline" ON project_risk_timeline
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_project_health_scores_updated_at BEFORE UPDATE ON project_health_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_indicators_updated_at BEFORE UPDATE ON risk_indicators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_similar_project_comparisons_updated_at BEFORE UPDATE ON similar_project_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_pattern_library_updated_at BEFORE UPDATE ON risk_pattern_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate project health score
CREATE OR REPLACE FUNCTION calculate_project_health_score(
    p_project_id UUID,
    p_analysis_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    overall_health_score INTEGER,
    blocker_velocity_score INTEGER,
    resolution_trend_score INTEGER,
    critical_blocker_score INTEGER,
    repeat_issue_score INTEGER,
    risk_level risk_level,
    prediction_confidence DECIMAL(5,2)
) AS $$
DECLARE
    weekly_blocker_count INTEGER;
    prev_week_blocker_count INTEGER;
    avg_resolution_days DECIMAL(10,2);
    baseline_resolution_days DECIMAL(10,2);
    critical_percentage DECIMAL(5,2);
    repeat_count INTEGER;
    velocity_score INTEGER;
    trend_score INTEGER;
    critical_score INTEGER;
    repeat_score INTEGER;
    final_score INTEGER;
    calculated_risk_level risk_level;
    confidence DECIMAL(5,2);
BEGIN
    -- Calculate weekly blocker count (last 7 days)
    SELECT COUNT(*) INTO weekly_blocker_count
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= p_analysis_date - INTERVAL '7 days'
    AND identified_date <= p_analysis_date;

    -- Calculate previous week blocker count
    SELECT COUNT(*) INTO prev_week_blocker_count
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= p_analysis_date - INTERVAL '14 days'
    AND identified_date < p_analysis_date - INTERVAL '7 days';

    -- Calculate average resolution days (last 30 days)
    SELECT COALESCE(AVG(EXTRACT(DAY FROM (COALESCE(resolution_date, CURRENT_DATE) - identified_date))), 0)
    INTO avg_resolution_days
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= p_analysis_date - INTERVAL '30 days'
    AND identified_date <= p_analysis_date;

    -- Calculate baseline resolution days (project average)
    SELECT COALESCE(AVG(EXTRACT(DAY FROM (resolution_date - identified_date))), 0)
    INTO baseline_resolution_days
    FROM blockers
    WHERE project_id = p_project_id
    AND resolution_date IS NOT NULL;

    -- Calculate critical blocker percentage (last 30 days)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE priority = 'CRITICAL') * 100.0 / NULLIF(COUNT(*), 0)), 0
    ) INTO critical_percentage
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= p_analysis_date - INTERVAL '30 days'
    AND identified_date <= p_analysis_date;

    -- Calculate repeat issues (same category within 30 days)
    SELECT COUNT(*) INTO repeat_count
    FROM (
        SELECT category, COUNT(*) as category_count
        FROM blockers
        WHERE project_id = p_project_id
        AND identified_date >= p_analysis_date - INTERVAL '30 days'
        AND identified_date <= p_analysis_date
        GROUP BY category
        HAVING COUNT(*) > 1
    ) repeat_categories;

    -- Calculate component scores (0-100)

    -- Blocker velocity score (lower velocity = higher score)
    velocity_score := CASE
        WHEN weekly_blocker_count = 0 THEN 100
        WHEN weekly_blocker_count <= 2 THEN 90
        WHEN weekly_blocker_count <= 5 THEN 70
        WHEN weekly_blocker_count <= 10 THEN 50
        WHEN weekly_blocker_count <= 15 THEN 30
        ELSE 10
    END;

    -- Resolution trend score (improving trend = higher score)
    trend_score := CASE
        WHEN baseline_resolution_days = 0 THEN 90
        WHEN avg_resolution_days <= baseline_resolution_days * 0.8 THEN 100  -- 20% improvement
        WHEN avg_resolution_days <= baseline_resolution_days THEN 90         -- Same or slight improvement
        WHEN avg_resolution_days <= baseline_resolution_days * 1.2 THEN 70   -- 20% degradation
        WHEN avg_resolution_days <= baseline_resolution_days * 1.5 THEN 40   -- 50% degradation
        ELSE 20
    END;

    -- Critical blocker score (lower percentage = higher score)
    critical_score := CASE
        WHEN critical_percentage = 0 THEN 100
        WHEN critical_percentage <= 10 THEN 90
        WHEN critical_percentage <= 20 THEN 70
        WHEN critical_percentage <= 30 THEN 50
        WHEN critical_percentage <= 50 THEN 30
        ELSE 10
    END;

    -- Repeat issue score (fewer repeats = higher score)
    repeat_score := CASE
        WHEN repeat_count = 0 THEN 100
        WHEN repeat_count <= 2 THEN 90
        WHEN repeat_count <= 5 THEN 70
        WHEN repeat_count <= 8 THEN 50
        WHEN repeat_count <= 12 THEN 30
        ELSE 10
    END;

    -- Calculate weighted overall score
    final_score := ROUND(
        (velocity_score * 0.30) +           -- 30% weight
        (trend_score * 0.25) +              -- 25% weight
        (critical_score * 0.25) +           -- 25% weight
        (repeat_score * 0.20)               -- 20% weight
    );

    -- Determine risk level
    calculated_risk_level := CASE
        WHEN final_score >= 70 THEN 'low'
        WHEN final_score >= 40 THEN 'medium'
        WHEN final_score >= 20 THEN 'high'
        ELSE 'critical'
    END;

    -- Calculate confidence based on data availability
    confidence := CASE
        WHEN weekly_blocker_count = 0 AND prev_week_blocker_count = 0 THEN 60.0  -- Limited data
        WHEN baseline_resolution_days = 0 THEN 70.0                              -- No historical resolution data
        ELSE 85.0 + (LEAST(weekly_blocker_count + prev_week_blocker_count, 20) / 20.0 * 15.0)  -- More data = higher confidence
    END;

    -- Return results
    RETURN QUERY SELECT
        final_score,
        velocity_score,
        trend_score,
        critical_score,
        repeat_score,
        calculated_risk_level,
        confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to detect risk indicators
CREATE OR REPLACE FUNCTION detect_risk_indicators(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
    current_week_blockers INTEGER;
    prev_week_blockers INTEGER;
    current_resolution_avg DECIMAL(10,2);
    baseline_resolution_avg DECIMAL(10,2);
    company_id_val UUID;
BEGIN
    -- Get company_id for the project
    SELECT p.company_id INTO company_id_val
    FROM projects p WHERE p.project_id = p_project_id;

    -- Check for blocker spike (>50% increase week-over-week)
    SELECT COUNT(*) INTO current_week_blockers
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= CURRENT_DATE - INTERVAL '7 days';

    SELECT COUNT(*) INTO prev_week_blockers
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= CURRENT_DATE - INTERVAL '14 days'
    AND identified_date < CURRENT_DATE - INTERVAL '7 days';

    IF prev_week_blockers > 0 AND current_week_blockers > prev_week_blockers * 1.5 THEN
        INSERT INTO risk_indicators (
            project_id, company_id, indicator_type, severity, risk_level,
            title, description, recommendation, trigger_data
        ) VALUES (
            p_project_id, company_id_val, 'blocker_spike', 7, 'high',
            'Blocker Creation Spike Detected',
            format('Blocker creation increased from %s to %s per week (>50%% increase)', prev_week_blockers, current_week_blockers),
            'Investigate root causes and implement preventive measures. Consider additional resource allocation.',
            jsonb_build_object('current_week_blockers', current_week_blockers, 'prev_week_blockers', prev_week_blockers)
        ) ON CONFLICT DO NOTHING;
    END IF;

    -- Check for resolution slowdown (>30% increase in resolution time)
    SELECT COALESCE(AVG(EXTRACT(DAY FROM (COALESCE(resolution_date, CURRENT_DATE) - identified_date))), 0)
    INTO current_resolution_avg
    FROM blockers
    WHERE project_id = p_project_id
    AND identified_date >= CURRENT_DATE - INTERVAL '30 days';

    SELECT COALESCE(AVG(EXTRACT(DAY FROM (resolution_date - identified_date))), 0)
    INTO baseline_resolution_avg
    FROM blockers
    WHERE project_id = p_project_id
    AND resolution_date IS NOT NULL
    AND identified_date < CURRENT_DATE - INTERVAL '30 days';

    IF baseline_resolution_avg > 0 AND current_resolution_avg > baseline_resolution_avg * 1.3 THEN
        INSERT INTO risk_indicators (
            project_id, company_id, indicator_type, severity, risk_level,
            title, description, recommendation, trigger_data
        ) VALUES (
            p_project_id, company_id_val, 'resolution_slowdown', 6, 'medium',
            'Resolution Performance Declining',
            format('Average resolution time increased from %.1f to %.1f days (>30%% increase)', baseline_resolution_avg, current_resolution_avg),
            'Review blocker resolution processes and resource allocation. Consider workflow optimization.',
            jsonb_build_object('current_avg', current_resolution_avg, 'baseline_avg', baseline_resolution_avg)
        ) ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily health scores (called by scheduled job)
CREATE OR REPLACE FUNCTION update_daily_health_scores()
RETURNS VOID AS $$
DECLARE
    project_record RECORD;
    health_result RECORD;
BEGIN
    -- Loop through all active projects
    FOR project_record IN
        SELECT project_id, company_id
        FROM projects
        WHERE status NOT IN ('completed', 'cancelled')
    LOOP
        -- Calculate health score for this project
        SELECT * INTO health_result
        FROM calculate_project_health_score(project_record.project_id);

        -- Insert or update today's health score
        INSERT INTO project_health_scores (
            project_id, company_id, score_date,
            overall_health_score, blocker_velocity_score, resolution_trend_score,
            critical_blocker_score, repeat_issue_score, risk_level, prediction_confidence
        ) VALUES (
            project_record.project_id, project_record.company_id, CURRENT_DATE,
            health_result.overall_health_score, health_result.blocker_velocity_score,
            health_result.resolution_trend_score, health_result.critical_blocker_score,
            health_result.repeat_issue_score, health_result.risk_level, health_result.prediction_confidence
        ) ON CONFLICT (project_id, score_date)
        DO UPDATE SET
            overall_health_score = EXCLUDED.overall_health_score,
            blocker_velocity_score = EXCLUDED.blocker_velocity_score,
            resolution_trend_score = EXCLUDED.resolution_trend_score,
            critical_blocker_score = EXCLUDED.critical_blocker_score,
            repeat_issue_score = EXCLUDED.repeat_issue_score,
            risk_level = EXCLUDED.risk_level,
            prediction_confidence = EXCLUDED.prediction_confidence,
            updated_at = CURRENT_TIMESTAMP;

        -- Detect and insert risk indicators
        PERFORM detect_risk_indicators(project_record.project_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (will be removed in production)
-- Note: This assumes some basic projects exist in the projects table

-- Insert sample health scores for testing
DO $$
DECLARE
    sample_project_id UUID;
    sample_company_id UUID;
BEGIN
    -- Get a sample project for testing (first available project)
    SELECT project_id, company_id INTO sample_project_id, sample_company_id
    FROM projects LIMIT 1;

    -- Only insert if we found a project
    IF sample_project_id IS NOT NULL THEN
        -- Insert some sample health scores for the last 30 days
        FOR i IN 0..29 LOOP
            INSERT INTO project_health_scores (
                project_id, company_id, score_date, overall_health_score,
                blocker_velocity_score, resolution_trend_score, critical_blocker_score,
                repeat_issue_score, risk_level, prediction_confidence
            ) VALUES (
                sample_project_id, sample_company_id,
                CURRENT_DATE - INTERVAL '1 day' * i,
                75 - (i * 2) + (random() * 10)::INTEGER,  -- Declining trend with some variation
                80 - (i * 1.5) + (random() * 8)::INTEGER,
                70 - (i * 2.5) + (random() * 12)::INTEGER,
                85 - (i * 1) + (random() * 6)::INTEGER,
                90 - (i * 0.5) + (random() * 4)::INTEGER,
                CASE
                    WHEN 75 - (i * 2) >= 70 THEN 'low'::risk_level
                    WHEN 75 - (i * 2) >= 40 THEN 'medium'::risk_level
                    ELSE 'high'::risk_level
                END,
                75.0 + (random() * 20)
            ) ON CONFLICT (project_id, score_date) DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

-- Create a view for easy risk dashboard queries
CREATE OR REPLACE VIEW risk_dashboard_summary AS
SELECT
    p.project_id,
    p.project_name,
    p.company_id,
    c.company_name,
    phs.overall_health_score,
    phs.risk_level,
    phs.prediction_confidence,
    phs.score_date,
    (SELECT COUNT(*) FROM risk_indicators ri
     WHERE ri.project_id = p.project_id AND ri.is_active = true) as active_risk_count,
    (SELECT COUNT(*) FROM predictive_alerts pa
     WHERE pa.project_id = p.project_id AND pa.is_resolved = false) as active_alert_count,
    (SELECT AVG(phs2.overall_health_score)
     FROM project_health_scores phs2
     WHERE phs2.project_id = p.project_id
     AND phs2.score_date >= CURRENT_DATE - INTERVAL '7 days') as weekly_avg_score
FROM projects p
JOIN companies c ON p.company_id = c.company_id
LEFT JOIN project_health_scores phs ON p.project_id = phs.project_id
    AND phs.score_date = CURRENT_DATE
WHERE p.status NOT IN ('completed', 'cancelled')
ORDER BY phs.overall_health_score ASC NULLS LAST;

COMMENT ON SCHEMA public IS 'Predictive Risk Intelligence system for construction project management - analyzes blocker patterns to forecast project problems and provide early warning alerts';