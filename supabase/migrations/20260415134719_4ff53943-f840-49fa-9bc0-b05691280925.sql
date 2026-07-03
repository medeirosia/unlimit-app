CREATE POLICY "Authenticated users can delete products"
ON public.pj_products
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);