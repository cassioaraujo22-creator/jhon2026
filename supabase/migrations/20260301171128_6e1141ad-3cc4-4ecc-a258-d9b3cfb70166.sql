-- Add personal_trainer_id to plans table
ALTER TABLE public.plans
ADD COLUMN personal_trainer_id uuid REFERENCES public.profiles(id);

-- Create index for faster lookups
CREATE INDEX idx_plans_personal_trainer ON public.plans(personal_trainer_id);
