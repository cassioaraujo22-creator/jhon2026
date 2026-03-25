
-- Extended coach profile data
CREATE TABLE public.coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  bio text,
  specialties text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  instagram text,
  whatsapp text,
  available_for_chat boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Members can see coaches in their gym
CREATE POLICY "Gym members see coach profiles"
ON public.coach_profiles FOR SELECT
USING (gym_id = get_user_gym_id(auth.uid()));

-- Staff manages coach profiles
CREATE POLICY "Staff manages coach profiles"
ON public.coach_profiles FOR ALL
USING (is_gym_staff(auth.uid(), gym_id));

-- Coaches update own profile
CREATE POLICY "Coaches update own profile"
ON public.coach_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
