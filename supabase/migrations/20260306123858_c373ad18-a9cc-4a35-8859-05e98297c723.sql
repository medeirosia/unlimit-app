
CREATE POLICY "Authenticated users can insert replenishment plans"
ON public.pj_replenishment_plans
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update replenishment plans"
ON public.pj_replenishment_plans
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert replenishment items"
ON public.pj_replenishment_items
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update replenishment items"
ON public.pj_replenishment_items
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);
