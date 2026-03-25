-- Create trigger to auto-recalculate daily metrics when workout sessions change
CREATE TRIGGER trg_recalculate_metrics_on_session
  AFTER INSERT OR UPDATE OF status ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_metrics();

-- Also recalculate when workout logs are inserted (for calories/duration)
CREATE OR REPLACE FUNCTION public.trigger_recalculate_metrics_from_log()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _member_id uuid;
  _session_date date;
BEGIN
  SELECT member_id, date INTO _member_id, _session_date
  FROM workout_sessions
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);

  IF _member_id IS NOT NULL THEN
    PERFORM calculate_daily_metrics(_member_id, _session_date);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalculate_metrics_on_log
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_metrics_from_log();
