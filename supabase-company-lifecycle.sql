-- Company Lifecycle Management System
-- Handles complete company lifecycle with secure credentials and status management

-- Enhanced company status types
CREATE TYPE company_status AS ENUM ('pending', 'active', 'suspended', 'cancelled', 'archived');

-- Add company lifecycle fields to existing companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status company_status DEFAULT 'pending';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reactivated_by UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lifecycle_notes TEXT;

-- Add password management fields to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS password_must_change BOOLEAN DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Company lifecycle audit log
CREATE TABLE IF NOT EXISTS public.company_lifecycle_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'activated', 'suspended', 'reactivated', 'cancelled', 'archived'
    previous_status company_status,
    new_status company_status,
    performed_by UUID REFERENCES public.user_profiles(id),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary credentials table for secure company setup
CREATE TABLE IF NOT EXISTS public.temp_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    temp_password TEXT NOT NULL, -- Will be hashed
    reset_token TEXT UNIQUE NOT NULL,

    -- Security and tracking
    created_by UUID REFERENCES public.user_profiles(id),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    -- Failed attempts tracking
    failed_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password change history for compliance
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL, -- For preventing reuse
    changed_reason TEXT, -- 'mandatory', 'voluntary', 'admin_reset', 'security_breach'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company access log for monitoring suspended accounts
CREATE TABLE IF NOT EXISTS public.company_access_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

    -- Access attempt details
    access_type TEXT NOT NULL, -- 'login', 'api_call', 'page_access'
    access_result TEXT NOT NULL, -- 'allowed', 'denied_suspended', 'denied_cancelled', 'denied_inactive'
    resource_accessed TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_suspended_at ON public.companies(suspended_at) WHERE status = 'suspended';
CREATE INDEX IF NOT EXISTS idx_user_profiles_password_must_change ON public.user_profiles(password_must_change) WHERE password_must_change = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_temp_password_expires ON public.user_profiles(temp_password_expires_at) WHERE temp_password_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lifecycle_audit_company ON public.company_lifecycle_audit(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_audit_action ON public.company_lifecycle_audit(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temp_credentials_email ON public.temp_credentials(user_email);
CREATE INDEX IF NOT EXISTS idx_temp_credentials_token ON public.temp_credentials(reset_token);
CREATE INDEX IF NOT EXISTS idx_temp_credentials_expires ON public.temp_credentials(expires_at) WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_password_history_user ON public.password_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_access_log_company ON public.company_access_log(company_id, created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.company_lifecycle_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lifecycle audit
CREATE POLICY "Super admin can view all lifecycle audit" ON public.company_lifecycle_audit
FOR SELECT USING (is_super_admin());

CREATE POLICY "Company admins can view their company audit" ON public.company_lifecycle_audit
FOR SELECT USING (
    company_id = get_user_company_id() AND
    is_company_owner_or_admin()
);

-- RLS Policies for temp credentials (super admin only)
CREATE POLICY "Super admin can manage temp credentials" ON public.temp_credentials
FOR ALL USING (is_super_admin());

-- RLS Policies for password history
CREATE POLICY "Users can view their own password history" ON public.password_history
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all password history" ON public.password_history
FOR SELECT USING (is_super_admin());

-- RLS Policies for company access log
CREATE POLICY "Super admin can view all access logs" ON public.company_access_log
FOR SELECT USING (is_super_admin());

CREATE POLICY "Company admins can view their company access logs" ON public.company_access_log
FOR SELECT USING (
    company_id = get_user_company_id() AND
    is_company_owner_or_admin()
);

-- Function to generate secure temporary password
CREATE OR REPLACE FUNCTION generate_temp_password(length INTEGER DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    password TEXT := '';
    i INTEGER;
BEGIN
    -- Ensure minimum length for security
    IF length < 8 THEN
        length := 8;
    END IF;

    FOR i IN 1..length LOOP
        password := password || substr(chars, floor(random() * length(chars))::int + 1, 1);
    END LOOP;

    -- Add special characters for complexity
    password := password || '@' || floor(random() * 10)::TEXT;

    RETURN password;
END;
$$ LANGUAGE plpgsql;

-- Function to create company with temporary credentials
CREATE OR REPLACE FUNCTION create_company_with_temp_credentials(
    company_data JSONB,
    admin_email TEXT,
    admin_name TEXT,
    created_by_user_id UUID
)
RETURNS TABLE(
    company_id UUID,
    temp_password TEXT,
    reset_token TEXT,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    new_company_id UUID;
    temp_pass TEXT;
    reset_tok TEXT;
    expires_time TIMESTAMPTZ;
BEGIN
    -- Create company
    INSERT INTO public.companies (
        name,
        slug,
        email,
        phone,
        address,
        status,
        subscription_status,
        trial_ends_at
    ) VALUES (
        company_data->>'name',
        lower(regexp_replace(company_data->>'name', '[^a-zA-Z0-9]+', '-', 'g')),
        company_data->>'email',
        company_data->>'phone',
        company_data->>'address',
        'pending',
        'trial',
        NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO new_company_id;

    -- Generate temporary credentials
    temp_pass := generate_temp_password(12);
    reset_tok := encode(gen_random_bytes(32), 'hex');
    expires_time := NOW() + INTERVAL '7 days';

    -- Store temporary credentials
    INSERT INTO public.temp_credentials (
        company_id,
        user_email,
        temp_password,
        reset_token,
        created_by,
        expires_at
    ) VALUES (
        new_company_id,
        admin_email,
        crypt(temp_pass, gen_salt('bf')), -- Hash the password
        reset_tok,
        created_by_user_id,
        expires_time
    );

    -- Log company creation
    INSERT INTO public.company_lifecycle_audit (
        company_id,
        action,
        new_status,
        performed_by,
        reason,
        metadata
    ) VALUES (
        new_company_id,
        'created',
        'pending',
        created_by_user_id,
        'Company created by super admin',
        jsonb_build_object(
            'admin_email', admin_email,
            'admin_name', admin_name,
            'has_temp_credentials', true
        )
    );

    RETURN QUERY SELECT new_company_id, temp_pass, reset_tok, expires_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change company status with audit logging
CREATE OR REPLACE FUNCTION change_company_status(
    target_company_id UUID,
    new_status company_status,
    reason TEXT DEFAULT NULL,
    performed_by_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status company_status;
    company_name TEXT;
BEGIN
    -- Get current status
    SELECT status, name INTO current_status, company_name
    FROM public.companies
    WHERE id = target_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    -- Update company status
    UPDATE public.companies
    SET
        status = new_status,
        suspended_at = CASE WHEN new_status = 'suspended' THEN NOW() ELSE suspended_at END,
        suspended_by = CASE WHEN new_status = 'suspended' THEN performed_by_user_id ELSE suspended_by END,
        suspension_reason = CASE WHEN new_status = 'suspended' THEN reason ELSE suspension_reason END,
        reactivated_at = CASE WHEN new_status = 'active' AND current_status = 'suspended' THEN NOW() ELSE reactivated_at END,
        reactivated_by = CASE WHEN new_status = 'active' AND current_status = 'suspended' THEN performed_by_user_id ELSE reactivated_by END,
        updated_at = NOW()
    WHERE id = target_company_id;

    -- Log the status change
    INSERT INTO public.company_lifecycle_audit (
        company_id,
        action,
        previous_status,
        new_status,
        performed_by,
        reason,
        metadata
    ) VALUES (
        target_company_id,
        CASE
            WHEN new_status = 'active' AND current_status = 'suspended' THEN 'reactivated'
            WHEN new_status = 'suspended' THEN 'suspended'
            WHEN new_status = 'cancelled' THEN 'cancelled'
            WHEN new_status = 'archived' THEN 'archived'
            ELSE new_status::TEXT
        END,
        current_status,
        new_status,
        performed_by_user_id,
        reason,
        jsonb_build_object(
            'company_name', company_name,
            'timestamp', NOW(),
            'automated', performed_by_user_id IS NULL
        )
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify temporary credentials
CREATE OR REPLACE FUNCTION verify_temp_credentials(
    email TEXT,
    password TEXT,
    reset_token TEXT
)
RETURNS TABLE(
    valid BOOLEAN,
    company_id UUID,
    user_must_change_password BOOLEAN,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    cred_record RECORD;
    password_valid BOOLEAN := false;
BEGIN
    -- Get credentials record
    SELECT * INTO cred_record
    FROM public.temp_credentials tc
    JOIN public.companies c ON tc.company_id = c.id
    WHERE tc.user_email = email
    AND tc.reset_token = reset_token
    AND tc.used = false
    AND tc.expires_at > NOW()
    AND tc.failed_attempts < 5;

    IF NOT FOUND THEN
        -- Log failed attempt if record exists
        UPDATE public.temp_credentials
        SET failed_attempts = failed_attempts + 1,
            last_attempt_at = NOW()
        WHERE user_email = email AND reset_token = reset_token;

        RETURN QUERY SELECT false, NULL::UUID, false, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Verify password
    password_valid := (cred_record.temp_password = crypt(password, cred_record.temp_password));

    IF password_valid THEN
        -- Mark credentials as used
        UPDATE public.temp_credentials
        SET used = true,
            used_at = NOW()
        WHERE id = cred_record.id;

        RETURN QUERY SELECT true, cred_record.company_id, true, cred_record.expires_at;
    ELSE
        -- Increment failed attempts
        UPDATE public.temp_credentials
        SET failed_attempts = failed_attempts + 1,
            last_attempt_at = NOW()
        WHERE id = cred_record.id;

        RETURN QUERY SELECT false, NULL::UUID, false, NULL::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log company access attempts
CREATE OR REPLACE FUNCTION log_company_access(
    target_company_id UUID,
    target_user_id UUID,
    access_type TEXT,
    access_result TEXT,
    resource_accessed TEXT DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.company_access_log (
        company_id,
        user_id,
        access_type,
        access_result,
        resource_accessed,
        ip_address,
        user_agent
    ) VALUES (
        target_company_id,
        target_user_id,
        access_type,
        access_result,
        resource_accessed,
        ip_addr,
        user_agent_string
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if company access is allowed
CREATE OR REPLACE FUNCTION is_company_access_allowed(target_company_id UUID)
RETURNS TABLE(
    allowed BOOLEAN,
    reason TEXT,
    company_status company_status
) AS $$
DECLARE
    comp_record RECORD;
BEGIN
    SELECT * INTO comp_record
    FROM public.companies
    WHERE id = target_company_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Company not found', NULL::company_status;
        RETURN;
    END IF;

    CASE comp_record.status
        WHEN 'active' THEN
            RETURN QUERY SELECT true, 'Access allowed', comp_record.status;
        WHEN 'pending' THEN
            RETURN QUERY SELECT false, 'Company setup not complete', comp_record.status;
        WHEN 'suspended' THEN
            RETURN QUERY SELECT false, 'Company account is suspended', comp_record.status;
        WHEN 'cancelled' THEN
            RETURN QUERY SELECT false, 'Company account has been cancelled', comp_record.status;
        WHEN 'archived' THEN
            RETURN QUERY SELECT false, 'Company account is archived', comp_record.status;
        ELSE
            RETURN QUERY SELECT false, 'Unknown company status', comp_record.status;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to force password change for user
CREATE OR REPLACE FUNCTION force_password_change(target_user_id UUID, reason TEXT DEFAULT 'mandatory')
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_profiles
    SET password_must_change = true,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Log the password change requirement
    INSERT INTO public.password_history (
        user_id,
        password_hash,
        changed_reason
    ) VALUES (
        target_user_id,
        'FORCE_CHANGE_REQUIRED',
        reason
    );

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically suspend company users when company is suspended
CREATE OR REPLACE FUNCTION auto_suspend_company_users()
RETURNS TRIGGER AS $$
BEGIN
    -- When company status changes to suspended, mark all users as needing password change
    -- This effectively logs them out and prevents access
    IF NEW.status = 'suspended' AND OLD.status != 'suspended' THEN
        UPDATE public.user_profiles
        SET password_must_change = true,
            updated_at = NOW()
        WHERE company_id = NEW.id;
    END IF;

    -- When company is reactivated, remove the forced password change (but keep audit trail)
    IF NEW.status = 'active' AND OLD.status = 'suspended' THEN
        UPDATE public.user_profiles
        SET password_must_change = false,
            updated_at = NOW()
        WHERE company_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_suspend_company_users
    AFTER UPDATE OF status ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION auto_suspend_company_users();

-- Function to cleanup expired temporary credentials
CREATE OR REPLACE FUNCTION cleanup_expired_temp_credentials()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    DELETE FROM public.temp_credentials
    WHERE expires_at < NOW()
    AND used = false;

    GET DIAGNOSTICS cleanup_count = ROW_COUNT;

    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Add some sample company statuses for existing companies
UPDATE public.companies
SET status = 'active'
WHERE status IS NULL;

COMMENT ON TABLE public.company_lifecycle_audit IS 'Audit trail for all company lifecycle changes including creation, suspension, reactivation';
COMMENT ON TABLE public.temp_credentials IS 'Secure temporary credentials for company admin first-time setup';
COMMENT ON TABLE public.password_history IS 'Password change history for compliance and security';
COMMENT ON TABLE public.company_access_log IS 'Log of all company access attempts for monitoring suspended accounts';