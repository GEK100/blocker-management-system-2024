-- Construction Blocker Management Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('worker', 'supervisor', 'admin');
CREATE TYPE blocker_status AS ENUM ('open', 'assigned', 'resolved', 'closed');
CREATE TYPE blocker_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table (extends auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'worker',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors table
CREATE TABLE public.contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- electrical, plumbing, general, structural, flooring
    contact_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site drawings table
CREATE TABLE public.site_drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    floor_level TEXT, -- Ground Floor, 1st Floor, etc.
    uploaded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockers table
CREATE TABLE public.blockers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history table
CREATE TABLE public.blocker_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES public.blockers(id) ON DELETE CASCADE,
    status blocker_status NOT NULL,
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id),
    user_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations table (for user invitations)
CREATE TABLE public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    role user_role DEFAULT 'worker',
    message TEXT,
    invited_by UUID REFERENCES public.user_profiles(id),
    token TEXT UNIQUE DEFAULT gen_random_uuid(),
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_blockers_created_by ON public.blockers(created_by);
CREATE INDEX idx_blockers_assigned_to ON public.blockers(assigned_to);
CREATE INDEX idx_blockers_status ON public.blockers(status);
CREATE INDEX idx_blockers_priority ON public.blockers(priority);
CREATE INDEX idx_blockers_created_at ON public.blockers(created_at);
CREATE INDEX idx_status_history_blocker_id ON public.blocker_status_history(blocker_id);
CREATE INDEX idx_status_history_created_at ON public.blocker_status_history(created_at);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocker_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Profiles: Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Contractors: All authenticated users can read, only admins can modify
CREATE POLICY "All users can view contractors" ON public.contractors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage contractors" ON public.contractors FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Site Drawings: All authenticated users can read, supervisors+ can upload
CREATE POLICY "All users can view drawings" ON public.site_drawings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supervisors can upload drawings" ON public.site_drawings FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);
CREATE POLICY "Supervisors can manage drawings" ON public.site_drawings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

-- Blockers: Users can see all blockers, create their own, supervisors can assign
CREATE POLICY "All users can view blockers" ON public.blockers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create blockers" ON public.blockers FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Supervisors can assign blockers" ON public.blockers FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    ) OR (
        -- Users from assigned contractor can resolve
        assigned_to IN (
            SELECT c.id FROM public.contractors c
            JOIN public.user_profiles up ON up.company = c.name
            WHERE up.id = auth.uid()
        )
    )
);

-- Status History: All authenticated users can view, system creates entries
CREATE POLICY "All users can view status history" ON public.blocker_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert status history" ON public.blocker_status_history FOR INSERT WITH CHECK (true);

-- Invitations: Only admins can manage
CREATE POLICY "Admins can manage invitations" ON public.invitations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create functions for automatic ticket number generation
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part INTEGER;
    ticket_num TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;

    SELECT COALESCE(MAX(
        CASE
            WHEN ticket_number ~ '^BLK-[0-9]{4}-[0-9]{3}$'
            THEN (split_part(ticket_number, '-', 3))::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_part
    FROM public.blockers
    WHERE ticket_number LIKE 'BLK-' || year_part || '-%';

    ticket_num := 'BLK-' || year_part || '-' || LPAD(sequence_part::TEXT, 3, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON public.blockers
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Function to create status history entries
CREATE OR REPLACE FUNCTION create_status_history_entry()
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
            blocker_id,
            status,
            action,
            user_id,
            user_name
        ) VALUES (
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
            blocker_id,
            status,
            action,
            user_id,
            user_name
        ) VALUES (
            NEW.id,
            NEW.status,
            CASE
                WHEN NEW.status = 'assigned' THEN 'Blocker assigned to contractor'
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

CREATE TRIGGER trigger_create_status_history
    AFTER INSERT OR UPDATE ON public.blockers
    FOR EACH ROW
    EXECUTE FUNCTION create_status_history_entry();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
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

-- Insert initial contractors data
INSERT INTO public.contractors (name, type, contact_email, phone) VALUES
('ABC Electrical Ltd', 'electrical', 'john@abcelectrical.com', '+44 7700 900001'),
('PlumbPro Services', 'plumbing', 'info@plumbpro.com', '+44 7700 900002'),
('BuildRight Construction', 'general', 'jobs@buildright.com', '+44 7700 900003'),
('SteelWorks Ltd', 'structural', 'contact@steelworks.com', '+44 7700 900004'),
('FloorMasters', 'flooring', 'bookings@floormasters.com', '+44 7700 900005');