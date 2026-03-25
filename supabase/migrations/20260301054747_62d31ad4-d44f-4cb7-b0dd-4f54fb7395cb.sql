ALTER TABLE workout_sessions
  DROP CONSTRAINT workout_sessions_assigned_workout_id_fkey;

ALTER TABLE workout_sessions
  ADD CONSTRAINT workout_sessions_assigned_workout_id_fkey
  FOREIGN KEY (assigned_workout_id) REFERENCES assigned_workouts(id) ON DELETE CASCADE;