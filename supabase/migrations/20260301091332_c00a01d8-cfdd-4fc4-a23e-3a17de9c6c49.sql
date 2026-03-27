
-- Fix auto_create_credential to use extensions schema
CREATE OR REPLACE FUNCTION public.auto_create_credential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.access_credentials
      WHERE member_id = NEW.member_id AND gym_id = NEW.gym_id AND status = 'active'
    ) THEN
      INSERT INTO public.access_credentials (member_id, gym_id, token_hash, type, status)
      VALUES (
        NEW.member_id,
        NEW.gym_id,
        encode(extensions.gen_random_bytes(16), 'hex'),
        'qr',
        'active'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Now fix the existing user
UPDATE public.profiles SET gym_id = '00000000-0000-0000-0000-000000000001' WHERE id = '68be9e07-f19c-4009-8ff5-bf841847ad11' AND gym_id IS NULL;

INSERT INTO public.user_roles (user_id, gym_id, role)
VALUES ('68be9e07-f19c-4009-8ff5-bf841847ad11', '00000000-0000-0000-0000-000000000001', 'member')
ON CONFLICT DO NOTHING;

INSERT INTO public.memberships (member_id, gym_id, status)
VALUES ('68be9e07-f19c-4009-8ff5-bf841847ad11', '00000000-0000-0000-0000-000000000001', 'active');
