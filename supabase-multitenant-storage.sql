-- Multi-tenant Storage Setup for Supabase
-- Complete file isolation between companies

-- Create storage buckets (run via Supabase Dashboard or API)
-- 1. site-drawings (public: true, file size limit: 10MB, allowed types: image/*, application/pdf)
-- 2. blocker-photos (public: true, file size limit: 5MB, allowed types: image/*)

-- Storage helper functions for multi-tenant access
CREATE OR REPLACE FUNCTION get_user_company_id_from_storage()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_supervisor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('owner', 'admin', 'supervisor')
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to extract company ID from file path
CREATE OR REPLACE FUNCTION extract_company_from_path(file_path TEXT)
RETURNS UUID AS $$
BEGIN
    -- Expecting paths like: drawings/company-id/project-id/filename
    -- or blocker-photos/company-id/project-id/filename
    RETURN (string_to_array(file_path, '/'))[2]::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Site drawings storage policies with company isolation
CREATE POLICY "Company isolation for site drawings uploads" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'site-drawings' AND
    auth.role() = 'authenticated' AND
    is_user_supervisor_or_above() AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for site drawings access" ON storage.objects
FOR SELECT USING (
    bucket_id = 'site-drawings' AND
    auth.role() = 'authenticated' AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for site drawings updates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'site-drawings' AND
    auth.role() = 'authenticated' AND
    is_user_supervisor_or_above() AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for site drawings deletion" ON storage.objects
FOR DELETE USING (
    bucket_id = 'site-drawings' AND
    auth.role() = 'authenticated' AND
    is_user_supervisor_or_above() AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

-- Blocker photos storage policies with company isolation
CREATE POLICY "Company isolation for blocker photos uploads" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'blocker-photos' AND
    auth.role() = 'authenticated' AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for blocker photos access" ON storage.objects
FOR SELECT USING (
    bucket_id = 'blocker-photos' AND
    auth.role() = 'authenticated' AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for blocker photos updates" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'blocker-photos' AND
    auth.role() = 'authenticated' AND
    extract_company_from_path(name) = get_user_company_id_from_storage()
);

CREATE POLICY "Company isolation for blocker photos deletion" ON storage.objects
FOR DELETE USING (
    bucket_id = 'blocker-photos' AND
    auth.role() = 'authenticated' AND
    (
        -- Users can delete their own blocker photos or supervisors can delete any
        is_user_supervisor_or_above() OR
        extract_company_from_path(name) = get_user_company_id_from_storage()
    )
);

-- Create SQL functions for analytics (company-isolated)
CREATE OR REPLACE FUNCTION get_company_stats()
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    total_blockers BIGINT,
    open_blockers BIGINT,
    assigned_blockers BIGINT,
    resolved_blockers BIGINT,
    total_users BIGINT,
    active_users BIGINT
) AS $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Get user's company ID
    SELECT company_id INTO company_uuid
    FROM public.user_profiles
    WHERE id = auth.uid();

    IF company_uuid IS NULL THEN
        RAISE EXCEPTION 'User not associated with any company';
    END IF;

    -- Return company statistics
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.projects WHERE company_id = company_uuid),
        (SELECT COUNT(*) FROM public.projects WHERE company_id = company_uuid AND status = 'active'),
        (SELECT COUNT(*) FROM public.blockers WHERE company_id = company_uuid),
        (SELECT COUNT(*) FROM public.blockers WHERE company_id = company_uuid AND status = 'open'),
        (SELECT COUNT(*) FROM public.blockers WHERE company_id = company_uuid AND status = 'assigned'),
        (SELECT COUNT(*) FROM public.blockers WHERE company_id = company_uuid AND status = 'resolved'),
        (SELECT COUNT(*) FROM public.user_profiles WHERE company_id = company_uuid),
        (SELECT COUNT(*) FROM public.user_profiles WHERE company_id = company_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS TABLE (
    total_blockers BIGINT,
    open_blockers BIGINT,
    assigned_blockers BIGINT,
    in_progress_blockers BIGINT,
    resolved_blockers BIGINT,
    critical_blockers BIGINT,
    high_priority_blockers BIGINT,
    total_drawings BIGINT,
    avg_resolution_time INTERVAL
) AS $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Get user's company ID
    SELECT company_id INTO company_uuid
    FROM public.user_profiles
    WHERE id = auth.uid();

    IF company_uuid IS NULL THEN
        RAISE EXCEPTION 'User not associated with any company';
    END IF;

    -- Verify project belongs to user's company
    IF NOT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_uuid AND company_id = company_uuid
    ) THEN
        RAISE EXCEPTION 'Project not found or access denied';
    END IF;

    -- Return project statistics
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND status = 'open'),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND status = 'assigned'),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND status = 'in_progress'),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND status = 'resolved'),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND priority = 'critical'),
        (SELECT COUNT(*) FROM public.blockers WHERE project_id = project_uuid AND priority = 'high'),
        (SELECT COUNT(*) FROM public.site_drawings WHERE project_id = project_uuid AND is_active = true),
        (SELECT AVG(resolved_at - created_at) FROM public.blockers
         WHERE project_id = project_uuid AND resolved_at IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity for company
CREATE OR REPLACE FUNCTION get_company_recent_activity(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    title TEXT,
    description TEXT,
    user_name TEXT,
    project_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Get user's company ID
    SELECT company_id INTO company_uuid
    FROM public.user_profiles
    WHERE id = auth.uid();

    IF company_uuid IS NULL THEN
        RAISE EXCEPTION 'User not associated with any company';
    END IF;

    -- Return recent activity
    RETURN QUERY
    SELECT
        b.id,
        'blocker_created'::TEXT as activity_type,
        b.title,
        b.description,
        up.name as user_name,
        p.name as project_name,
        b.created_at
    FROM public.blockers b
    JOIN public.user_profiles up ON b.created_by = up.id
    JOIN public.projects p ON b.project_id = p.id
    WHERE b.company_id = company_uuid

    UNION ALL

    SELECT
        bsh.blocker_id as id,
        'status_change'::TEXT as activity_type,
        bsh.action as title,
        bsh.notes as description,
        bsh.user_name,
        p.name as project_name,
        bsh.created_at
    FROM public.blocker_status_history bsh
    JOIN public.blockers b ON bsh.blocker_id = b.id
    JOIN public.projects p ON b.project_id = p.id
    WHERE bsh.company_id = company_uuid

    UNION ALL

    SELECT
        sd.id,
        'drawing_uploaded'::TEXT as activity_type,
        sd.name as title,
        CONCAT('Uploaded ', sd.filename) as description,
        up.name as user_name,
        p.name as project_name,
        sd.created_at
    FROM public.site_drawings sd
    JOIN public.user_profiles up ON sd.uploaded_by = up.id
    JOIN public.projects p ON sd.project_id = p.id
    WHERE sd.company_id = company_uuid AND sd.is_active = true

    ORDER BY created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance on multi-tenant queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug_active ON public.companies(slug) WHERE plan != 'cancelled';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_company_status ON public.projects(company_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_company_active ON public.user_profiles(company_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockers_company_project ON public.blockers(company_id, project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blockers_company_status_priority ON public.blockers(company_id, status, priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_drawings_company_project ON public.site_drawings(company_id, project_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contractors_company_active ON public.contractors(company_id) WHERE is_active = true;

-- Grant necessary permissions for RLS functions
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_company_admin_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_supervisor_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_recent_activity(INTEGER) TO authenticated;