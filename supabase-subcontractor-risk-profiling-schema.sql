-- Subcontractor Risk Profiling Database Schema
-- This schema implements comprehensive subcontractor performance tracking and risk scoring for procurement decisions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums for subcontractor risk profiling system
CREATE TYPE performance_grade AS ENUM ('A', 'B', 'C', 'D', 'F');
CREATE TYPE trend_direction AS ENUM ('improving', 'stable', 'degrading');
CREATE TYPE trend_period AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE recommendation_type AS ENUM ('preferred', 'approved', 'caution', 'monitor', 'avoid');
CREATE TYPE alert_type AS ENUM ('performance_degradation', 'quality_concern', 'reliability_issue', 'communication_problem');

-- Subcontractor Profiles Table
-- Core profiling information and calculated risk scores
CREATE TABLE subcontractor_profiles (
    profile_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(subcontractor_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    trade_type VARCHAR(100),
    overall_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
    performance_grade performance_grade NOT NULL DEFAULT 'C',
    projects_worked INTEGER NOT NULL DEFAULT 0,
    total_blockers_assigned INTEGER NOT NULL DEFAULT 0,
    total_blockers_caused INTEGER NOT NULL DEFAULT 0,
    total_blockers_resolved INTEGER NOT NULL DEFAULT 0,
    average_resolution_days DECIMAL(10,2) NOT NULL DEFAULT 0,
    resolution_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    rejection_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    repeat_issue_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    communication_score INTEGER DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 100),
    reliability_score INTEGER DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    speed_score INTEGER DEFAULT 0 CHECK (speed_score >= 0 AND speed_score <= 100),
    blacklist_status BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    performance_alerts TEXT[],
    last_assessment_date DATE DEFAULT CURRENT_DATE,
    assessment_period_start DATE,
    assessment_period_end DATE,
    data_points_count INTEGER DEFAULT 0,
    confidence_level DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcontractor_id, company_id)
);

-- Performance Metrics Table
-- Detailed metrics per project for each subcontractor
CREATE TABLE performance_metrics (
    metric_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(subcontractor_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assessment_period_start DATE NOT NULL,
    assessment_period_end DATE NOT NULL,
    blockers_assigned INTEGER NOT NULL DEFAULT 0,
    blockers_resolved INTEGER NOT NULL DEFAULT 0,
    blockers_rejected INTEGER NOT NULL DEFAULT 0,
    blockers_escalated INTEGER NOT NULL DEFAULT 0,
    average_resolution_days DECIMAL(10,2) NOT NULL DEFAULT 0,
    fastest_resolution_days DECIMAL(10,2) DEFAULT 0,
    slowest_resolution_days DECIMAL(10,2) DEFAULT 0,
    resolution_time_std_dev DECIMAL(10,2) DEFAULT 0,
    first_response_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    average_response_hours DECIMAL(10,2) DEFAULT 0,
    resolution_success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    repeat_issue_count INTEGER NOT NULL DEFAULT 0,
    photos_provided_count INTEGER DEFAULT 0,
    photos_required_count INTEGER DEFAULT 0,
    photos_provided_percentage DECIMAL(5,2) DEFAULT 0,
    detailed_descriptions_count INTEGER DEFAULT 0,
    rejection_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    on_time_completion_rate DECIMAL(5,2) DEFAULT 0,
    escalation_rate DECIMAL(5,2) DEFAULT 0,
    fix_rate DECIMAL(5,2) DEFAULT 0,
    communication_responsiveness_score INTEGER DEFAULT 0,
    project_value DECIMAL(15,2) DEFAULT 0,
    project_type VARCHAR(100),
    performance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcontractor_id, project_id, assessment_period_start)
);

-- Performance Trends Table
-- Historical trend analysis for each subcontractor
CREATE TABLE performance_trends (
    trend_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(subcontractor_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    trend_period trend_period NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    resolution_time_trend trend_direction NOT NULL DEFAULT 'stable',
    quality_trend trend_direction NOT NULL DEFAULT 'stable',
    reliability_trend trend_direction NOT NULL DEFAULT 'stable',
    communication_trend trend_direction NOT NULL DEFAULT 'stable',
    overall_trend trend_direction NOT NULL DEFAULT 'stable',
    resolution_time_change_percentage DECIMAL(5,2) DEFAULT 0,
    quality_score_change DECIMAL(5,2) DEFAULT 0,
    reliability_score_change DECIMAL(5,2) DEFAULT 0,
    projects_in_period INTEGER DEFAULT 0,
    blockers_in_period INTEGER DEFAULT 0,
    trend_confidence DECIMAL(5,2) DEFAULT 0,
    trend_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcontractor_id, trend_period, period_start)
);

-- Procurement Recommendations Table
-- AI-generated recommendations for procurement decisions
CREATE TABLE procurement_recommendations (
    recommendation_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(subcontractor_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    recommendation_type recommendation_type NOT NULL,
    recommendation_grade performance_grade,
    confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    reasoning TEXT NOT NULL,
    supporting_data JSONB NOT NULL DEFAULT '{}',
    risk_factors TEXT[],
    strengths TEXT[],
    concerns TEXT[],
    project_type_suitability JSONB DEFAULT '{}',
    cost_benefit_analysis JSONB DEFAULT '{}',
    valid_until DATE,
    created_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Alerts Table
-- System-generated alerts for performance issues
CREATE TABLE performance_alerts (
    alert_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(subcontractor_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    trigger_data JSONB NOT NULL DEFAULT '{}',
    threshold_breached DECIMAL(10,2),
    current_value DECIMAL(10,2),
    recommended_action TEXT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subcontractor Comparisons Table
-- Side-by-side comparisons for procurement decisions
CREATE TABLE subcontractor_comparisons (
    comparison_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    comparison_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    subcontractor_ids UUID[] NOT NULL,
    comparison_criteria JSONB NOT NULL DEFAULT '{}',
    comparison_results JSONB NOT NULL DEFAULT '{}',
    recommendation_summary TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Benchmarks Table
-- Industry and company benchmarks for comparison
CREATE TABLE performance_benchmarks (
    benchmark_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    trade_type VARCHAR(100) NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL, -- 'company_average', 'industry_standard', 'top_performer'
    average_resolution_days DECIMAL(10,2) DEFAULT 0,
    target_resolution_days DECIMAL(10,2) DEFAULT 0,
    acceptable_rejection_rate DECIMAL(5,2) DEFAULT 5.0,
    target_first_response_hours DECIMAL(10,2) DEFAULT 24.0,
    minimum_photo_percentage DECIMAL(5,2) DEFAULT 80.0,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_subcontractor_profiles_company ON subcontractor_profiles(company_id);
CREATE INDEX idx_subcontractor_profiles_score ON subcontractor_profiles(overall_risk_score DESC);
CREATE INDEX idx_subcontractor_profiles_grade ON subcontractor_profiles(performance_grade);
CREATE INDEX idx_performance_metrics_subcontractor ON performance_metrics(subcontractor_id, assessment_period_start DESC);
CREATE INDEX idx_performance_metrics_project ON performance_metrics(project_id);
CREATE INDEX idx_performance_trends_subcontractor ON performance_trends(subcontractor_id, period_start DESC);
CREATE INDEX idx_procurement_recommendations_active ON procurement_recommendations(company_id, is_active, recommendation_type);
CREATE INDEX idx_performance_alerts_unresolved ON performance_alerts(company_id, is_resolved, severity DESC);

-- Row Level Security Policies
ALTER TABLE subcontractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company access
CREATE POLICY "Company members can view subcontractor profiles" ON subcontractor_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage subcontractor profiles" ON subcontractor_profiles
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Similar policies for other tables
CREATE POLICY "Company members can view performance metrics" ON performance_metrics
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view performance trends" ON performance_trends
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view procurement recommendations" ON procurement_recommendations
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view performance alerts" ON performance_alerts
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_roles
            WHERE user_id = auth.uid()
        )
    );

-- Super admin bypass policies
CREATE POLICY "Super admin full access profiles" ON subcontractor_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_company_roles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Trigger function for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_subcontractor_profiles_updated_at BEFORE UPDATE ON subcontractor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procurement_recommendations_updated_at BEFORE UPDATE ON procurement_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate subcontractor risk score
CREATE OR REPLACE FUNCTION calculate_subcontractor_risk_score(
    p_subcontractor_id UUID,
    p_company_id UUID,
    p_assessment_period_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    overall_risk_score INTEGER,
    speed_score INTEGER,
    quality_score INTEGER,
    reliability_score INTEGER,
    communication_score INTEGER,
    performance_grade performance_grade,
    confidence_level DECIMAL(5,2)
) AS $$
DECLARE
    total_projects INTEGER;
    total_blockers INTEGER;
    avg_resolution_days DECIMAL(10,2);
    company_avg_resolution DECIMAL(10,2);
    rejection_rate DECIMAL(5,2);
    repeat_rate DECIMAL(5,2);
    response_hours DECIMAL(10,2);
    photo_percentage DECIMAL(5,2);
    on_time_rate DECIMAL(5,2);
    escalation_rate DECIMAL(5,2);

    calculated_speed_score INTEGER;
    calculated_quality_score INTEGER;
    calculated_reliability_score INTEGER;
    calculated_communication_score INTEGER;
    calculated_overall_score INTEGER;
    calculated_grade performance_grade;
    calculated_confidence DECIMAL(5,2);
BEGIN
    -- Get assessment period start date
    DECLARE assessment_start DATE := CURRENT_DATE - INTERVAL '1 month' * p_assessment_period_months;

    -- Calculate basic metrics
    SELECT
        COUNT(DISTINCT project_id),
        SUM(blockers_assigned),
        COALESCE(AVG(NULLIF(average_resolution_days, 0)), 0),
        COALESCE(AVG(NULLIF(rejection_rate, 0)), 0),
        COALESCE(AVG(NULLIF(repeat_issue_count::DECIMAL / NULLIF(blockers_assigned, 0) * 100, 0)), 0),
        COALESCE(AVG(NULLIF(first_response_hours, 0)), 0),
        COALESCE(AVG(NULLIF(photos_provided_percentage, 0)), 0),
        COALESCE(AVG(NULLIF(on_time_completion_rate, 0)), 0),
        COALESCE(AVG(NULLIF(escalation_rate, 0)), 0)
    INTO
        total_projects, total_blockers, avg_resolution_days, rejection_rate,
        repeat_rate, response_hours, photo_percentage, on_time_rate, escalation_rate
    FROM performance_metrics
    WHERE subcontractor_id = p_subcontractor_id
    AND company_id = p_company_id
    AND assessment_period_start >= assessment_start;

    -- Get company average for comparison
    SELECT COALESCE(AVG(NULLIF(average_resolution_days, 0)), 7)
    INTO company_avg_resolution
    FROM performance_metrics
    WHERE company_id = p_company_id
    AND assessment_period_start >= assessment_start;

    -- Calculate Speed Score (25% weight)
    -- Lower resolution time = higher score
    calculated_speed_score := CASE
        WHEN avg_resolution_days = 0 THEN 50 -- No data
        WHEN avg_resolution_days <= company_avg_resolution * 0.5 THEN 100 -- 50% faster than average
        WHEN avg_resolution_days <= company_avg_resolution * 0.75 THEN 90 -- 25% faster
        WHEN avg_resolution_days <= company_avg_resolution THEN 80 -- At average
        WHEN avg_resolution_days <= company_avg_resolution * 1.25 THEN 60 -- 25% slower
        WHEN avg_resolution_days <= company_avg_resolution * 1.5 THEN 40 -- 50% slower
        ELSE 20 -- Much slower
    END;

    -- Calculate Quality Score (30% weight)
    -- Lower rejection and repeat rates = higher score
    calculated_quality_score := GREATEST(0,
        100 - (rejection_rate * 2) - (repeat_rate * 1.5) -
        CASE WHEN photo_percentage < 80 THEN (80 - photo_percentage) * 0.5 ELSE 0 END
    )::INTEGER;

    -- Calculate Reliability Score (25% weight)
    -- Higher on-time rate, lower escalation rate = higher score
    calculated_reliability_score := LEAST(100,
        GREATEST(0, (on_time_rate * 0.7) + ((100 - escalation_rate) * 0.3))
    )::INTEGER;

    -- Calculate Communication Score (20% weight)
    -- Faster response time = higher score
    calculated_communication_score := CASE
        WHEN response_hours = 0 THEN 50 -- No data
        WHEN response_hours <= 4 THEN 100 -- Very responsive
        WHEN response_hours <= 12 THEN 90 -- Good
        WHEN response_hours <= 24 THEN 80 -- Acceptable
        WHEN response_hours <= 48 THEN 60 -- Slow
        WHEN response_hours <= 72 THEN 40 -- Very slow
        ELSE 20 -- Poor
    END;

    -- Calculate weighted overall score
    calculated_overall_score := ROUND(
        (calculated_speed_score * 0.25) +
        (calculated_quality_score * 0.30) +
        (calculated_reliability_score * 0.25) +
        (calculated_communication_score * 0.20)
    );

    -- Determine performance grade
    calculated_grade := CASE
        WHEN calculated_overall_score >= 80 THEN 'A'::performance_grade
        WHEN calculated_overall_score >= 60 THEN 'B'::performance_grade
        WHEN calculated_overall_score >= 40 THEN 'C'::performance_grade
        WHEN calculated_overall_score >= 20 THEN 'D'::performance_grade
        ELSE 'F'::performance_grade
    END;

    -- Calculate confidence level based on data points
    calculated_confidence := LEAST(100,
        CASE
            WHEN total_blockers = 0 THEN 10
            WHEN total_blockers < 5 THEN 30
            WHEN total_blockers < 10 THEN 50
            WHEN total_blockers < 20 THEN 70
            WHEN total_blockers < 50 THEN 85
            ELSE 95
        END +
        CASE
            WHEN total_projects = 0 THEN 0
            WHEN total_projects = 1 THEN 5
            WHEN total_projects < 3 THEN 10
            WHEN total_projects < 5 THEN 15
            ELSE 20
        END
    );

    -- Return results
    RETURN QUERY SELECT
        calculated_overall_score,
        calculated_speed_score,
        calculated_quality_score,
        calculated_reliability_score,
        calculated_communication_score,
        calculated_grade,
        calculated_confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to update subcontractor performance metrics
CREATE OR REPLACE FUNCTION update_subcontractor_performance_metrics(
    p_subcontractor_id UUID,
    p_project_id UUID,
    p_assessment_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_assessment_end DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
    company_id_val UUID;
    blockers_data RECORD;
    photos_data RECORD;
BEGIN
    -- Get company_id
    SELECT p.company_id INTO company_id_val
    FROM projects p WHERE p.project_id = p_project_id;

    -- Calculate blocker metrics for the period
    SELECT
        COUNT(*) as total_assigned,
        COUNT(*) FILTER (WHERE status = 'resolved') as total_resolved,
        COUNT(*) FILTER (WHERE status = 'rejected') as total_rejected,
        COUNT(*) FILTER (WHERE priority = 'CRITICAL' AND status != 'resolved') as total_escalated,
        COALESCE(AVG(EXTRACT(DAY FROM (COALESCE(resolution_date, CURRENT_DATE) - identified_date))), 0) as avg_resolution,
        COALESCE(MIN(EXTRACT(DAY FROM (resolution_date - identified_date))), 0) as fastest_resolution,
        COALESCE(MAX(EXTRACT(DAY FROM (resolution_date - identified_date))), 0) as slowest_resolution,
        COALESCE(STDDEV(EXTRACT(DAY FROM (resolution_date - identified_date))), 0) as resolution_std_dev
    INTO blockers_data
    FROM blockers
    WHERE assigned_to = p_subcontractor_id
    AND project_id = p_project_id
    AND identified_date >= p_assessment_start
    AND identified_date <= p_assessment_end;

    -- Calculate photo compliance
    SELECT
        COUNT(*) FILTER (WHERE photos IS NOT NULL AND array_length(photos, 1) > 0) as photos_provided,
        COUNT(*) as photos_required
    INTO photos_data
    FROM blockers
    WHERE assigned_to = p_subcontractor_id
    AND project_id = p_project_id
    AND identified_date >= p_assessment_start
    AND identified_date <= p_assessment_end
    AND status = 'resolved';

    -- Insert or update performance metrics
    INSERT INTO performance_metrics (
        subcontractor_id, project_id, company_id,
        assessment_period_start, assessment_period_end,
        blockers_assigned, blockers_resolved, blockers_rejected, blockers_escalated,
        average_resolution_days, fastest_resolution_days, slowest_resolution_days,
        resolution_time_std_dev, resolution_success_rate, rejection_rate,
        photos_provided_count, photos_required_count, photos_provided_percentage,
        escalation_rate, fix_rate
    ) VALUES (
        p_subcontractor_id, p_project_id, company_id_val,
        p_assessment_start, p_assessment_end,
        blockers_data.total_assigned, blockers_data.total_resolved,
        blockers_data.total_rejected, blockers_data.total_escalated,
        blockers_data.avg_resolution, blockers_data.fastest_resolution,
        blockers_data.slowest_resolution, blockers_data.resolution_std_dev,
        CASE WHEN blockers_data.total_assigned > 0
             THEN (blockers_data.total_resolved::DECIMAL / blockers_data.total_assigned * 100)
             ELSE 0 END,
        CASE WHEN blockers_data.total_assigned > 0
             THEN (blockers_data.total_rejected::DECIMAL / blockers_data.total_assigned * 100)
             ELSE 0 END,
        photos_data.photos_provided, photos_data.photos_required,
        CASE WHEN photos_data.photos_required > 0
             THEN (photos_data.photos_provided::DECIMAL / photos_data.photos_required * 100)
             ELSE 0 END,
        CASE WHEN blockers_data.total_assigned > 0
             THEN (blockers_data.total_escalated::DECIMAL / blockers_data.total_assigned * 100)
             ELSE 0 END,
        CASE WHEN blockers_data.total_resolved > 0
             THEN ((blockers_data.total_resolved - blockers_data.total_rejected)::DECIMAL / blockers_data.total_resolved * 100)
             ELSE 0 END
    ) ON CONFLICT (subcontractor_id, project_id, assessment_period_start)
    DO UPDATE SET
        blockers_assigned = EXCLUDED.blockers_assigned,
        blockers_resolved = EXCLUDED.blockers_resolved,
        blockers_rejected = EXCLUDED.blockers_rejected,
        average_resolution_days = EXCLUDED.average_resolution_days,
        resolution_success_rate = EXCLUDED.resolution_success_rate,
        rejection_rate = EXCLUDED.rejection_rate,
        photos_provided_percentage = EXCLUDED.photos_provided_percentage,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to update all subcontractor profiles
CREATE OR REPLACE FUNCTION update_all_subcontractor_profiles()
RETURNS VOID AS $$
DECLARE
    subcontractor_record RECORD;
    risk_result RECORD;
BEGIN
    -- Loop through all active subcontractors
    FOR subcontractor_record IN
        SELECT DISTINCT s.subcontractor_id, s.company_id, s.company_name, s.trade_type
        FROM subcontractors s
        WHERE s.is_active = true
    LOOP
        -- Calculate risk score for this subcontractor
        SELECT * INTO risk_result
        FROM calculate_subcontractor_risk_score(
            subcontractor_record.subcontractor_id,
            subcontractor_record.company_id
        );

        -- Get project and blocker counts
        DECLARE
            project_count INTEGER;
            blocker_assigned INTEGER;
            blocker_caused INTEGER;
            blocker_resolved INTEGER;
        BEGIN
            SELECT COUNT(DISTINCT project_id) INTO project_count
            FROM performance_metrics
            WHERE subcontractor_id = subcontractor_record.subcontractor_id;

            SELECT
                COALESCE(SUM(blockers_assigned), 0),
                COALESCE(SUM(blockers_resolved), 0)
            INTO blocker_assigned, blocker_resolved
            FROM performance_metrics
            WHERE subcontractor_id = subcontractor_record.subcontractor_id;

            -- Update or insert profile
            INSERT INTO subcontractor_profiles (
                subcontractor_id, company_id, company_name, trade_type,
                overall_risk_score, performance_grade, projects_worked,
                total_blockers_assigned, total_blockers_resolved,
                speed_score, quality_score, reliability_score, communication_score,
                confidence_level, last_assessment_date
            ) VALUES (
                subcontractor_record.subcontractor_id, subcontractor_record.company_id,
                subcontractor_record.company_name, subcontractor_record.trade_type,
                risk_result.overall_risk_score, risk_result.performance_grade, project_count,
                blocker_assigned, blocker_resolved,
                risk_result.speed_score, risk_result.quality_score,
                risk_result.reliability_score, risk_result.communication_score,
                risk_result.confidence_level, CURRENT_DATE
            ) ON CONFLICT (subcontractor_id, company_id)
            DO UPDATE SET
                overall_risk_score = EXCLUDED.overall_risk_score,
                performance_grade = EXCLUDED.performance_grade,
                projects_worked = EXCLUDED.projects_worked,
                total_blockers_assigned = EXCLUDED.total_blockers_assigned,
                total_blockers_resolved = EXCLUDED.total_blockers_resolved,
                speed_score = EXCLUDED.speed_score,
                quality_score = EXCLUDED.quality_score,
                reliability_score = EXCLUDED.reliability_score,
                communication_score = EXCLUDED.communication_score,
                confidence_level = EXCLUDED.confidence_level,
                last_assessment_date = EXCLUDED.last_assessment_date,
                updated_at = CURRENT_TIMESTAMP;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for procurement dashboard
CREATE OR REPLACE VIEW procurement_dashboard AS
SELECT
    sp.subcontractor_id,
    sp.company_id,
    sp.company_name,
    sp.trade_type,
    sp.overall_risk_score,
    sp.performance_grade,
    sp.projects_worked,
    sp.total_blockers_assigned,
    sp.total_blockers_resolved,
    sp.resolution_success_rate,
    sp.rejection_rate,
    sp.average_resolution_days,
    sp.blacklist_status,
    sp.confidence_level,
    sp.last_assessment_date,
    pr.recommendation_type,
    pr.reasoning as recommendation_reasoning,
    (SELECT COUNT(*) FROM performance_alerts pa
     WHERE pa.subcontractor_id = sp.subcontractor_id
     AND pa.is_resolved = false) as active_alerts,
    (SELECT trend_direction FROM performance_trends pt
     WHERE pt.subcontractor_id = sp.subcontractor_id
     AND pt.trend_period = 'quarterly'
     ORDER BY pt.period_start DESC LIMIT 1) as recent_trend
FROM subcontractor_profiles sp
LEFT JOIN procurement_recommendations pr ON sp.subcontractor_id = pr.subcontractor_id
    AND pr.is_active = true
ORDER BY sp.overall_risk_score DESC;

-- Insert sample benchmark data
INSERT INTO performance_benchmarks (company_id, trade_type, benchmark_type, average_resolution_days, target_resolution_days, acceptable_rejection_rate, target_first_response_hours)
SELECT DISTINCT
    company_id,
    'General',
    'company_average',
    7.0,
    5.0,
    10.0,
    24.0
FROM companies
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Subcontractor Risk Profiling system for comprehensive performance tracking and procurement decision support - analyzes performance across all projects to provide risk scores and recommendations';