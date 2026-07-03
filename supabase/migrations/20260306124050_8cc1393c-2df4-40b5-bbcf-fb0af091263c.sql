
CREATE POLICY "Authenticated users can delete replenishment plans"
ON public.pj_replenishment_plans
FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete replenishment items"
ON public.pj_replenishment_items
FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);
