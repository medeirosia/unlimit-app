
CREATE POLICY "Authenticated users can insert products"
ON public.pj_products FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
ON public.pj_products FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);
