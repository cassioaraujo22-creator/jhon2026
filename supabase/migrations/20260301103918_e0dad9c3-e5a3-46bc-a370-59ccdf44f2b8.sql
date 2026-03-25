
-- When plan_id is set to NULL, auto-cancel membership and block credentials
CREATE OR REPLACE FUNCTION public.auto_cancel_on_plan_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when plan_id changes to NULL (was not null before)
  IF OLD.plan_id IS NOT NULL AND NEW.plan_id IS NULL THEN
    -- Cancel the membership
    NEW.status := 'cancelled';
    
    -- Block all active credentials for this member+gym
    UPDATE public.access_credentials
    SET status = 'blocked'
    WHERE member_id = NEW.member_id
      AND gym_id = NEW.gym_id
      AND status = 'active';
  END IF;
  
  -- Also handle explicit status change to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.access_credentials
    SET status = 'blocked'
    WHERE member_id = NEW.member_id
      AND gym_id = NEW.gym_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_cancel_on_plan_removal
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.auto_cancel_on_plan_removal();
