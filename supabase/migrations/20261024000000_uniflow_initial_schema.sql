-- ====================================================================
-- UniFlow Production Database Migration (Hardened & Revised)
-- Version: 20261024000000_uniflow_initial_schema.sql
-- Target Project ID: eawtfjkbaxukyxkvksob
-- Project Name: UniFlow
-- Database Engine: PostgreSQL 17 (ap-northeast-1)
-- Description:
--   1. Fully qualified, user-isolated relational schema with composite foreign keys.
--   2. Strict CHECK constraints for positive finances, durations, and marks.
--   3. Granular Row Level Security (RLS) policies for authenticated students.
--   4. Hardened SECURITY DEFINER signup trigger with safe search_path and restricted grants.
--   5. Idempotent object creation with clean preflight verification.
-- ====================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- SECTION 1: CORE TABLES & COMPOSITE RELATIONSHIPS
-- ====================================================================

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  university TEXT NOT NULL DEFAULT '',
  degree TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  academic_year TEXT NOT NULL DEFAULT 'Year 1',
  semester TEXT NOT NULL DEFAULT 'Semester 1',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP')),
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  week_start_preference TEXT NOT NULL DEFAULT 'monday' CHECK (week_start_preference IN ('monday', 'sunday')),
  monthly_budget NUMERIC(12, 2) NOT NULL DEFAULT 10000.00 CHECK (monthly_budget > 0),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT NOT NULL,
  semester TEXT NOT NULL,
  instructor TEXT,
  credits NUMERIC(4, 1) DEFAULT 3.0 CHECK (credits >= 0),
  target_percentage NUMERIC(5, 2) DEFAULT 85.00 CHECK (target_percentage >= 0 AND target_percentage <= 100),
  grading_scheme TEXT DEFAULT 'raw_percentage' CHECK (grading_scheme IN ('raw_percentage', 'weighted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite unique key to support composite foreign key references
  CONSTRAINT subjects_id_user_id_key UNIQUE (id, user_id)
);

-- 3. ASSIGNMENTS (Same-user ownership enforced via composite FK to subjects)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
  reference_url TEXT,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite unique key to allow child tables to link to assignments
  CONSTRAINT assignments_id_user_id_key UNIQUE (id, user_id),
  -- Composite FK: Guarantees subject belongs to the EXACT same user
  CONSTRAINT fk_assignments_subject_user 
    FOREIGN KEY (subject_id, user_id) 
    REFERENCES public.subjects(id, user_id) 
    ON DELETE CASCADE
);

-- 4. CALENDAR EVENTS (Same-user ownership across subjects & assignments)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID,
  assignment_id UUID,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('class', 'lab', 'exam', 'assignment', 'personal')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_days INTEGER[] DEFAULT '{}' CHECK (recurring_days IS NULL OR recurring_days <@ ARRAY[0, 1, 2, 3, 4, 5, 6]),
  recurrence_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Temporal consistency: end time must be strictly after start time
  CONSTRAINT chk_calendar_events_time_order CHECK (end_at > start_at),
  -- Recurrence end date must be on or after start time if defined
  CONSTRAINT chk_calendar_events_recurrence_order CHECK (recurrence_end_at IS NULL OR recurrence_end_at >= start_at),
  -- Composite FK to subjects: sets ONLY subject_id to NULL on delete
  CONSTRAINT fk_calendar_events_subject_user 
    FOREIGN KEY (subject_id, user_id) 
    REFERENCES public.subjects(id, user_id) 
    ON DELETE SET NULL (subject_id),
  -- Composite FK to assignments: sets ONLY assignment_id to NULL on delete
  CONSTRAINT fk_calendar_events_assignment_user 
    FOREIGN KEY (assignment_id, user_id) 
    REFERENCES public.assignments(id, user_id) 
    ON DELETE SET NULL (assignment_id)
);

-- 5. TRANSACTIONS (Financial ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('UPI', 'Cash', 'Card', 'Net Banking', 'Other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SAVINGS GOALS
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_progress NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_progress >= 0),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  custom_category_name TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'weekly', 'selected_days')),
  selected_days INTEGER[] DEFAULT '{}' CHECK (selected_days IS NULL OR selected_days <@ ARRAY[0, 1, 2, 3, 4, 5, 6]),
  weekly_target_days INTEGER CHECK (weekly_target_days IS NULL OR (weekly_target_days >= 1 AND weekly_target_days <= 7)),
  target_type TEXT NOT NULL DEFAULT 'boolean' CHECK (target_type IN ('boolean', 'measurable')),
  target_value NUMERIC(10, 2) CHECK (target_value IS NULL OR target_value > 0),
  unit TEXT,
  reminder_time TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite unique key to support habit_logs same-user foreign key
  CONSTRAINT habits_id_user_id_key UNIQUE (id, user_id)
);

-- 8. HABIT LOGS (Enforces same-user ownership with parent habit)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  current_value NUMERIC(10, 2) CHECK (current_value IS NULL OR current_value >= 0),
  target_value NUMERIC(10, 2) CHECK (target_value IS NULL OR target_value > 0),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  -- One log entry per habit per calendar day
  CONSTRAINT unique_habit_date UNIQUE (habit_id, date),
  -- Composite FK: Guarantees habit belongs to the EXACT same user
  CONSTRAINT fk_habit_logs_habit_user 
    FOREIGN KEY (habit_id, user_id) 
    REFERENCES public.habits(id, user_id) 
    ON DELETE CASCADE
);

-- 9. FOCUS SESSIONS (Enforces same-user ownership with subjects & assignments)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID,
  assignment_id UUID,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  workflow_mode TEXT DEFAULT 'open_focus' CHECK (workflow_mode IN ('open_focus', 'pomodoro')),
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes > 0),
  actual_duration_seconds INTEGER NOT NULL CHECK (actual_duration_seconds >= 0),
  completed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT true,
  -- Composite FK to subjects: sets ONLY subject_id to NULL on delete
  CONSTRAINT fk_focus_sessions_subject_user 
    FOREIGN KEY (subject_id, user_id) 
    REFERENCES public.subjects(id, user_id) 
    ON DELETE SET NULL (subject_id),
  -- Composite FK to assignments: sets ONLY assignment_id to NULL on delete
  CONSTRAINT fk_focus_sessions_assignment_user 
    FOREIGN KEY (assignment_id, user_id) 
    REFERENCES public.assignments(id, user_id) 
    ON DELETE SET NULL (assignment_id)
);

-- 10. FOCUS SETTINGS & ACTIVE TIMER STATE
CREATE TABLE IF NOT EXISTS public.focus_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_duration_minutes INTEGER NOT NULL DEFAULT 25 CHECK (focus_duration_minutes > 0),
  short_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK (short_break_minutes > 0),
  long_break_minutes INTEGER NOT NULL DEFAULT 15 CHECK (long_break_minutes > 0),
  long_break_interval INTEGER NOT NULL DEFAULT 4 CHECK (long_break_interval > 0),
  auto_start_breaks BOOLEAN NOT NULL DEFAULT false,
  auto_start_focus BOOLEAN NOT NULL DEFAULT false,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  active_focus_state JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ASSESSMENTS (Enforces same-user ownership with subjects)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  maximum_marks NUMERIC(6, 2) NOT NULL CHECK (maximum_marks > 0),
  obtained_marks NUMERIC(6, 2) CHECK (obtained_marks IS NULL OR (obtained_marks >= 0 AND obtained_marks <= maximum_marks)),
  weightage_percentage NUMERIC(5, 2) CHECK (weightage_percentage IS NULL OR (weightage_percentage >= 0 AND weightage_percentage <= 100)),
  assessment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'pending_eval', 'graded')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite FK: Guarantees subject belongs to the EXACT same user
  CONSTRAINT fk_assessments_subject_user 
    FOREIGN KEY (subject_id, user_id) 
    REFERENCES public.subjects(id, user_id) 
    ON DELETE CASCADE
);

-- ====================================================================
-- SECTION 2: PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON public.assignments(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON public.calendar_events(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON public.focus_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON public.assessments(subject_id);

-- ====================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) POLICIES & GRANTS
-- ====================================================================

-- Revoke all table-level access from unauthenticated anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Grant standard data manipulation only to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Subjects
DROP POLICY IF EXISTS "subjects_select_own" ON public.subjects;
CREATE POLICY "subjects_select_own" ON public.subjects FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects_insert_own" ON public.subjects;
CREATE POLICY "subjects_insert_own" ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects_update_own" ON public.subjects;
CREATE POLICY "subjects_update_own" ON public.subjects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subjects_delete_own" ON public.subjects;
CREATE POLICY "subjects_delete_own" ON public.subjects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Assignments
DROP POLICY IF EXISTS "assignments_select_own" ON public.assignments;
CREATE POLICY "assignments_select_own" ON public.assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assignments_insert_own" ON public.assignments;
CREATE POLICY "assignments_insert_own" ON public.assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assignments_update_own" ON public.assignments;
CREATE POLICY "assignments_update_own" ON public.assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assignments_delete_own" ON public.assignments;
CREATE POLICY "assignments_delete_own" ON public.assignments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Calendar Events
DROP POLICY IF EXISTS "calendar_events_select_own" ON public.calendar_events;
CREATE POLICY "calendar_events_select_own" ON public.calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_insert_own" ON public.calendar_events;
CREATE POLICY "calendar_events_insert_own" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_update_own" ON public.calendar_events;
CREATE POLICY "calendar_events_update_own" ON public.calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_delete_own" ON public.calendar_events;
CREATE POLICY "calendar_events_delete_own" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Savings Goals
DROP POLICY IF EXISTS "savings_goals_select_own" ON public.savings_goals;
CREATE POLICY "savings_goals_select_own" ON public.savings_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_insert_own" ON public.savings_goals;
CREATE POLICY "savings_goals_insert_own" ON public.savings_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_update_own" ON public.savings_goals;
CREATE POLICY "savings_goals_update_own" ON public.savings_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_delete_own" ON public.savings_goals;
CREATE POLICY "savings_goals_delete_own" ON public.savings_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Habits
DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
CREATE POLICY "habits_select_own" ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
CREATE POLICY "habits_insert_own" ON public.habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
CREATE POLICY "habits_update_own" ON public.habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;
CREATE POLICY "habits_delete_own" ON public.habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. Habit Logs
DROP POLICY IF EXISTS "habit_logs_select_own" ON public.habit_logs;
CREATE POLICY "habit_logs_select_own" ON public.habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habit_logs_insert_own" ON public.habit_logs;
CREATE POLICY "habit_logs_insert_own" ON public.habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habit_logs_update_own" ON public.habit_logs;
CREATE POLICY "habit_logs_update_own" ON public.habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habit_logs_delete_own" ON public.habit_logs;
CREATE POLICY "habit_logs_delete_own" ON public.habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. Focus Sessions
DROP POLICY IF EXISTS "focus_sessions_select_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_own" ON public.focus_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_sessions_insert_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_insert_own" ON public.focus_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_sessions_update_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_update_own" ON public.focus_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_sessions_delete_own" ON public.focus_sessions;
CREATE POLICY "focus_sessions_delete_own" ON public.focus_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. Focus Settings
DROP POLICY IF EXISTS "focus_settings_select_own" ON public.focus_settings;
CREATE POLICY "focus_settings_select_own" ON public.focus_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_settings_insert_own" ON public.focus_settings;
CREATE POLICY "focus_settings_insert_own" ON public.focus_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_settings_update_own" ON public.focus_settings;
CREATE POLICY "focus_settings_update_own" ON public.focus_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_settings_delete_own" ON public.focus_settings;
CREATE POLICY "focus_settings_delete_own" ON public.focus_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. Assessments
DROP POLICY IF EXISTS "assessments_select_own" ON public.assessments;
CREATE POLICY "assessments_select_own" ON public.assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessments_insert_own" ON public.assessments;
CREATE POLICY "assessments_insert_own" ON public.assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessments_update_own" ON public.assessments;
CREATE POLICY "assessments_update_own" ON public.assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessments_delete_own" ON public.assessments;
CREATE POLICY "assessments_delete_own" ON public.assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ====================================================================
-- SECTION 4: HARDENED USER ONBOARDING TRIGGER
-- ====================================================================

-- 1. Function definition with fixed search_path = '' and fully qualified object names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.focus_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Restrict function execution: revoke from PUBLIC, grant only to trusted system roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, postgres, service_role;

-- 3. Idempotently attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
