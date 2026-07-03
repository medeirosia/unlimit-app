
-- Global supplier lead time config
INSERT INTO pj_pricing_config (key, label, value) 
VALUES ('supplier_lead_days', 'Prazo médio de entrega do fornecedor (dias)', 30)
ON CONFLICT DO NOTHING;

-- Replenishment plans (one per month)
CREATE TABLE public.pj_replenishment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES pj_inventory_reports(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  budget NUMERIC NOT NULL DEFAULT 0,
  total_decided_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finalized_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.pj_replenishment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage replenishment plans" ON public.pj_replenishment_plans FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view replenishment plans" ON public.pj_replenishment_plans FOR SELECT USING (auth.uid() IS NOT NULL);

-- Replenishment items (decisions per product)
CREATE TABLE public.pj_replenishment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES pj_replenishment_plans(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES pj_inventory_items(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  quantity_out NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  avg_daily_sales NUMERIC NOT NULL DEFAULT 0,
  days_of_stock NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  suggested_qty NUMERIC NOT NULL DEFAULT 0,
  decided_qty NUMERIC NOT NULL DEFAULT 0,
  action TEXT NOT NULL DEFAULT 'repor',
  decided_cost NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_replenishment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage replenishment items" ON public.pj_replenishment_items FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view replenishment items" ON public.pj_replenishment_items FOR SELECT USING (auth.uid() IS NOT NULL);
