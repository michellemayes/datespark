-- Add update policy for saved_date_ideas so users can update journal entries
CREATE POLICY "Users can update own saved ideas"
ON public.saved_date_ideas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);