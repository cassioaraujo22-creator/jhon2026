CREATE POLICY "Owners update own gym"
ON public.gyms
FOR UPDATE
TO authenticated
USING (has_gym_role(auth.uid(), id, 'owner'::app_role))
WITH CHECK (has_gym_role(auth.uid(), id, 'owner'::app_role));