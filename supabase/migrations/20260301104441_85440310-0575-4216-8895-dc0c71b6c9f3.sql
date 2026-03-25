
CREATE OR REPLACE FUNCTION public.auto_cancel_on_plan_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Plan removed → cancel + block credentials
  IF OLD.plan_id IS NOT NULL AND NEW.plan_id IS NULL THEN
    NEW.status := 'cancelled';
    UPDATE public.access_credentials
    SET status = 'blocked'
    WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id AND status = 'active';
  END IF;

  -- Plan added (was null or changed) → reactivate membership + credential
  IF NEW.plan_id IS NOT NULL AND (OLD.plan_id IS NULL OR OLD.plan_id != NEW.plan_id) AND OLD.status != 'active' THEN
    NEW.status := 'active';
    NEW.start_at := now();
    -- Reactivate or create credential
    IF EXISTS (
      SELECT 1 FROM public.access_credentials
      WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id
    ) THEN
      UPDATE public.access_credentials
      SET status = 'active'
      WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id AND status = 'blocked'
      AND id = (
        SELECT id FROM public.access_credentials
        WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id
        ORDER BY created_at DESC LIMIT 1
      );
    ELSE
      INSERT INTO public.access_credentials (member_id, gym_id, token_hash, type, status)
      VALUES (NEW.member_id, NEW.gym_id, encode(extensions.gen_random_bytes(16), 'hex'), 'qr', 'active');
    END IF;
  END IF;

  -- Explicit cancel
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.access_credentials
    SET status = 'blocked'
    WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;
