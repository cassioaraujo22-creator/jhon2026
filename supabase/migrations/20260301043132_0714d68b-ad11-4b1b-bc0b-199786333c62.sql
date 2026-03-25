
-- 1. Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'coach', 'member');
CREATE TYPE public.goal_type AS ENUM ('hipertrofia', 'emagrecimento', 'performance', 'reabilitacao', 'outro');
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'semiannual', 'annual', 'one_time');
CREATE TYPE public.membership_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'failed', 'refunded');
CREATE TYPE public.workout_session_status AS ENUM ('planned', 'done', 'missed');
CREATE TYPE public.credential_type AS ENUM ('qr', 'rfid', 'pin');
CREATE TYPE public.credential_status AS ENUM ('active', 'blocked', 'expired');
CREATE TYPE public.access_decision AS ENUM ('allow', 'deny');
CREATE TYPE public.device_type AS ENUM ('henry_turnstile', 'generic');
CREATE TYPE public.ai_job_status AS ENUM ('pending', 'running', 'done', 'error');
CREATE TYPE public.progress_type AS ENUM ('weight', 'bodyfat', 'measurements');

-- 2. Gyms
CREATE TABLE public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#7148EC',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User Roles (separate table per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id, role)
);

-- 5. Plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  goal_type goal_type NOT NULL DEFAULT 'outro',
  duration_weeks INT,
  level TEXT,
  benefits JSONB DEFAULT '[]',
  price_cents INT NOT NULL DEFAULT 0,
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Memberships
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  status membership_status NOT NULL DEFAULT 'active',
  start_at TIMESTAMPTZ DEFAULT now(),
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  provider TEXT,
  provider_subscription_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  next_billing_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  provider TEXT,
  provider_payment_id TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  raw JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  equipment TEXT,
  muscle_group TEXT,
  instructions TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Workout Templates
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal_type goal_type DEFAULT 'outro',
  level TEXT,
  weeks INT DEFAULT 4,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Workout Days
CREATE TABLE public.workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
  day_index INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Workout Items
CREATE TABLE public.workout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID REFERENCES public.workout_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  sets INT DEFAULT 3,
  reps TEXT DEFAULT '12',
  rest_seconds INT DEFAULT 60,
  intensity TEXT,
  order_index INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Assigned Workouts
CREATE TABLE public.assigned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Workout Sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_workout_id UUID REFERENCES public.assigned_workouts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status workout_session_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Workout Logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  performed_sets JSONB DEFAULT '[]',
  duration_seconds INT DEFAULT 0,
  calories_estimated INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Progress Metrics
CREATE TABLE public.progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type progress_type NOT NULL DEFAULT 'weight',
  value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  rule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Member Badges
CREATE TABLE public.member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Access Credentials
CREATE TABLE public.access_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type credential_type NOT NULL DEFAULT 'qr',
  token_hash TEXT NOT NULL,
  status credential_status NOT NULL DEFAULT 'active',
  rotate_interval_minutes INT DEFAULT 30,
  last_rotated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Devices
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  type device_type NOT NULL DEFAULT 'henry_turnstile',
  name TEXT NOT NULL,
  location TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Access Logs
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  credential_id UUID REFERENCES public.access_credentials(id) ON DELETE SET NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  decision access_decision NOT NULL DEFAULT 'deny',
  reason TEXT,
  raw JSONB DEFAULT '{}'
);

-- 22. AI Generation Jobs
CREATE TABLE public.ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  status ai_job_status NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================

-- Check if user has a specific role (optionally in a gym)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check role within a specific gym
CREATE OR REPLACE FUNCTION public.has_gym_role(_user_id UUID, _gym_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND gym_id = _gym_id AND role = _role
  )
$$;

-- Get user's gym_id
CREATE OR REPLACE FUNCTION public.get_user_gym_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Check if user is owner/coach in a gym
CREATE OR REPLACE FUNCTION public.is_gym_staff(_user_id UUID, _gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND gym_id = _gym_id AND role IN ('owner', 'coach')
  )
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- GYMS: super_admin sees all, others see their own gym
CREATE POLICY "Super admin sees all gyms" ON public.gyms FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users see own gym" ON public.gyms FOR SELECT USING (id = public.get_user_gym_id(auth.uid()));
CREATE POLICY "Super admin manages gyms" ON public.gyms FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PROFILES: users see own profile, staff sees gym profiles
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Staff sees gym profiles" ON public.profiles FOR SELECT USING (public.is_gym_staff(auth.uid(), gym_id));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Staff manages gym profiles" ON public.profiles FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- USER_ROLES: only super_admin and owner can manage
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners manage gym roles" ON public.user_roles FOR ALL USING (
  public.has_gym_role(auth.uid(), gym_id, 'owner') OR public.has_role(auth.uid(), 'super_admin')
);

-- PLANS: visible to gym members, managed by staff
CREATE POLICY "Gym members see plans" ON public.plans FOR SELECT USING (gym_id = public.get_user_gym_id(auth.uid()));
CREATE POLICY "Staff manages plans" ON public.plans FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- MEMBERSHIPS
CREATE POLICY "Members see own membership" ON public.memberships FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages memberships" ON public.memberships FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- SUBSCRIPTIONS
CREATE POLICY "Members see own subscriptions" ON public.subscriptions FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages subscriptions" ON public.subscriptions FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- PAYMENTS
CREATE POLICY "Members see own payments" ON public.payments FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages payments" ON public.payments FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- EXERCISES: visible to gym, managed by staff
CREATE POLICY "Gym sees exercises" ON public.exercises FOR SELECT USING (gym_id = public.get_user_gym_id(auth.uid()));
CREATE POLICY "Staff manages exercises" ON public.exercises FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- WORKOUT_TEMPLATES
CREATE POLICY "Gym sees templates" ON public.workout_templates FOR SELECT USING (gym_id = public.get_user_gym_id(auth.uid()));
CREATE POLICY "Staff manages templates" ON public.workout_templates FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- WORKOUT_DAYS: access via template's gym
CREATE POLICY "Gym sees workout days" ON public.workout_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workout_templates wt WHERE wt.id = template_id AND wt.gym_id = public.get_user_gym_id(auth.uid()))
);
CREATE POLICY "Staff manages workout days" ON public.workout_days FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workout_templates wt WHERE wt.id = template_id AND public.is_gym_staff(auth.uid(), wt.gym_id))
);

-- WORKOUT_ITEMS: access via day's template's gym
CREATE POLICY "Gym sees workout items" ON public.workout_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workout_days wd
    JOIN public.workout_templates wt ON wt.id = wd.template_id
    WHERE wd.id = workout_day_id AND wt.gym_id = public.get_user_gym_id(auth.uid())
  )
);
CREATE POLICY "Staff manages workout items" ON public.workout_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workout_days wd
    JOIN public.workout_templates wt ON wt.id = wd.template_id
    WHERE wd.id = workout_day_id AND public.is_gym_staff(auth.uid(), wt.gym_id)
  )
);

-- ASSIGNED_WORKOUTS
CREATE POLICY "Members see own assigned workouts" ON public.assigned_workouts FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages assigned workouts" ON public.assigned_workouts FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- WORKOUT_SESSIONS
CREATE POLICY "Members see own sessions" ON public.workout_sessions FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Members insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "Members update own sessions" ON public.workout_sessions FOR UPDATE USING (member_id = auth.uid());
CREATE POLICY "Staff manages sessions" ON public.workout_sessions FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- WORKOUT_LOGS
CREATE POLICY "Members see own logs" ON public.workout_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.member_id = auth.uid())
);
CREATE POLICY "Members insert own logs" ON public.workout_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.member_id = auth.uid())
);
CREATE POLICY "Staff manages logs" ON public.workout_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND public.is_gym_staff(auth.uid(), ws.gym_id))
);

-- PROGRESS_METRICS
CREATE POLICY "Members see own metrics" ON public.progress_metrics FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Members insert own metrics" ON public.progress_metrics FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "Staff manages metrics" ON public.progress_metrics FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- BADGES
CREATE POLICY "Gym sees badges" ON public.badges FOR SELECT USING (gym_id = public.get_user_gym_id(auth.uid()));
CREATE POLICY "Staff manages badges" ON public.badges FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- MEMBER_BADGES
CREATE POLICY "Members see own badges" ON public.member_badges FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages member badges" ON public.member_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM public.badges b WHERE b.id = badge_id AND public.is_gym_staff(auth.uid(), b.gym_id))
);

-- ACCESS_CREDENTIALS
CREATE POLICY "Members see own credentials" ON public.access_credentials FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages credentials" ON public.access_credentials FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- DEVICES
CREATE POLICY "Staff sees devices" ON public.devices FOR SELECT USING (public.is_gym_staff(auth.uid(), gym_id));
CREATE POLICY "Staff manages devices" ON public.devices FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- ACCESS_LOGS
CREATE POLICY "Members see own access logs" ON public.access_logs FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Staff manages access logs" ON public.access_logs FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- AI_GENERATION_JOBS
CREATE POLICY "Staff sees ai jobs" ON public.ai_generation_jobs FOR SELECT USING (public.is_gym_staff(auth.uid(), gym_id));
CREATE POLICY "Staff manages ai jobs" ON public.ai_generation_jobs FOR ALL USING (public.is_gym_staff(auth.uid(), gym_id));

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_gym_id ON public.profiles(gym_id);
CREATE INDEX idx_user_roles_user_gym ON public.user_roles(user_id, gym_id);
CREATE INDEX idx_memberships_member ON public.memberships(member_id);
CREATE INDEX idx_memberships_gym ON public.memberships(gym_id);
CREATE INDEX idx_plans_gym ON public.plans(gym_id);
CREATE INDEX idx_exercises_gym ON public.exercises(gym_id);
CREATE INDEX idx_workout_templates_gym ON public.workout_templates(gym_id);
CREATE INDEX idx_assigned_workouts_member ON public.assigned_workouts(member_id);
CREATE INDEX idx_workout_sessions_member ON public.workout_sessions(member_id);
CREATE INDEX idx_payments_member ON public.payments(member_id);
CREATE INDEX idx_access_logs_gym ON public.access_logs(gym_id);
CREATE INDEX idx_access_logs_member ON public.access_logs(member_id);
CREATE INDEX idx_access_credentials_member ON public.access_credentials(member_id);
