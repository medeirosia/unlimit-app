
-- Table to store each imported report (one per import)
CREATE TABLE public.pj_inventory_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_date DATE NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  total_restock_cost NUMERIC NOT NULL DEFAULT 0,
  total_inventory_value NUMERIC NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  matched_items INTEGER NOT NULL DEFAULT 0,
  unmatched_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store each line item from the imported spreadsheet
CREATE TABLE public.pj_inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.pj_inventory_reports(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity_out NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  restock_cost NUMERIC NOT NULL DEFAULT 0,
  inventory_value NUMERIC NOT NULL DEFAULT 0,
  matched_product_id UUID REFERENCES public.pj_products(id) ON DELETE SET NULL,
  match_type TEXT NOT NULL DEFAULT 'unmatched',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pj_inventory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pj_inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin can manage inventory reports"
  ON public.pj_inventory_reports FOR ALL
  USING (is_admin_user());

CREATE POLICY "Authenticated users can view inventory reports"
  ON public.pj_inventory_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage inventory items"
  ON public.pj_inventory_items FOR ALL
  USING (is_admin_user());

CREATE POLICY "Authenticated users can view inventory items"
  ON public.pj_inventory_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Index for faster queries
CREATE INDEX idx_pj_inventory_items_report_id ON public.pj_inventory_items(report_id);
CREATE INDEX idx_pj_inventory_reports_period ON public.pj_inventory_reports(period_year, period_month);
