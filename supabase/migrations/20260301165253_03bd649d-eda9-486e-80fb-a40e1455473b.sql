
-- Create user_daily_metrics table
CREATE TABLE public.user_daily_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  day date NOT NULL DEFAULT CURRENT_DATE,
  calories_burned int NOT NULL DEFAULT 0,
  calories_goal int NOT NULL DEFAULT 2500,
  active_minutes int NOT NULL DEFAULT 0,
  steps int NOT NULL DEFAULT 0,
  distance_km numeric NOT NULL DEFAULT 0,
  avg_pace text,
  workout_time_minutes int NOT NULL DEFAULT 0,
  workouts_completed_today int NOT NULL DEFAULT 0,
  workouts_completed_week int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  intensity_score int NOT NULL DEFAULT 0,
  weekly_workout_goal int NOT NULL DEFAULT 5,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Enable RLS
ALTER TABLE public.user_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users see own metrics"
  ON public.user_daily_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users upsert own metrics"
  ON public.user_daily_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own metrics"
  ON public.user_daily_metrics FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Staff manages metrics"
  ON public.user_daily_metrics FOR ALL
  USING (is_gym_staff(auth.uid(), gym_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_daily_metrics;

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION public.calculate_daily_metrics(_user_id uuid, _day date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _gym_id uuid;
  _calories int;
  _active_mins int;
  _workout_mins int;
  _workouts_today int;
  _workouts_week int;
  _intensity int;
  _streak int;
  _distance numeric;
  _existing_goal int;
  _weekly_goal int;
BEGIN
  SELECT gym_id INTO _gym_id FROM profiles WHERE id = _user_id;
  IF _gym_id IS NULL THEN RETURN; END IF;

  -- Get existing goals if any
  SELECT calories_goal, weekly_workout_goal INTO _existing_goal, _weekly_goal
  FROM user_daily_metrics
  WHERE user_id = _user_id
  ORDER BY day DESC LIMIT 1;

  _existing_goal := COALESCE(_existing_goal, 2500);
  _weekly_goal := COALESCE(_weekly_goal, 5);

  -- Sessions done today
  SELECT COUNT(*) INTO _workouts_today
  FROM workout_sessions
  WHERE member_id = _user_id AND date = _day AND status = 'done';

  -- Sessions done this week
  SELECT COUNT(*) INTO _workouts_week
  FROM workout_sessions
  WHERE member_id = _user_id
    AND date >= date_trunc('week', _day::timestamp)::date
    AND status = 'done';

  -- Aggregate from workout_logs
  SELECT
    COALESCE(SUM(CASE WHEN wl.calories_estimated > 0 THEN wl.calories_estimated ELSE ROUND((wl.duration_seconds::numeric / 60) * 8) END), 0),
    COALESCE(SUM(wl.duration_seconds) / 60, 0),
    COALESCE(SUM(wl.duration_seconds) / 60, 0)
  INTO _calories, _active_mins, _workout_mins
  FROM workout_logs wl
  JOIN workout_sessions ws ON ws.id = wl.session_id
  WHERE ws.member_id = _user_id AND ws.date = _day AND ws.status = 'done';

  -- Intensity score (simple: calories per minute * scaling)
  IF _workout_mins > 0 THEN
    _intensity := LEAST(100, ROUND((_calories::numeric / _workout_mins) * 10));
  ELSE
    _intensity := 0;
  END IF;

  -- Streak calculation
  SELECT COUNT(*) INTO _streak
  FROM (
    SELECT date
    FROM workout_sessions
    WHERE member_id = _user_id AND status = 'done' AND date <= _day
    GROUP BY date
    ORDER BY date DESC
  ) sub
  WHERE date >= _day - (ROW_NUMBER() OVER (ORDER BY date DESC) - 1)::int;

  -- Simplified streak: count consecutive days backwards
  WITH daily AS (
    SELECT DISTINCT date FROM workout_sessions
    WHERE member_id = _user_id AND status = 'done' AND date <= _day
    ORDER BY date DESC
  ),
  numbered AS (
    SELECT date, _day - date::date AS gap, ROW_NUMBER() OVER (ORDER BY date DESC) - 1 AS rn
    FROM daily
  )
  SELECT COUNT(*) INTO _streak FROM numbered WHERE gap = rn;

  -- Distance (estimate for cardio-like exercises)
  _distance := ROUND(_active_mins * 0.1, 2);

  -- Upsert
  INSERT INTO user_daily_metrics (
    gym_id, user_id, day,
    calories_burned, calories_goal,
    active_minutes, workout_time_minutes,
    workouts_completed_today, workouts_completed_week,
    streak_days, intensity_score,
    distance_km, weekly_workout_goal,
    updated_at
  ) VALUES (
    _gym_id, _user_id, _day,
    _calories, _existing_goal,
    _active_mins, _workout_mins,
    _workouts_today, _workouts_week,
    _streak, _intensity,
    _distance, _weekly_goal,
    now()
  )
  ON CONFLICT (user_id, day) DO UPDATE SET
    calories_burned = EXCLUDED.calories_burned,
    active_minutes = EXCLUDED.active_minutes,
    workout_time_minutes = EXCLUDED.workout_time_minutes,
    workouts_completed_today = EXCLUDED.workouts_completed_today,
    workouts_completed_week = EXCLUDED.workouts_completed_week,
    streak_days = EXCLUDED.streak_days,
    intensity_score = EXCLUDED.intensity_score,
    distance_km = EXCLUDED.distance_km,
    updated_at = now();
END;
$$;

-- Trigger: auto-recalculate when workout_sessions changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM calculate_daily_metrics(
    COALESCE(NEW.member_id, OLD.member_id),
    COALESCE(NEW.date, OLD.date)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalc_metrics_on_session
AFTER INSERT OR UPDATE OR DELETE ON public.workout_sessions
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_metrics();
