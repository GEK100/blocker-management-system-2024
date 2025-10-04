-- Cross-Project Intelligence Database Schema
-- Comprehensive pattern recognition and organizational learning system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums for categorization
CREATE TYPE root_cause_type AS ENUM (
    'design',
    'coordination',
    'procurement',
    'site',
    'documentation'
);

CREATE TYPE issue_category AS ENUM (
    'structural',
    'mechanical',
    'electrical',
    'plumbing',
    'coordination',
    'access',
    'materials',
    'design',
    'safety',
    'environmental'
);

CREATE TYPE building_type AS ENUM (
    'office',
    'residential',
    'industrial',
    'retail',
    'healthcare',
    'education',
    'mixed_use'
);

CREATE TYPE performance_grade AS ENUM ('A', 'B', 'C', 'D', 'F');

-- Recurring Issues Tracker
CREATE TABLE recurring_issues (
    issue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    issue_category issue_category NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    projects_affected UUID[] DEFAULT '{}',
    first_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_delay_days INTEGER DEFAULT 0,
    total_cost_impact DECIMAL(12,2) DEFAULT 0,
    root_cause_type root_cause_type,
    prevention_recommendation TEXT,
    similarity_keywords TEXT[],
    affected_trades TEXT[],
    typical_locations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Design Flaw Tracker
CREATE TABLE design_flaw_tracker (
    flaw_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    design_element TEXT NOT NULL,
    projects_affected UUID[] DEFAULT '{}',
    blocker_instances INTEGER DEFAULT 0,
    typical_cost_impact DECIMAL(12,2) DEFAULT 0,
    recommended_design_change TEXT,
    architect_firm TEXT,
    building_types building_type[],
    occurrence_frequency DECIMAL(5,2) DEFAULT 0, -- percentage
    severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
    resolution_strategies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Best Practices Library
CREATE TABLE best_practices (
    practice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    practice_description TEXT NOT NULL,
    category issue_category NOT NULL,
    projects_implemented UUID[] DEFAULT '{}',
    success_rate_improvement DECIMAL(5,2) DEFAULT 0, -- percentage
    average_time_saved INTEGER DEFAULT 0, -- days
    blocker_reduction_percentage DECIMAL(5,2) DEFAULT 0,
    implementation_guide TEXT,
    prerequisites TEXT[],
    cost_to_implement DECIMAL(10,2),
    roi_months INTEGER, -- return on investment in months
    evidence_projects UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Comparisons
CREATE TABLE project_comparisons (
    comparison_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_a UUID NOT NULL REFERENCES projects(id),
    project_b UUID NOT NULL REFERENCES projects(id),
    similarity_score DECIMAL(5,2) DEFAULT 0, -- 0-100%
    similarity_factors JSONB, -- detailed breakdown of similarities
    performance_delta JSONB, -- performance differences
    lessons_transferable TEXT[],
    key_differences TEXT[],
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern Recognition Cache
CREATE TABLE pattern_recognition_cache (
    cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL, -- 'recurring_issue', 'design_flaw', 'success_pattern'
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2), -- 0-100%
    last_analyzed TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Organizational Learning Metrics
CREATE TABLE learning_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    metric_trend TEXT CHECK (metric_trend IN ('improving', 'declining', 'stable')),
    calculation_period TEXT, -- 'monthly', 'quarterly', 'yearly'
    benchmark_comparison DECIMAL(5,2), -- vs company average
    projects_analyzed INTEGER,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Performance Benchmarks
CREATE TABLE project_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    total_blockers INTEGER DEFAULT 0,
    average_resolution_time DECIMAL(8,2) DEFAULT 0, -- days
    blocker_density DECIMAL(8,4) DEFAULT 0, -- blockers per £1M
    cost_impact_percentage DECIMAL(5,2) DEFAULT 0,
    performance_grade performance_grade,
    schedule_variance_days INTEGER DEFAULT 0,
    budget_variance_percentage DECIMAL(5,2) DEFAULT 0,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 100),
    coordination_effectiveness INTEGER CHECK (coordination_effectiveness >= 1 AND coordination_effectiveness <= 100),
    lessons_learned_applied INTEGER DEFAULT 0,
    preventative_actions_taken INTEGER DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success Patterns
CREATE TABLE success_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pattern_name TEXT NOT NULL,
    pattern_description TEXT,
    success_factor TEXT, -- what made it successful
    projects_with_pattern UUID[],
    projects_without_pattern UUID[],
    improvement_metrics JSONB, -- quantified benefits
    implementation_requirements TEXT[],
    adoption_difficulty TEXT CHECK (adoption_difficulty IN ('easy', 'medium', 'hard')),
    confidence_level DECIMAL(5,2), -- statistical confidence
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-Project Intelligence Dashboard View
CREATE VIEW cross_project_intelligence_dashboard AS
SELECT
    c.id as company_id,
    c.name as company_name,
    -- Recurring Issues Summary
    (SELECT COUNT(*) FROM recurring_issues ri WHERE ri.company_id = c.id) as total_recurring_issues,
    (SELECT COUNT(*) FROM recurring_issues ri WHERE ri.company_id = c.id AND ri.occurrence_count >= 3) as critical_recurring_issues,
    (SELECT COALESCE(SUM(ri.total_cost_impact), 0) FROM recurring_issues ri WHERE ri.company_id = c.id) as total_recurring_cost_impact,

    -- Design Flaws Summary
    (SELECT COUNT(*) FROM design_flaw_tracker dft WHERE dft.company_id = c.id) as total_design_flaws,
    (SELECT COUNT(*) FROM design_flaw_tracker dft WHERE dft.company_id = c.id AND dft.severity_score >= 7) as critical_design_flaws,

    -- Best Practices Summary
    (SELECT COUNT(*) FROM best_practices bp WHERE bp.company_id = c.id) as total_best_practices,
    (SELECT COALESCE(AVG(bp.success_rate_improvement), 0) FROM best_practices bp WHERE bp.company_id = c.id) as avg_success_improvement,

    -- Project Performance Summary
    (SELECT COUNT(*) FROM project_benchmarks pb WHERE pb.company_id = c.id) as analyzed_projects,
    (SELECT COALESCE(AVG(pb.blocker_density), 0) FROM project_benchmarks pb WHERE pb.company_id = c.id) as avg_blocker_density,
    (SELECT COUNT(*) FROM project_benchmarks pb WHERE pb.company_id = c.id AND pb.performance_grade IN ('A', 'B')) as high_performing_projects,

    -- Learning Metrics
    (SELECT COUNT(*) FROM success_patterns sp WHERE sp.company_id = c.id) as identified_success_patterns
FROM companies c;

-- Indexes for performance
CREATE INDEX idx_recurring_issues_company ON recurring_issues(company_id);
CREATE INDEX idx_recurring_issues_category ON recurring_issues(issue_category);
CREATE INDEX idx_recurring_issues_occurrence ON recurring_issues(occurrence_count DESC);
CREATE INDEX idx_recurring_issues_text_search ON recurring_issues USING gin(to_tsvector('english', issue_description));

CREATE INDEX idx_design_flaws_company ON design_flaw_tracker(company_id);
CREATE INDEX idx_design_flaws_severity ON design_flaw_tracker(severity_score DESC);

CREATE INDEX idx_best_practices_company ON best_practices(company_id);
CREATE INDEX idx_best_practices_category ON best_practices(category);
CREATE INDEX idx_best_practices_success ON best_practices(success_rate_improvement DESC);

CREATE INDEX idx_project_comparisons_company ON project_comparisons(company_id);
CREATE INDEX idx_project_comparisons_similarity ON project_comparisons(similarity_score DESC);

CREATE INDEX idx_project_benchmarks_company ON project_benchmarks(company_id);
CREATE INDEX idx_project_benchmarks_grade ON project_benchmarks(performance_grade);

-- Pattern Recognition Functions

-- Function to detect recurring issues
CREATE OR REPLACE FUNCTION detect_recurring_issues(
    p_company_id UUID,
    p_similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    issue_description TEXT,
    occurrence_count INTEGER,
    projects_affected UUID[],
    total_cost_impact DECIMAL(12,2),
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH blocker_analysis AS (
        SELECT
            b.description,
            b.category,
            COUNT(*) as occurrences,
            array_agg(DISTINCT b.project_id) as affected_projects,
            COALESCE(SUM(b.cost_impact), 0) as total_cost,
            array_agg(DISTINCT b.trade) as affected_trades
        FROM blockers b
        JOIN projects p ON b.project_id = p.id
        WHERE p.company_id = p_company_id
        GROUP BY b.description, b.category
        HAVING COUNT(DISTINCT b.project_id) >= 3
    )
    SELECT
        ba.description,
        ba.occurrences::INTEGER,
        ba.affected_projects,
        ba.total_cost,
        CASE
            WHEN ba.occurrences >= 5 THEN 'Critical: Implement immediate process change'
            WHEN ba.occurrences >= 3 THEN 'High Priority: Develop prevention strategy'
            ELSE 'Monitor: Track for further occurrences'
        END as recommended_action
    FROM blocker_analysis ba
    ORDER BY ba.total_cost DESC, ba.occurrences DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify design flaws
CREATE OR REPLACE FUNCTION identify_design_flaws(
    p_company_id UUID,
    p_min_projects INTEGER DEFAULT 2
)
RETURNS TABLE (
    design_element TEXT,
    projects_affected INTEGER,
    cost_impact DECIMAL(12,2),
    architect_firm TEXT,
    recommended_change TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH design_issue_analysis AS (
        SELECT
            CASE
                WHEN b.description ILIKE '%ceiling%' THEN 'Ceiling Design'
                WHEN b.description ILIKE '%service%route%' OR b.description ILIKE '%duct%' THEN 'Service Routes'
                WHEN b.description ILIKE '%access%panel%' THEN 'Access Panels'
                WHEN b.description ILIKE '%clearance%' THEN 'Spatial Clearances'
                WHEN b.description ILIKE '%coordination%' THEN 'Design Coordination'
                ELSE 'Other Design Issue'
            END as element,
            COUNT(DISTINCT b.project_id) as project_count,
            COALESCE(SUM(b.cost_impact), 0) as total_cost,
            p.architect_firm,
            array_agg(DISTINCT b.description) as descriptions
        FROM blockers b
        JOIN projects p ON b.project_id = p.id
        WHERE p.company_id = p_company_id
            AND (b.category = 'design' OR b.description ILIKE '%design%')
        GROUP BY
            CASE
                WHEN b.description ILIKE '%ceiling%' THEN 'Ceiling Design'
                WHEN b.description ILIKE '%service%route%' OR b.description ILIKE '%duct%' THEN 'Service Routes'
                WHEN b.description ILIKE '%access%panel%' THEN 'Access Panels'
                WHEN b.description ILIKE '%clearance%' THEN 'Spatial Clearances'
                WHEN b.description ILIKE '%coordination%' THEN 'Design Coordination'
                ELSE 'Other Design Issue'
            END,
            p.architect_firm
        HAVING COUNT(DISTINCT b.project_id) >= p_min_projects
    )
    SELECT
        dia.element,
        dia.project_count,
        dia.total_cost,
        dia.architect_firm,
        CASE dia.element
            WHEN 'Ceiling Design' THEN 'Review ceiling void depths and service coordination'
            WHEN 'Service Routes' THEN 'Implement 3D coordination and clash detection'
            WHEN 'Access Panels' THEN 'Standardize access panel locations and sizes'
            WHEN 'Spatial Clearances' THEN 'Increase minimum clearance requirements'
            WHEN 'Design Coordination' THEN 'Mandate early design coordination meetings'
            ELSE 'Conduct detailed design review process'
        END as recommended_change
    FROM design_issue_analysis dia
    ORDER BY dia.total_cost DESC, dia.project_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate project performance metrics
CREATE OR REPLACE FUNCTION calculate_project_performance(
    p_project_id UUID
)
RETURNS TABLE (
    total_blockers INTEGER,
    avg_resolution_time DECIMAL(8,2),
    blocker_density DECIMAL(8,4),
    cost_impact_percentage DECIMAL(5,2),
    performance_grade performance_grade,
    quality_score INTEGER
) AS $$
DECLARE
    v_total_blockers INTEGER;
    v_avg_resolution DECIMAL(8,2);
    v_project_value DECIMAL(12,2);
    v_total_cost_impact DECIMAL(12,2);
    v_grade performance_grade;
    v_quality INTEGER;
BEGIN
    -- Get basic blocker statistics
    SELECT
        COUNT(*),
        COALESCE(AVG(EXTRACT(DAYS FROM (resolved_date - created_date))), 0),
        COALESCE(SUM(cost_impact), 0)
    INTO v_total_blockers, v_avg_resolution, v_total_cost_impact
    FROM blockers
    WHERE project_id = p_project_id;

    -- Get project value
    SELECT COALESCE(budget, 1000000) INTO v_project_value
    FROM projects WHERE id = p_project_id;

    -- Calculate performance grade
    v_quality := CASE
        WHEN v_total_blockers = 0 THEN 100
        WHEN v_avg_resolution <= 2 THEN 90
        WHEN v_avg_resolution <= 5 THEN 80
        WHEN v_avg_resolution <= 10 THEN 70
        WHEN v_avg_resolution <= 15 THEN 60
        ELSE 50
    END;

    v_grade := CASE
        WHEN v_quality >= 90 THEN 'A'::performance_grade
        WHEN v_quality >= 80 THEN 'B'::performance_grade
        WHEN v_quality >= 70 THEN 'C'::performance_grade
        WHEN v_quality >= 60 THEN 'D'::performance_grade
        ELSE 'F'::performance_grade
    END;

    RETURN QUERY SELECT
        v_total_blockers,
        v_avg_resolution,
        (v_total_blockers::DECIMAL / (v_project_value / 1000000))::DECIMAL(8,4),
        ((v_total_cost_impact / v_project_value) * 100)::DECIMAL(5,2),
        v_grade,
        v_quality;
END;
$$ LANGUAGE plpgsql;

-- Function to identify success patterns
CREATE OR REPLACE FUNCTION identify_success_patterns(
    p_company_id UUID
)
RETURNS TABLE (
    pattern_name TEXT,
    success_factor TEXT,
    improvement_percentage DECIMAL(5,2),
    projects_with_pattern INTEGER,
    projects_without_pattern INTEGER,
    confidence_level DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH project_performance AS (
        SELECT
            p.id,
            p.drawings_uploaded_pre_start,
            p.coordination_meeting_frequency,
            COUNT(b.id) as blocker_count,
            COALESCE(AVG(EXTRACT(DAYS FROM (b.resolved_date - b.created_date))), 0) as avg_resolution
        FROM projects p
        LEFT JOIN blockers b ON p.id = b.project_id
        WHERE p.company_id = p_company_id
        GROUP BY p.id, p.drawings_uploaded_pre_start, p.coordination_meeting_frequency
    ),
    pattern_analysis AS (
        SELECT
            'Early Drawing Upload' as pattern,
            'Drawings uploaded before project start' as factor,
            pp_with.avg_performance,
            pp_without.avg_performance,
            COUNT(CASE WHEN pp.drawings_uploaded_pre_start THEN 1 END) as with_count,
            COUNT(CASE WHEN NOT pp.drawings_uploaded_pre_start THEN 1 END) as without_count
        FROM project_performance pp
        CROSS JOIN (
            SELECT AVG(blocker_count) as avg_performance
            FROM project_performance
            WHERE drawings_uploaded_pre_start = true
        ) pp_with
        CROSS JOIN (
            SELECT AVG(blocker_count) as avg_performance
            FROM project_performance
            WHERE drawings_uploaded_pre_start = false
        ) pp_without
        GROUP BY pp_with.avg_performance, pp_without.avg_performance
    )
    SELECT
        pa.pattern,
        pa.factor,
        CASE
            WHEN pa.avg_performance > 0 THEN
                ((pa.avg_performance - pa.avg_performance) / pa.avg_performance * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as improvement,
        pa.with_count::INTEGER,
        pa.without_count::INTEGER,
        CASE
            WHEN (pa.with_count + pa.without_count) >= 10 THEN 85.0
            WHEN (pa.with_count + pa.without_count) >= 5 THEN 70.0
            ELSE 50.0
        END::DECIMAL(5,2) as confidence
    FROM pattern_analysis pa
    WHERE pa.with_count > 0 AND pa.without_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain data consistency
CREATE OR REPLACE FUNCTION update_recurring_issues_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update recurring issues when new blockers are added
    INSERT INTO recurring_issues (
        company_id, issue_description, issue_category,
        projects_affected, root_cause_type
    )
    SELECT
        p.company_id,
        NEW.description,
        NEW.category::issue_category,
        ARRAY[NEW.project_id],
        CASE NEW.category
            WHEN 'design' THEN 'design'::root_cause_type
            WHEN 'coordination' THEN 'coordination'::root_cause_type
            WHEN 'materials' THEN 'procurement'::root_cause_type
            ELSE 'site'::root_cause_type
        END
    FROM projects p
    WHERE p.id = NEW.project_id
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_issues
    AFTER INSERT ON blockers
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_issues_trigger();

-- Row Level Security
ALTER TABLE recurring_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_flaw_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_recognition_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company isolation
CREATE POLICY recurring_issues_company_isolation ON recurring_issues
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY design_flaw_tracker_company_isolation ON design_flaw_tracker
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY best_practices_company_isolation ON best_practices
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY project_comparisons_company_isolation ON project_comparisons
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY pattern_recognition_cache_company_isolation ON pattern_recognition_cache
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY learning_metrics_company_isolation ON learning_metrics
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY project_benchmarks_company_isolation ON project_benchmarks
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY success_patterns_company_isolation ON success_patterns
    FOR ALL USING (
        company_id IN (
            SELECT cm.company_id FROM company_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

-- Super admin policies
CREATE POLICY recurring_issues_super_admin ON recurring_issues
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY design_flaw_tracker_super_admin ON design_flaw_tracker
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY best_practices_super_admin ON best_practices
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY project_comparisons_super_admin ON project_comparisons
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY pattern_recognition_cache_super_admin ON pattern_recognition_cache
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY learning_metrics_super_admin ON learning_metrics
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY project_benchmarks_super_admin ON project_benchmarks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

CREATE POLICY success_patterns_super_admin ON success_patterns
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- Comments for documentation
COMMENT ON TABLE recurring_issues IS 'Tracks blocker patterns that occur across multiple projects to identify systemic issues';
COMMENT ON TABLE design_flaw_tracker IS 'Identifies design elements that repeatedly cause problems across projects';
COMMENT ON TABLE best_practices IS 'Library of proven practices that improve project outcomes';
COMMENT ON TABLE project_comparisons IS 'Comparative analysis between similar projects to identify success factors';
COMMENT ON TABLE pattern_recognition_cache IS 'Cached results of pattern recognition algorithms for performance';
COMMENT ON TABLE learning_metrics IS 'Key performance indicators for organizational learning and improvement';
COMMENT ON TABLE project_benchmarks IS 'Performance benchmarks for all projects to enable comparison and ranking';
COMMENT ON TABLE success_patterns IS 'Identified patterns that correlate with successful project outcomes';