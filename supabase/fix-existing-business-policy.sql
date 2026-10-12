-- Run once in the SQL Editor if you already applied the original migrations.
-- Owners must be able to SELECT their business before the first profile exists.
DROP POLICY IF EXISTS "select_own_business" ON public.businesses;
CREATE POLICY "select_own_business" ON public.businesses FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles WHERE profiles.business_id = businesses.id AND profiles.user_id = auth.uid()
));
