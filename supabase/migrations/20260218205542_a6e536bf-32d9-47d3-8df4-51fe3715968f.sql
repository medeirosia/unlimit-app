
-- Table for dropshipping days/periods
CREATE TABLE public.pj_drop_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_drop_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage drop days" ON public.pj_drop_days FOR ALL USING (is_admin_user());
CREATE POLICY "Public can view open drop days" ON public.pj_drop_days FOR SELECT USING (true);

-- Table for dropshipping sales (one per client)
CREATE TABLE public.pj_drop_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.pj_drop_days(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  received_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_drop_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage drop sales" ON public.pj_drop_sales FOR ALL USING (is_admin_user());
CREATE POLICY "Anyone can view drop sales" ON public.pj_drop_sales FOR SELECT USING (true);
CREATE POLICY "Anyone can insert drop sales" ON public.pj_drop_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update drop sales" ON public.pj_drop_sales FOR UPDATE USING (true);

-- Table for items within each sale
CREATE TABLE public.pj_drop_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.pj_drop_sales(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_drop_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage drop sale items" ON public.pj_drop_sale_items FOR ALL USING (is_admin_user());
CREATE POLICY "Anyone can view drop sale items" ON public.pj_drop_sale_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert drop sale items" ON public.pj_drop_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update drop sale items" ON public.pj_drop_sale_items FOR UPDATE USING (true);

-- Store the access password in pj_pricing_config (reusing config table)
INSERT INTO public.pj_pricing_config (key, label, value) VALUES ('drop_access_password', 'Senha de Acesso DropShipping', 0);
