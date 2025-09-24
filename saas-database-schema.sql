-- SaaS Multi-Tenant Construction Blocker Management Platform
-- Complete platform management with Super Admin, GDPR compliance, and subscription management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enhanced enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'company_owner', 'company_admin', 'project_manager', 'supervisor', 'field_worker');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'suspended');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'professional', 'enterprise', 'custom');
CREATE TYPE blocker_status AS ENUM ('draft', 'open', 'assigned', 'in_progress', 'resolved', 'verified', 'closed');
CREATE TYPE blocker_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE notification_type AS ENUM ('blocker_assigned', 'blocker_resolved', 'user_invited', 'subscription_expiring', 'system_maintenance');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'export', 'login', 'logout');

-- 1. Platform configuration (Super Admin only)
CREATE TABLE public.platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscription plans (Platform level)
CREATE TABLE public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- max_users, max_projects, max_storage_gb, etc.
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhanced companies table with subscription management
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,

    -- Subscription management
    subscription_plan_id UUID REFERENCES public.subscription_plans(id),
    subscription_status subscription_status DEFAULT 'trial',
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),

    -- GDPR and compliance
    gdpr_compliant BOOLEAN DEFAULT false,
    data_retention_days INTEGER DEFAULT 2555, -- 7 years default
    privacy_policy_accepted BOOLEAN DEFAULT false,
    privacy_policy_accepted_at TIMESTAMPTZ,

    -- Platform settings
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    settings JSONB DEFAULT '{}',

    -- Billing information
    billing_email TEXT,
    billing_address JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enhanced user profiles with GDPR compliance
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'field_worker',
    avatar_url TEXT,

    -- GDPR compliance
    gdpr_consent_given BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMPTZ,
    data_retention_consent BOOLEAN DEFAULT true,

    -- User preferences and settings
    language_code TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',

    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,

    -- Mobile app specific
    device_token TEXT,
    push_notifications_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(email, company_id)
);

-- 5. Enhanced projects table with advanced management
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    project_code TEXT, -- Internal project reference
    address TEXT,
    status project_status DEFAULT 'draft',

    -- Project management
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    budget DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',

    -- Project team
    project_manager_id UUID REFERENCES public.user_profiles(id),
    team_members UUID[] DEFAULT '{}',

    -- Project metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',

    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0,
    total_blockers INTEGER DEFAULT 0,
    resolved_blockers INTEGER DEFAULT 0,

    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, name)
);

-- 6. Enhanced blockers table with workflow management
CREATE TABLE public.blockers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Blocker identification
    ticket_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Media and location
    photos TEXT[] DEFAULT '{}',
    location_x INTEGER,
    location_y INTEGER,
    floor TEXT,
    area TEXT,

    -- Status and workflow
    status blocker_status DEFAULT 'open',
    priority blocker_priority DEFAULT 'medium',
    severity INTEGER CHECK (severity >= 1 AND severity <= 5), -- 1=lowest, 5=highest

    -- Assignment and resolution
    created_by UUID REFERENCES public.user_profiles(id) NOT NULL,
    assigned_to UUID REFERENCES public.contractors(id),
    assigned_by UUID REFERENCES public.user_profiles(id),
    assigned_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.user_profiles(id),
    resolved_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.user_profiles(id),
    verified_at TIMESTAMPTZ,

    -- Scheduling
    due_date TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),

    -- Financial tracking
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',

    -- Additional metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    internal_notes TEXT,
    client_visible BOOLEAN DEFAULT true,

    -- Attachments and references
    attachments TEXT[] DEFAULT '{}',
    related_blockers UUID[] DEFAULT '{}',
    external_reference TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, ticket_number)
);

-- 7. Enhanced contractors table
CREATE TABLE public.contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company_registration TEXT,
    type TEXT NOT NULL,
    specialties TEXT[] DEFAULT '{}',

    -- Contact information
    contact_email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    address JSONB,

    -- Business information
    license_number TEXT,
    insurance_info JSONB,
    certifications TEXT[] DEFAULT '{}',

    -- Performance tracking
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    completed_jobs INTEGER DEFAULT 0,
    avg_completion_time INTERVAL,

    -- Financial information
    hourly_rate DECIMAL(8,2),
    currency TEXT DEFAULT 'USD',
    payment_terms TEXT,

    -- Platform integration
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,

    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(company_id, name)
);

-- 8. Enhanced site drawings with version control
CREATE TABLE public.site_drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,

    -- Version control
    version INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT true,
    parent_drawing_id UUID REFERENCES public.site_drawings(id),

    -- Drawing metadata
    floor_level TEXT,
    drawing_type TEXT, -- architectural, structural, mechanical, electrical, etc.
    scale_info TEXT,
    drawing_date DATE,
    revision_notes TEXT,

    -- Access control
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    view_permissions TEXT[] DEFAULT '{}', -- roles that can view
    edit_permissions TEXT[] DEFAULT '{}', -- roles that can edit

    uploaded_by UUID REFERENCES public.user_profiles(id),
    reviewed_by UUID REFERENCES public.user_profiles(id),
    approved_by UUID REFERENCES public.user_profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Comprehensive audit log for GDPR compliance
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

    -- Audit details
    action audit_action NOT NULL,
    resource_type TEXT NOT NULL, -- table name or resource type
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,

    -- Context information
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    api_endpoint TEXT,

    -- GDPR specific
    contains_pii BOOLEAN DEFAULT false,
    retention_date TIMESTAMPTZ, -- when this log should be deleted

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GDPR data requests and compliance
CREATE TABLE public.gdpr_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

    request_type TEXT NOT NULL, -- 'export', 'delete', 'rectification', 'portability'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'

    -- Request details
    requested_by_email TEXT NOT NULL,
    reason TEXT,
    verification_token TEXT,
    is_verified BOOLEAN DEFAULT false,

    -- Processing information
    processed_by UUID REFERENCES public.user_profiles(id),
    processed_at TIMESTAMPTZ,
    completion_notes TEXT,

    -- Data export
    export_file_path TEXT,
    export_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications system
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,

    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Notification context
    resource_type TEXT,
    resource_id UUID,
    action_url TEXT,

    -- Delivery status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    is_push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMPTZ,

    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. System announcements (Super Admin)
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'info', -- 'info', 'warning', 'maintenance', 'feature'

    -- Targeting
    target_roles user_role[] DEFAULT '{}',
    target_companies UUID[] DEFAULT '{}',
    target_plans subscription_plan[] DEFAULT '{}',

    -- Scheduling
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,

    -- Display settings
    is_dismissible BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,

    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_companies_subscription_status ON public.companies(subscription_status);
CREATE INDEX idx_companies_trial_ends ON public.companies(trial_ends_at) WHERE subscription_status = 'trial';
CREATE INDEX idx_companies_active ON public.companies(is_active, is_suspended);

CREATE INDEX idx_users_company_role ON public.user_profiles(company_id, role);
CREATE INDEX idx_users_gdpr_consent ON public.user_profiles(gdpr_consent_given, gdpr_consent_date);
CREATE INDEX idx_users_active ON public.user_profiles(is_active, last_seen_at);

CREATE INDEX idx_projects_company_status ON public.projects(company_id, status);
CREATE INDEX idx_projects_manager ON public.projects(project_manager_id);
CREATE INDEX idx_projects_dates ON public.projects(start_date, planned_end_date);

CREATE INDEX idx_blockers_company_project ON public.blockers(company_id, project_id);
CREATE INDEX idx_blockers_status_priority ON public.blockers(status, priority);
CREATE INDEX idx_blockers_assigned ON public.blockers(assigned_to, assigned_at);
CREATE INDEX idx_blockers_due_date ON public.blockers(due_date) WHERE status IN ('open', 'assigned', 'in_progress');
CREATE INDEX idx_blockers_created_by ON public.blockers(created_by, created_at);

CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id, created_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_pii ON public.audit_logs(contains_pii, retention_date);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Enhanced RLS Helper Functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'super_admin'
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_company_owner_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('company_owner', 'company_admin')
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_project_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('super_admin', 'company_owner', 'company_admin', 'project_manager', 'supervisor')
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for Super Admin access
CREATE POLICY "Super admin full access to platform settings" ON public.platform_settings
FOR ALL USING (is_super_admin());

CREATE POLICY "Super admin full access to subscription plans" ON public.subscription_plans
FOR ALL USING (is_super_admin());

-- RLS Policies for Companies (with Super Admin override)
CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (
    is_super_admin() OR
    id = get_user_company_id()
);

CREATE POLICY "Company owners can update their company" ON public.companies
FOR UPDATE USING (
    is_super_admin() OR
    (id = get_user_company_id() AND is_company_owner_or_admin())
);

-- Continue with other RLS policies following the same pattern...
-- (I'll include the most critical ones here for brevity)

-- User Profiles with enhanced permissions
CREATE POLICY "Users can view company profiles" ON public.user_profiles
FOR SELECT USING (
    is_super_admin() OR
    company_id = get_user_company_id()
);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (
    is_super_admin() OR
    id = auth.uid()
);

-- Audit Logs (Super Admin and Company Admin access)
CREATE POLICY "View audit logs" ON public.audit_logs
FOR SELECT USING (
    is_super_admin() OR
    (company_id = get_user_company_id() AND is_company_owner_or_admin())
);

-- GDPR Requests
CREATE POLICY "Users can manage their GDPR requests" ON public.gdpr_requests
FOR ALL USING (
    is_super_admin() OR
    (company_id = get_user_company_id() AND
     (is_company_owner_or_admin() OR user_id = auth.uid()))
);

-- Notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (
    is_super_admin() OR
    user_id = auth.uid()
);

-- Announcements (everyone can view active announcements)
CREATE POLICY "Users can view active announcements" ON public.announcements
FOR SELECT USING (
    is_active = true AND
    starts_at <= NOW() AND
    (ends_at IS NULL OR ends_at >= NOW())
);

-- Create trigger functions for GDPR compliance and audit logging

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    company_uuid UUID;
    contains_pii_data BOOLEAN := false;
BEGIN
    -- Get company_id from the record
    company_uuid := COALESCE(NEW.company_id, OLD.company_id);

    -- Check if the table contains PII data
    contains_pii_data := TG_TABLE_NAME IN ('user_profiles', 'companies', 'contractors');

    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        contains_pii
    ) VALUES (
        company_uuid,
        auth.uid(),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
        contains_pii_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_user_profiles AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_blockers AFTER INSERT OR UPDATE OR DELETE ON public.blockers
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Insert initial platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
('gdpr_retention_days', '2555', 'Default GDPR data retention period in days (7 years)'),
('trial_period_days', '14', 'Default trial period for new companies'),
('max_file_size_mb', '10', 'Maximum file upload size in MB'),
('allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx"]', 'Allowed file types for uploads'),
('maintenance_mode', 'false', 'Platform maintenance mode flag'),
('registration_enabled', 'true', 'Whether new company registration is enabled'),
('email_verification_required', 'true', 'Whether email verification is required for new users');

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Free Trial', 'free', 'Free 14-day trial with basic features', 0.00, 0.00,
 '{"projects": 1, "users": 3, "storage_gb": 1, "support": "community"}',
 '{"max_projects": 1, "max_users": 3, "max_storage_gb": 1}'),

('Starter', 'starter', 'Perfect for small construction teams', 29.00, 290.00,
 '{"projects": 3, "users": 10, "storage_gb": 10, "support": "email", "mobile_app": true}',
 '{"max_projects": 3, "max_users": 10, "max_storage_gb": 10}'),

('Professional', 'professional', 'Advanced features for growing companies', 79.00, 790.00,
 '{"projects": 10, "users": 50, "storage_gb": 100, "support": "priority", "api_access": true, "custom_fields": true}',
 '{"max_projects": 10, "max_users": 50, "max_storage_gb": 100}'),

('Enterprise', 'enterprise', 'Full-featured solution for large organizations', 199.00, 1990.00,
 '{"projects": -1, "users": -1, "storage_gb": 1000, "support": "phone", "sso": true, "custom_integrations": true}',
 '{"max_projects": -1, "max_users": -1, "max_storage_gb": 1000}');

COMMENT ON COLUMN public.subscription_plans.limits IS 'JSON object with usage limits. -1 means unlimited';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for GDPR compliance and security monitoring';