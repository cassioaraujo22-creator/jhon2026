
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
  _steps int;
  _existing_goal int;
  _weekly_goal int;
BEGIN
  SELECT gym_id INTO _gym_id FROM profiles WHERE id = _user_id;
  IF _gym_id IS NULL THEN RETURN; END IF;

  SELECT calories_goal, weekly_workout_goal INTO _existing_goal, _weekly_goal
  FROM user_daily_metrics
  WHERE user_id = _user_id
  ORDER BY day DESC LIMIT 1;

  _existing_goal := COALESCE(_existing_goal, 2500);
  _weekly_goal := COALESCE(_weekly_goal, 5);

  SELECT COUNT(*) INTO _workouts_today
  FROM workout_sessions
  WHERE member_id = _user_id AND date = _day AND status = 'done';

  SELECT COUNT(*) INTO _workouts_week
  FROM workout_sessions
  WHERE member_id = _user_id
    AND date >= date_trunc('week', _day::timestamp)::date
    AND status = 'done';

  -- Aggregate from workout_logs with step estimation
  -- Cardio exercises (category contains 'cardio' or muscle_group contains 'cardio'): ~120 steps/min
  -- Strength/other exercises: ~30 steps/min (movement between machines, rest walking)
  SELECT
    COALESCE(SUM(
      CASE WHEN wl.calories_estimated > 0 THEN wl.calories_estimated 
      ELSE ROUND((wl.duration_seconds::numeric / 60) * 8) END
    ), 0),
    COALESCE(SUM(wl.duration_seconds) / 60, 0),
    COALESCE(SUM(wl.duration_seconds) / 60, 0),
    COALESCE(SUM(
      CASE 
        WHEN LOWER(COALESCE(e.category, '')) LIKE '%cardio%' 
          OR LOWER(COALESCE(e.muscle_group, '')) LIKE '%cardio%'
          OR LOWER(COALESCE(e.name, '')) LIKE '%corrida%'
          OR LOWER(COALESCE(e.name, '')) LIKE '%esteira%'
          OR LOWER(COALESCE(e.name, '')) LIKE '%bicicleta%'
          OR LOWER(COALESCE(e.name, '')) LIKE '%elíptico%'
          OR LOWER(COALESCE(e.name, '')) LIKE '%pular corda%'
        THEN ROUND((wl.duration_seconds::numeric / 60) * 120)
        ELSE ROUND((wl.duration_seconds::numeric / 60) * 30)
      END
    ), 0)
  INTO _calories, _active_mins, _workout_mins, _steps
  FROM workout_logs wl
  JOIN workout_sessions ws ON ws.id = wl.session_id
  LEFT JOIN exercises e ON e.id = wl.exercise_id
  WHERE ws.member_id = _user_id AND ws.date = _day AND ws.status = 'done';

  IF _workout_mins > 0 THEN
    _intensity := LEAST(100, ROUND((_calories::numeric / _workout_mins) * 10));
  ELSE
    _intensity := 0;
  END IF;

  -- Streak: consecutive days with at least 1 done session
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

  _distance := ROUND(_steps::numeric / 1300, 2); -- ~1300 steps per km average

  INSERT INTO user_daily_metrics (
    gym_id, user_id, day,
    calories_burned, calories_goal,
    active_minutes, workout_time_minutes,
    workouts_completed_today, workouts_completed_week,
    streak_days, intensity_score,
    distance_km, steps, weekly_workout_goal,
    updated_at
  ) VALUES (
    _gym_id, _user_id, _day,
    _calories, _existing_goal,
    _active_mins, _workout_mins,
    _workouts_today, _workouts_week,
    _streak, _intensity,
    _distance, _steps, _weekly_goal,
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
    steps = EXCLUDED.steps,
    updated_at = now();
END;
$$;
