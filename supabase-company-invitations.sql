-- Company Invitations System for Multi-Tenant Platform
-- Handles super admin company creation and invitation flows

-- 1. Company invitations table (for super admin created companies)
CREATE TABLE public.company_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'company_owner',

    -- Invitation metadata
    invitation_token TEXT UNIQUE NOT NULL,
    invited_by_super_admin BOOLEAN DEFAULT false,
    invited_by UUID REFERENCES public.user_profiles(id), -- null if super admin
    invitation_data JSONB DEFAULT '{}', -- setup instructions, company info, etc.

    -- Status tracking
    is_accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id),

    -- Expiration
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate invitations
    UNIQUE(company_id, email)
);

-- 2. User invitations table (enhanced version for company-level invitations)
CREATE TABLE public.user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

    -- Invitation details
    email TEXT NOT NULL,
    role user_role DEFAULT 'field_worker',
    invited_by UUID REFERENCES public.user_profiles(id) NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,

    -- Invitation content
    personal_message TEXT,
    permissions JSONB DEFAULT '{}',

    -- Status tracking
    is_accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id),

    -- Email tracking
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,

    -- Expiration
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate invitations per company
    UNIQUE(company_id, email)
);

-- 3. Registration tokens table (for secure user registration)
CREATE TABLE public.registration_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Token metadata
    token_type TEXT NOT NULL, -- 'company_setup', 'user_invitation'
    user_email TEXT NOT NULL,
    user_role user_role NOT NULL,

    -- Token data
    registration_data JSONB DEFAULT '{}',

    -- Usage tracking
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id),

    -- Security
    ip_address INET,
    user_agent TEXT,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_company_invitations_token ON public.company_invitations(invitation_token);
CREATE INDEX idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX idx_company_invitations_company ON public.company_invitations(company_id);
CREATE INDEX idx_company_invitations_expires ON public.company_invitations(expires_at) WHERE is_accepted = false;

CREATE INDEX idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_company ON public.user_invitations(company_id);
CREATE INDEX idx_user_invitations_expires ON public.user_invitations(expires_at) WHERE is_accepted = false;

CREATE INDEX idx_registration_tokens_token ON public.registration_tokens(token);
CREATE INDEX idx_registration_tokens_email ON public.registration_tokens(user_email);
CREATE INDEX idx_registration_tokens_expires ON public.registration_tokens(expires_at) WHERE is_used = false;

-- Enable RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Company Invitations
CREATE POLICY "Super admin can manage all company invitations" ON public.company_invitations
FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view company invitations they're invited to" ON public.company_invitations
FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    is_super_admin()
);

-- RLS Policies for User Invitations
CREATE POLICY "Company admins can manage their company invitations" ON public.user_invitations
FOR ALL USING (
    is_super_admin() OR
    (company_id = get_user_company_id() AND is_company_owner_or_admin())
);

CREATE POLICY "Users can view invitations sent to them" ON public.user_invitations
FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    is_super_admin() OR
    (company_id = get_user_company_id() AND is_company_owner_or_admin())
);

-- RLS Policies for Registration Tokens
CREATE POLICY "Anyone can view valid registration tokens" ON public.registration_tokens
FOR SELECT USING (
    is_used = false AND expires_at > NOW()
);

CREATE POLICY "Super admin can manage all registration tokens" ON public.registration_tokens
FOR ALL USING (is_super_admin());

-- Functions for invitation management

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 64)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create company invitation with token
CREATE OR REPLACE FUNCTION create_company_invitation(
    company_uuid UUID,
    invitation_email TEXT,
    invitation_role user_role DEFAULT 'company_owner',
    super_admin_invite BOOLEAN DEFAULT false
)
RETURNS TABLE(invitation_id UUID, token TEXT) AS $$
DECLARE
    new_token TEXT;
    invitation_record RECORD;
BEGIN
    -- Generate secure token
    new_token := generate_secure_token(64);

    -- Create invitation
    INSERT INTO public.company_invitations (
        company_id,
        email,
        role,
        invitation_token,
        invited_by_super_admin,
        invited_by,
        expires_at
    ) VALUES (
        company_uuid,
        invitation_email,
        invitation_role,
        new_token,
        super_admin_invite,
        CASE WHEN super_admin_invite THEN NULL ELSE auth.uid() END,
        NOW() + INTERVAL '7 days'
    )
    RETURNING id, invitation_token INTO invitation_record;

    -- Also create registration token
    INSERT INTO public.registration_tokens (
        token,
        company_id,
        token_type,
        user_email,
        user_role,
        expires_at
    ) VALUES (
        new_token,
        company_uuid,
        'company_setup',
        invitation_email,
        invitation_role,
        NOW() + INTERVAL '7 days'
    );

    RETURN QUERY SELECT invitation_record.id, invitation_record.invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user invitation
CREATE OR REPLACE FUNCTION create_user_invitation(
    company_uuid UUID,
    invitation_email TEXT,
    invitation_role user_role DEFAULT 'field_worker',
    project_uuid UUID DEFAULT NULL,
    personal_msg TEXT DEFAULT NULL
)
RETURNS TABLE(invitation_id UUID, token TEXT) AS $$
DECLARE
    new_token TEXT;
    invitation_record RECORD;
BEGIN
    -- Generate secure token
    new_token := generate_secure_token(64);

    -- Create invitation
    INSERT INTO public.user_invitations (
        company_id,
        project_id,
        email,
        role,
        invited_by,
        invitation_token,
        personal_message,
        expires_at
    ) VALUES (
        company_uuid,
        project_uuid,
        invitation_email,
        invitation_role,
        auth.uid(),
        new_token,
        personal_msg,
        NOW() + INTERVAL '7 days'
    )
    RETURNING id, invitation_token INTO invitation_record;

    -- Also create registration token
    INSERT INTO public.registration_tokens (
        token,
        company_id,
        token_type,
        user_email,
        user_role,
        registration_data,
        expires_at
    ) VALUES (
        new_token,
        company_uuid,
        'user_invitation',
        invitation_email,
        invitation_role,
        jsonb_build_object(
            'project_id', project_uuid,
            'personal_message', personal_msg
        ),
        NOW() + INTERVAL '7 days'
    );

    RETURN QUERY SELECT invitation_record.id, invitation_record.invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation and create user profile
CREATE OR REPLACE FUNCTION accept_invitation_and_create_profile(
    invitation_token TEXT,
    user_name TEXT,
    user_phone TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, company_id UUID, user_role user_role) AS $$
DECLARE
    token_record RECORD;
    user_uuid UUID;
    current_email TEXT;
BEGIN
    -- Get current user
    user_uuid := auth.uid();
    SELECT email INTO current_email FROM auth.users WHERE id = user_uuid;

    -- Validate and get token
    SELECT * INTO token_record
    FROM public.registration_tokens
    WHERE token = invitation_token
    AND user_email = current_email
    AND is_used = false
    AND expires_at > NOW();

    IF token_record IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::user_role;
        RETURN;
    END IF;

    -- Mark token as used
    UPDATE public.registration_tokens
    SET is_used = true,
        used_at = NOW(),
        used_by = user_uuid
    WHERE id = token_record.id;

    -- Create user profile
    INSERT INTO public.user_profiles (
        id,
        company_id,
        email,
        name,
        phone,
        role,
        is_active,
        is_verified
    ) VALUES (
        user_uuid,
        token_record.company_id,
        current_email,
        user_name,
        user_phone,
        token_record.user_role,
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        company_id = token_record.company_id,
        name = user_name,
        phone = COALESCE(user_phone, user_profiles.phone),
        role = token_record.user_role,
        is_active = true,
        is_verified = true;

    -- Mark invitations as accepted
    UPDATE public.company_invitations
    SET is_accepted = true,
        accepted_at = NOW(),
        accepted_by = user_uuid
    WHERE company_id = token_record.company_id
    AND email = current_email;

    UPDATE public.user_invitations
    SET is_accepted = true,
        accepted_at = NOW(),
        accepted_by = user_uuid
    WHERE company_id = token_record.company_id
    AND email = current_email;

    RETURN QUERY SELECT true, token_record.company_id, token_record.user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Delete expired company invitations
    DELETE FROM public.company_invitations
    WHERE expires_at < NOW()
    AND is_accepted = false;

    GET DIAGNOSTICS cleanup_count = ROW_COUNT;

    -- Delete expired user invitations
    DELETE FROM public.user_invitations
    WHERE expires_at < NOW()
    AND is_accepted = false;

    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;

    -- Delete expired registration tokens
    DELETE FROM public.registration_tokens
    WHERE expires_at < NOW()
    AND is_used = false;

    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;

    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to send reminder emails (placeholder)
CREATE OR REPLACE FUNCTION send_invitation_reminders()
RETURNS INTEGER AS $$
DECLARE
    reminder_count INTEGER := 0;
    invitation_record RECORD;
BEGIN
    -- Find invitations that need reminders (48 hours old, no reminder sent yet)
    FOR invitation_record IN
        SELECT *
        FROM public.user_invitations
        WHERE is_accepted = false
        AND expires_at > NOW()
        AND created_at < NOW() - INTERVAL '48 hours'
        AND reminder_count = 0
    LOOP
        -- Update reminder tracking
        UPDATE public.user_invitations
        SET reminder_count = reminder_count + 1,
            last_reminder_at = NOW()
        WHERE id = invitation_record.id;

        reminder_count := reminder_count + 1;

        -- Here you would integrate with your email service
        -- to send the actual reminder email
    END LOOP;

    RETURN reminder_count;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_company_invitations_timestamp
    BEFORE UPDATE ON public.company_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_invitations_timestamp
    BEFORE UPDATE ON public.user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();