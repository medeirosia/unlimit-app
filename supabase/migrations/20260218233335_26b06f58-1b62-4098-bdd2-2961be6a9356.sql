
-- Allow anon users to read drop-related pricing config (password, fees)
CREATE POLICY "Anon can read drop config"
ON public.pj_pricing_config
FOR SELECT
TO anon
USING (key IN ('drop_access_password', 'drop_fee_percentage', 'drop_fixed_cost_per_sale'));

-- Allow anon users full access to drop days (create, view, close)
CREATE POLICY "Anon can view drop days"
ON public.pj_drop_days
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can create drop days"
ON public.pj_drop_days
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update drop days"
ON public.pj_drop_days
FOR UPDATE
TO anon
USING (true);

-- Allow anon users full access to drop sales
CREATE POLICY "Anon can view drop sales"
ON public.pj_drop_sales
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can create drop sales"
ON public.pj_drop_sales
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update drop sales"
ON public.pj_drop_sales
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anon can delete drop sales"
ON public.pj_drop_sales
FOR DELETE
TO anon
USING (true);

-- Allow anon users full access to drop sale items
CREATE POLICY "Anon can view drop sale items"
ON public.pj_drop_sale_items
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can create drop sale items"
ON public.pj_drop_sale_items
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can update drop sale items"
ON public.pj_drop_sale_items
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anon can delete drop sale items"
ON public.pj_drop_sale_items
FOR DELETE
TO anon
USING (true);
