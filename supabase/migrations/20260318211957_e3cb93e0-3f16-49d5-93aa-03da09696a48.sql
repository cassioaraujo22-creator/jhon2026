
-- Drop and recreate all foreign keys referencing profiles with ON DELETE CASCADE

-- memberships.member_id
ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_member_id_fkey;
ALTER TABLE public.memberships ADD CONSTRAINT memberships_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- assigned_workouts.member_id
ALTER TABLE public.assigned_workouts DROP CONSTRAINT IF EXISTS assigned_workouts_member_id_fkey;
ALTER TABLE public.assigned_workouts ADD CONSTRAINT assigned_workouts_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- access_credentials.member_id
ALTER TABLE public.access_credentials DROP CONSTRAINT IF EXISTS access_credentials_member_id_fkey;
ALTER TABLE public.access_credentials ADD CONSTRAINT access_credentials_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- access_logs.member_id
ALTER TABLE public.access_logs DROP CONSTRAINT IF EXISTS access_logs_member_id_fkey;
ALTER TABLE public.access_logs ADD CONSTRAINT access_logs_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- payments.member_id
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- subscriptions.member_id
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_member_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- workout_sessions.member_id
ALTER TABLE public.workout_sessions DROP CONSTRAINT IF EXISTS workout_sessions_member_id_fkey;
ALTER TABLE public.workout_sessions ADD CONSTRAINT workout_sessions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- progress_metrics.member_id
ALTER TABLE public.progress_metrics DROP CONSTRAINT IF EXISTS progress_metrics_member_id_fkey;
ALTER TABLE public.progress_metrics ADD CONSTRAINT progress_metrics_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- member_badges.member_id
ALTER TABLE public.member_badges DROP CONSTRAINT IF EXISTS member_badges_member_id_fkey;
ALTER TABLE public.member_badges ADD CONSTRAINT member_badges_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- notifications.user_id
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_daily_metrics.user_id
ALTER TABLE public.user_daily_metrics DROP CONSTRAINT IF EXISTS user_daily_metrics_user_id_fkey;
ALTER TABLE public.user_daily_metrics ADD CONSTRAINT user_daily_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_roles.user_id (references auth.users, but also needs cascade)
-- Note: user_roles doesn't reference profiles, it likely references auth.users directly

-- coach_profiles.user_id
ALTER TABLE public.coach_profiles DROP CONSTRAINT IF EXISTS coach_profiles_user_id_fkey;
ALTER TABLE public.coach_profiles ADD CONSTRAINT coach_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- store_cart_items.member_id
ALTER TABLE public.store_cart_items DROP CONSTRAINT IF EXISTS store_cart_items_member_id_fkey;
ALTER TABLE public.store_cart_items ADD CONSTRAINT store_cart_items_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- store_orders.member_id
ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_member_id_fkey;
ALTER TABLE public.store_orders ADD CONSTRAINT store_orders_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ai_generation_jobs.requested_by
ALTER TABLE public.ai_generation_jobs DROP CONSTRAINT IF EXISTS ai_generation_jobs_requested_by_fkey;
ALTER TABLE public.ai_generation_jobs ADD CONSTRAINT ai_generation_jobs_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- workout_templates.created_by
ALTER TABLE public.workout_templates DROP CONSTRAINT IF EXISTS workout_templates_created_by_fkey;
ALTER TABLE public.workout_templates ADD CONSTRAINT workout_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- plans.personal_trainer_id
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_personal_trainer_id_fkey;
ALTER TABLE public.plans ADD CONSTRAINT plans_personal_trainer_id_fkey FOREIGN KEY (personal_trainer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
