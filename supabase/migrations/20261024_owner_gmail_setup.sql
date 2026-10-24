-- ==============================================================================
-- Khmer Math Learning & Assessment System (រៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
-- Database Migration: Permanent Owner Gmail Designation & Strict RLS Enforcement
-- Migration Date: 2026-10-24
-- ==============================================================================

-- 1. System Settings Table (រក្សាទុកការកំណត់ប្រព័ន្ធ និង Owner Gmail ដោយសុវត្ថិភាព)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect system_settings with RLS (Only Super Admin can view/modify)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admin manage system settings" ON public.system_settings;
CREATE POLICY "Super Admin manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'owner' OR is_owner = TRUE)
        )
    );

-- 2. Function to retrieve the configured Owner Gmail safely
CREATE OR REPLACE FUNCTION public.get_owner_email()
RETURNS TEXT AS $$
DECLARE
    _email TEXT;
BEGIN
    SELECT value INTO _email FROM public.system_settings WHERE key = 'owner_email';
    RETURN LOWER(TRIM(COALESCE(_email, '')));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dedicated Function to Set or Update Permanent Owner Gmail
-- When executed, this updates system_settings and automatically promotes matching account
CREATE OR REPLACE FUNCTION public.set_owner_gmail(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    _clean_email TEXT;
    _matched_id UUID;
BEGIN
    _clean_email := LOWER(TRIM(p_email));
    IF _clean_email = '' OR _clean_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ!';
    END IF;

    -- Upsert Owner Email into system_settings
    INSERT INTO public.system_settings (key, value, description, updated_at)
    VALUES ('owner_email', _clean_email, 'Permanent Super Admin Owner Gmail', NOW())
    ON CONFLICT (key) DO UPDATE SET value = _clean_email, updated_at = NOW();

    -- Reset any previous owner flag on other accounts to maintain unique single owner constraint
    UPDATE public.profiles 
    SET is_owner = FALSE, role = CASE WHEN role = 'owner' THEN 'teacher' ELSE role END
    WHERE is_owner = TRUE AND LOWER(TRIM(email)) <> _clean_email;

    -- If a user with this email already exists in profiles, promote them immediately!
    UPDATE public.profiles 
    SET role = 'owner', is_owner = TRUE, account_status = 'active', updated_at = NOW()
    WHERE LOWER(TRIM(email)) = _clean_email;

    RETURN 'បានកំណត់ ' || _clean_email || ' ជាម្ចាស់កម្មវិធី (Super Admin / Owner) ដោយជោគជ័យ!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Automatic Auth Sync Trigger on auth.users
-- Whenever the owner logs in, signs up, or verifies email, this trigger automatically
-- grants them Super Admin rights on the database level.
CREATE OR REPLACE FUNCTION public.handle_user_auth_sync()
RETURNS TRIGGER AS $$
DECLARE
    _owner_email TEXT;
    _is_owner BOOLEAN := FALSE;
    _assigned_role TEXT := 'student';
    _existing_role TEXT;
BEGIN
    _owner_email := public.get_owner_email();
    
    -- Check if authenticated user matches configured Owner Gmail
    IF _owner_email <> '' AND LOWER(TRIM(NEW.email)) = _owner_email THEN
        _is_owner := TRUE;
        _assigned_role := 'owner';
    END IF;

    -- Check if profile already exists
    SELECT role INTO _existing_role FROM public.profiles WHERE id = NEW.id;

    IF _existing_role IS NULL THEN
        -- Insert new profile
        INSERT INTO public.profiles (
            id,
            email,
            full_name_km,
            full_name_en,
            role,
            is_owner,
            account_status
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name_km', NEW.raw_user_meta_data->>'full_name', 'ម្ចាស់កម្មវិធី'),
            NEW.raw_user_meta_data->>'full_name_en',
            _assigned_role,
            _is_owner,
            'active'
        );
    ELSE
        -- Profile exists: If this is the owner, ensure role & is_owner are enforced
        IF _is_owner THEN
            -- Ensure single owner
            UPDATE public.profiles 
            SET is_owner = FALSE 
            WHERE is_owner = TRUE AND id <> NEW.id;

            UPDATE public.profiles SET 
                role = 'owner',
                is_owner = TRUE,
                account_status = 'active',
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (Supabase Auth)
DROP TRIGGER IF EXISTS trg_auth_user_sync ON auth.users;
CREATE TRIGGER trg_auth_user_sync
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_auth_sync();

-- 5. Strict Owner Protection Trigger (Prevent Demoting or Hijacking Owner Role)
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS TRIGGER AS $$
DECLARE
    _owner_email TEXT;
BEGIN
    _owner_email := public.get_owner_email();

    -- Block non-owners from modifying owner profile
    IF OLD.is_owner = TRUE AND (NEW.is_owner = FALSE OR NEW.role != 'owner') THEN
        IF _owner_email <> '' AND LOWER(TRIM(OLD.email)) = _owner_email THEN
            RAISE EXCEPTION 'មិនអនុញ្ញាតឱ្យដកហូតសិទ្ធិ ឬកែប្រែតួនាទីម្ចាស់កម្មវិធី (Owner) ជាដាច់ខាត!';
        END IF;
    END IF;

    -- Block privilege escalation (Teacher or Student promoting to Owner)
    IF (NEW.role = 'owner' OR NEW.is_owner = TRUE) AND (OLD.is_owner IS DISTINCT FROM TRUE) THEN
        IF _owner_email = '' OR LOWER(TRIM(NEW.email)) <> _owner_email THEN
            RAISE EXCEPTION 'គ្មានសិទ្ធិកំណត់តួនាទីជាម្ចាស់កម្មវិធី (Owner) បានឡើយ! អ៊ីមែលមិនត្រូវគ្នានឹង Owner Gmail ដែលបានកំណត់។';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_owner ON public.profiles;
CREATE TRIGGER trg_protect_owner
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_role();

-- ==============================================================================
-- Execute owner designation for permanent Super Admin
-- ==============================================================================
SELECT public.set_owner_gmail('vayseangleng@gmail.com');

