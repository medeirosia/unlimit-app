
-- Allow authenticated non-admin users to update drop days (mark as verified, close, reopen)
CREATE POLICY "Authenticated users can update drop days"
ON public.pj_drop_days
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated non-admin users to delete drop days
CREATE POLICY "Authenticated users can delete drop days"
ON public.pj_drop_days
FOR DELETE
TO authenticated
USING (true);

-- Also fix pj_drop_sales for authenticated users (delete)
CREATE POLICY "Authenticated users can delete drop sales"
ON public.pj_drop_sales
FOR DELETE
TO authenticated
USING (true);

-- Also fix pj_drop_sale_items for authenticated users (delete via cascade)
CREATE POLICY "Authenticated users can delete drop sale items"
ON public.pj_drop_sale_items
FOR DELETE
TO authenticated
USING (true);
