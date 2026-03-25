
-- Function to auto-generate a credential for a member when a membership is created
CREATE OR REPLACE FUNCTION public.auto_create_credential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create if membership is active and no active credential exists
  IF NEW.status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.access_credentials
      WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id AND status = 'active'
    ) THEN
      INSERT INTO public.access_credentials (member_id, gym_id, token_hash, type, status)
      VALUES (
        NEW.member_id,
        NEW.gym_id,
        encode(gen_random_bytes(16), 'hex'),
        'qr',
        'active'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: auto-create credential when membership is inserted
CREATE TRIGGER trg_auto_create_credential
AFTER INSERT ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_credential();
