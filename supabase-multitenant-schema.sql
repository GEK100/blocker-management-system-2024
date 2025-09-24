-- Multi-Tenant Construction Blocker Management Database Schema
-- Complete data isolation between companies with projects support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'supervisor', 'worker');
CREATE TYPE company_plan AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE blocker_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE blocker_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');

-- 1. Companies table (top-level tenant isolation)
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    plan company_plan DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects table (sub-tenant within companies)
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    status project_status DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure project names are unique within a company
    UNIQUE(company_id, name)
);

-- 3. User profiles table (extends auth.users with company context)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'worker',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- A user can only belong to one company
    UNIQUE(email, company_id)
);

-- 4. Contractors table (company-specific)
CREATE TABLE public.contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- electrical, plumbing, general, structural, etc.
    contact_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contractor names must be unique within a company
    UNIQUE(company_id, name)
);

-- 5. Site drawings table (project-specific)
CREATE TABLE public.site_drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    floor_level TEXT, -- Ground Floor, 1st Floor, etc.
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Drawing names must be unique within a project
    UNIQUE(project_id, name, version)
);

-- 6. Blockers table (project-specific with company isolation)
CREATE TABLE public.blockers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    location_x INTEGER,
    location_y INTEGER,
    floor TEXT,
    status blocker_status DEFAULT 'open',
    priority blocker_priority DEFAULT 'medium',
    created_by UUID REFERENCES public.user_profiles(id) NOT NULL,
    assigned_to UUID REFERENCES public.contractors(id),
    resolved_by UUID REFERENCES public.user_profiles(id),
    due_date TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ticket numbers must be unique within a company
    UNIQUE(company_id, ticket_number)
);

-- 7. Status history table (complete audit trail)
CREATE TABLE public.blocker_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    blocker_id UUID REFERENCES public.blockers(id) ON DELETE CASCADE,
    status blocker_status NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id),
    user_name TEXT NOT NULL,
    notes TEXT,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invitations table (company-specific)
CREATE TABLE public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'worker',
    message TEXT,
    invited_by UUID REFERENCES public.user_profiles(id),
    token TEXT UNIQUE DEFAULT gen_random_uuid(),
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate invitations
    UNIQUE(company_id, email)
);

-- 9. User sessions table (track active users per company)
CREATE TABLE public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    session_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_status ON public.projects(company_id, status);

CREATE INDEX idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(company_id, role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX idx_contractors_company_id ON public.contractors(company_id);
CREATE INDEX idx_contractors_type ON public.contractors(company_id, type);

CREATE INDEX idx_site_drawings_project_id ON public.site_drawings(project_id);
CREATE INDEX idx_site_drawings_company_id ON public.site_drawings(company_id);

CREATE INDEX idx_blockers_company_id ON public.blockers(company_id);
CREATE INDEX idx_blockers_project_id ON public.blockers(project_id);
CREATE INDEX idx_blockers_created_by ON public.blockers(created_by);
CREATE INDEX idx_blockers_assigned_to ON public.blockers(assigned_to);
CREATE INDEX idx_blockers_status ON public.blockers(company_id, status);
CREATE INDEX idx_blockers_priority ON public.blockers(company_id, priority);
CREATE INDEX idx_blockers_created_at ON public.blockers(company_id, created_at DESC);

CREATE INDEX idx_status_history_company_id ON public.blocker_status_history(company_id);
CREATE INDEX idx_status_history_blocker_id ON public.blocker_status_history(blocker_id);
CREATE INDEX idx_status_history_created_at ON public.blocker_status_history(company_id, created_at DESC);

CREATE INDEX idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_company_id ON public.user_sessions(company_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocker_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Helper Functions
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_company_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'owner'
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_company_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('owner', 'admin')
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('owner', 'admin', 'supervisor')
        FROM public.user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Companies: Users can only see their own company
CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (id = get_user_company_id());

CREATE POLICY "Company owners can update their company" ON public.companies
FOR UPDATE USING (id = get_user_company_id() AND is_company_owner());

-- Projects: Complete isolation by company
CREATE POLICY "Users can view company projects" ON public.projects
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Admins can manage company projects" ON public.projects
FOR ALL USING (company_id = get_user_company_id() AND is_company_admin_or_above());

-- User Profiles: Users can view company users, manage own profile
CREATE POLICY "Users can view company profiles" ON public.user_profiles
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage company users" ON public.user_profiles
FOR ALL USING (company_id = get_user_company_id() AND is_company_admin_or_above());

-- Contractors: Company-specific access
CREATE POLICY "Users can view company contractors" ON public.contractors
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Admins can manage company contractors" ON public.contractors
FOR ALL USING (company_id = get_user_company_id() AND is_company_admin_or_above());

-- Site Drawings: Project and company isolation
CREATE POLICY "Users can view project drawings" ON public.site_drawings
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Supervisors can upload drawings" ON public.site_drawings
FOR INSERT WITH CHECK (
    company_id = get_user_company_id() AND
    is_supervisor_or_above()
);

CREATE POLICY "Supervisors can manage drawings" ON public.site_drawings
FOR ALL USING (company_id = get_user_company_id() AND is_supervisor_or_above());

-- Blockers: Project and company isolation with role-based access
CREATE POLICY "Users can view company blockers" ON public.blockers
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create blockers" ON public.blockers
FOR INSERT WITH CHECK (
    company_id = get_user_company_id() AND
    created_by = auth.uid()
);

CREATE POLICY "Users can update own blockers" ON public.blockers
FOR UPDATE USING (
    company_id = get_user_company_id() AND
    (created_by = auth.uid() OR is_supervisor_or_above())
);

-- Status History: Company isolation, system managed
CREATE POLICY "Users can view company status history" ON public.blocker_status_history
FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "System can insert status history" ON public.blocker_status_history
FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Invitations: Admin-only access
CREATE POLICY "Admins can manage invitations" ON public.invitations
FOR ALL USING (company_id = get_user_company_id() AND is_company_admin_or_above());

-- User Sessions: Own sessions only
CREATE POLICY "Users can view own sessions" ON public.user_sessions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for automatic data management

-- Generate ticket numbers per company
CREATE OR REPLACE FUNCTION generate_company_ticket_number(company_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part INTEGER;
    ticket_num TEXT;
    company_prefix TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Get company slug for prefix
    SELECT UPPER(LEFT(slug, 3)) INTO company_prefix
    FROM public.companies
    WHERE id = company_uuid;

    -- Get next sequence number for this company
    SELECT COALESCE(MAX(
        CASE
            WHEN ticket_number ~ ('^' || company_prefix || '-' || year_part || '-[0-9]{3}$')
            THEN (split_part(ticket_number, '-', 3))::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_part
    FROM public.blockers
    WHERE company_id = company_uuid
    AND ticket_number LIKE company_prefix || '-' || year_part || '-%';

    ticket_num := company_prefix || '-' || year_part || '-' || LPAD(sequence_part::TEXT, 3, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_company_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_company_ticket_number(NEW.company_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_company_ticket_number
    BEFORE INSERT ON public.blockers
    FOR EACH ROW
    EXECUTE FUNCTION set_company_ticket_number();

-- Function to create status history entries
CREATE OR REPLACE FUNCTION create_company_status_history_entry()
RETURNS TRIGGER AS $$
DECLARE
    user_name_val TEXT;
BEGIN
    -- Get user name
    SELECT name INTO user_name_val
    FROM public.user_profiles
    WHERE id = COALESCE(NEW.created_by, NEW.resolved_by);

    -- Insert status history for new blockers
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.blocker_status_history (
            company_id,
            blocker_id,
            status,
            action,
            user_id,
            user_name
        ) VALUES (
            NEW.company_id,
            NEW.id,
            NEW.status,
            'Blocker created and submitted',
            NEW.created_by,
            COALESCE(user_name_val, 'Unknown User')
        );
        RETURN NEW;
    END IF;

    -- Insert status history for status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO public.blocker_status_history (
            company_id,
            blocker_id,
            status,
            action,
            user_id,
            user_name
        ) VALUES (
            NEW.company_id,
            NEW.id,
            NEW.status,
            CASE
                WHEN NEW.status = 'assigned' THEN 'Blocker assigned to contractor'
                WHEN NEW.status = 'in_progress' THEN 'Work started on blocker'
                WHEN NEW.status = 'resolved' THEN 'Blocker marked as resolved'
                WHEN NEW.status = 'closed' THEN 'Blocker closed'
                ELSE 'Status updated to ' || NEW.status
            END,
            COALESCE(NEW.resolved_by, NEW.created_by),
            COALESCE(user_name_val, 'System')
        );
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_company_status_history
    AFTER INSERT OR UPDATE ON public.blockers
    FOR EACH ROW
    EXECUTE FUNCTION create_company_status_history_entry();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_contractors_updated_at
    BEFORE UPDATE ON public.contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_site_drawings_updated_at
    BEFORE UPDATE ON public.site_drawings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_blockers_updated_at
    BEFORE UPDATE ON public.blockers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert sample data

-- Sample companies
INSERT INTO public.companies (id, name, slug, email, plan) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Construction Ltd', 'acme-construction', 'admin@acmeconstruction.com', 'professional'),
('22222222-2222-2222-2222-222222222222', 'BuildCorp International', 'buildcorp-intl', 'admin@buildcorp.com', 'enterprise'),
('33333333-3333-3333-3333-333333333333', 'Metro Developers', 'metro-developers', 'admin@metrodev.com', 'basic');

-- Sample projects
INSERT INTO public.projects (company_id, name, description, status, address) VALUES
('11111111-1111-1111-1111-111111111111', 'Downtown Office Complex', 'Modern 15-story office building in city center', 'active', '123 Business District, Downtown'),
('11111111-1111-1111-1111-111111111111', 'Riverside Apartments', 'Luxury residential complex with 200 units', 'planning', '456 Riverside Drive'),
('22222222-2222-2222-2222-222222222222', 'Metro Hospital Extension', 'New wing addition to existing hospital', 'active', '789 Health Plaza'),
('33333333-3333-3333-3333-333333333333', 'Shopping Mall Renovation', 'Complete renovation of existing shopping center', 'on_hold', '321 Retail Avenue');

-- Sample contractors for each company
INSERT INTO public.contractors (company_id, name, type, contact_email, phone) VALUES
-- Acme Construction contractors
('11111111-1111-1111-1111-111111111111', 'ABC Electrical Ltd', 'electrical', 'john@abcelectrical.com', '+44 7700 900001'),
('11111111-1111-1111-1111-111111111111', 'PlumbPro Services', 'plumbing', 'info@plumbpro.com', '+44 7700 900002'),
('11111111-1111-1111-1111-111111111111', 'SteelWorks Ltd', 'structural', 'contact@steelworks.com', '+44 7700 900003'),

-- BuildCorp contractors
('22222222-2222-2222-2222-222222222222', 'ElectroTech Solutions', 'electrical', 'service@electrotech.com', '+44 7700 900011'),
('22222222-2222-2222-2222-222222222222', 'Hydroflow Systems', 'plumbing', 'info@hydroflow.com', '+44 7700 900012'),

-- Metro Developers contractors
('33333333-3333-3333-3333-333333333333', 'City Electrical', 'electrical', 'admin@cityelectrical.com', '+44 7700 900021'),
('33333333-3333-3333-3333-333333333333', 'QuickFix Plumbing', 'plumbing', 'help@quickfix.com', '+44 7700 900022');