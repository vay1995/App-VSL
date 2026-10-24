-- ==============================================================================
-- Khmer Math Learning & Assessment System (ប្រព័ន្ធរៀន និងវាយតម្លៃគណិតវិទ្យាខ្មែរ)
-- Production Supabase PostgreSQL Schema with Strict Row Level Security (RLS)
-- Roles: 'owner' (Super Admin / App Owner), 'teacher', 'student'
-- ==============================================================================

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_km TEXT NOT NULL,
    full_name_en TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'teacher', 'student')),
    is_owner BOOLEAN DEFAULT FALSE,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_approval')),
    school_name TEXT DEFAULT 'វិទ្យាល័យព្រះស៊ីសុវត្ថិ',
    grade_level INTEGER CHECK (grade_level IN (10, 11, 12)),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure there is only ONE owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_owner ON public.profiles (is_owner) WHERE is_owner = TRUE;

-- 2. Audit Logs Table (ប្រវត្តិសកម្មភាពសំខាន់ៗក្នុងប្រព័ន្ធ)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_role TEXT,
    action TEXT NOT NULL, -- e.g. 'CREATE_QUIZ', 'DELETE_LESSON', 'GRADE_ATTEMPT', 'BAN_USER'
    resource_type TEXT NOT NULL, -- e.g. 'quiz', 'lesson', 'user', 'submission'
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Classes Table (ថ្នាក់រៀន)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. MTH-12A
    name TEXT NOT NULL,         -- e.g. ថ្នាក់គណិតវិទ្យា ១២A
    grade INTEGER NOT NULL CHECK (grade IN (10, 11, 12)),
    academic_year TEXT DEFAULT '2025-2026',
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Class Enrollments Table (ការចុះឈ្មោះចូលរៀនរបស់សិស្ស)
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 5. Chapters Table (ជំពូក)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lessons Table (មេរៀន)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_km TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lesson Files & Videos (ឯកសារភ្ជាប់ PDF/DOCX/PPTX និងវីដេអូ)
CREATE TABLE IF NOT EXISTS public.lesson_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'mp4', 'video_link', 'png', 'jpg')),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quizzes Table (កម្រងតេស្ត)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER NOT NULL DEFAULT 30,
    max_attempts INTEGER DEFAULT 1,
    pass_percentage NUMERIC DEFAULT 50.0,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    show_solution_on_submit BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Quiz Questions Table (សំណួរតេស្ត - ចម្លើយត្រូវការពារដោយសិទ្ធិ)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'open_response')),
    prompt_km TEXT NOT NULL,
    math_formula TEXT, -- KaTeX / LaTeX string
    points NUMERIC NOT NULL DEFAULT 5.0,
    options JSONB, -- Array of options [{id: 'A', text: '...', math: '...'}]
    correct_option TEXT NOT NULL, -- Master Answer Key (Protected)
    explanation_km TEXT, -- Master Step-by-Step Explanation (Protected)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quiz Attempts Table (ការប្រឡងរបស់សិស្ស)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- Server enforced
    submitted_at TIMESTAMPTZ,
    total_score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'graded', 'timed_out')),
    teacher_feedback TEXT,
    allow_retake BOOLEAN DEFAULT FALSE,
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ
);

-- 11. Quiz Answers Table (ចម្លើយសិស្សតាមសំណួរនីមួយៗ)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    student_response TEXT,
    is_correct BOOLEAN,
    score_awarded NUMERIC DEFAULT 0,
    teacher_notes TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Enforce strict role-based data isolation on the database level
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- 0. System Settings Table (រក្សាទុកការកំណត់ប្រព័ន្ធ និង Owner Gmail ដោយសុវត្ថិភាព)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions for role detection
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'owner' OR is_owner = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retrieve configured Owner Gmail
CREATE OR REPLACE FUNCTION public.get_owner_email()
RETURNS TEXT AS $$
DECLARE
    _email TEXT;
BEGIN
    SELECT value INTO _email FROM public.system_settings WHERE key = 'owner_email';
    RETURN LOWER(TRIM(COALESCE(_email, '')));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set permanent Owner Gmail safely
CREATE OR REPLACE FUNCTION public.set_owner_gmail(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    _clean_email TEXT;
BEGIN
    _clean_email := LOWER(TRIM(p_email));
    IF _clean_email = '' OR _clean_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ!';
    END IF;

    INSERT INTO public.system_settings (key, value, description, updated_at)
    VALUES ('owner_email', _clean_email, 'Permanent Super Admin Owner Gmail', NOW())
    ON CONFLICT (key) DO UPDATE SET value = _clean_email, updated_at = NOW();

    -- Ensure single owner
    UPDATE public.profiles 
    SET is_owner = FALSE, role = CASE WHEN role = 'owner' THEN 'teacher' ELSE role END
    WHERE is_owner = TRUE AND LOWER(TRIM(email)) <> _clean_email;

    -- Promote existing profile if present
    UPDATE public.profiles 
    SET role = 'owner', is_owner = TRUE, account_status = 'active', updated_at = NOW()
    WHERE LOWER(TRIM(email)) = _clean_email;

    RETURN 'បានកំណត់ ' || _clean_email || ' ជាម្ចាស់កម្មវិធី (Super Admin / Owner) ដោយជោគជ័យ!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync Auth Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_user_auth_sync()
RETURNS TRIGGER AS $$
DECLARE
    _owner_email TEXT;
    _is_owner BOOLEAN := FALSE;
    _assigned_role TEXT := 'student';
    _existing_role TEXT;
BEGIN
    _owner_email := public.get_owner_email();
    
    IF _owner_email <> '' AND LOWER(TRIM(NEW.email)) = _owner_email THEN
        _is_owner := TRUE;
        _assigned_role := 'owner';
    END IF;

    SELECT role INTO _existing_role FROM public.profiles WHERE id = NEW.id;

    IF _existing_role IS NULL THEN
        INSERT INTO public.profiles (
            id, email, full_name_km, full_name_en, role, is_owner, account_status
        ) VALUES (
            NEW.id, NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name_km', NEW.raw_user_meta_data->>'full_name', 'ម្ចាស់កម្មវិធី'),
            NEW.raw_user_meta_data->>'full_name_en',
            _assigned_role, _is_owner, 'active'
        );
    ELSE
        IF _is_owner THEN
            UPDATE public.profiles SET is_owner = FALSE WHERE is_owner = TRUE AND id <> NEW.id;
            UPDATE public.profiles SET role = 'owner', is_owner = TRUE, account_status = 'active', updated_at = NOW() WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auth_user_sync ON auth.users;
CREATE TRIGGER trg_auth_user_sync
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_auth_sync();

-- Protection: Prevent non-owners from modifying owner profile or promoting themselves
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS TRIGGER AS $$
DECLARE
    _owner_email TEXT;
BEGIN
    _owner_email := public.get_owner_email();

    -- If trying to change an owner account
    IF OLD.is_owner = TRUE AND (NEW.is_owner = FALSE OR NEW.role != 'owner') THEN
        IF _owner_email <> '' AND LOWER(TRIM(OLD.email)) = _owner_email THEN
            RAISE EXCEPTION 'មិនអនុញ្ញាតឱ្យដកហូតសិទ្ធិ ឬកែប្រែតួនាទីម្ចាស់កម្មវិធី (Owner) ជាដាច់ខាត!';
        END IF;
    END IF;

    -- If someone tries to promote themselves or another user to owner/admin
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

CREATE POLICY "Super Admin manage system settings" ON public.system_settings
    FOR ALL USING (public.is_super_admin());

-- --- Profiles RLS ---
CREATE POLICY "Public read active profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Owner full profile control" ON public.profiles FOR ALL USING (public.is_super_admin());
CREATE POLICY "Users update own non-role fields" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- --- Audit Logs RLS ---
CREATE POLICY "Only Super Admin view audit logs" ON public.audit_logs FOR SELECT USING (public.is_super_admin());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- --- Classes & Lessons RLS ---
CREATE POLICY "Owner manage all classes" ON public.classes FOR ALL USING (public.is_super_admin());
CREATE POLICY "Teachers manage own classes" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Students view enrolled classes" ON public.classes FOR SELECT USING (true);

CREATE POLICY "Owner manage all lessons" ON public.lessons FOR ALL USING (public.is_super_admin());
CREATE POLICY "Teachers manage lessons in own classes" ON public.lessons FOR ALL 
USING (EXISTS (SELECT 1 FROM public.chapters c JOIN public.classes cls ON c.class_id = cls.id WHERE c.id = lessons.chapter_id AND (cls.teacher_id = auth.uid() OR public.is_super_admin())));
CREATE POLICY "Students view published lessons" ON public.lessons FOR SELECT USING (is_published = TRUE);

-- --- Quizzes & Questions RLS ---
CREATE POLICY "Owner manage all quizzes" ON public.quizzes FOR ALL USING (public.is_super_admin());
CREATE POLICY "Teachers manage own quizzes" ON public.quizzes FOR ALL USING (created_by = auth.uid() OR public.is_super_admin());
CREATE POLICY "Students view published quizzes" ON public.quizzes FOR SELECT USING (is_published = TRUE);

-- Questions: Teachers & Owner see everything including master answer keys
CREATE POLICY "Teachers see question answer keys" ON public.quiz_questions FOR ALL 
USING (public.is_teacher());

-- --- Quiz Attempts RLS ---
CREATE POLICY "Students see ONLY own attempts" ON public.quiz_attempts FOR SELECT 
USING (student_id = auth.uid() OR public.is_teacher() OR public.is_super_admin());

CREATE POLICY "Students create own attempts" ON public.quiz_attempts FOR INSERT 
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students submit own attempts" ON public.quiz_attempts FOR UPDATE 
USING (student_id = auth.uid() AND status = 'in_progress');

CREATE POLICY "Teachers and Owner grade attempts" ON public.quiz_attempts FOR UPDATE 
USING (public.is_teacher() OR public.is_super_admin());

-- --- Quiz Answers RLS ---
CREATE POLICY "Students see ONLY own answers" ON public.quiz_answers FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_answers.attempt_id AND (a.student_id = auth.uid() OR public.is_teacher() OR public.is_super_admin())));

CREATE POLICY "Students save own answers" ON public.quiz_answers FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_answers.attempt_id AND a.student_id = auth.uid()));

CREATE POLICY "Students update own in-progress answers" ON public.quiz_answers FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_answers.attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress'));
