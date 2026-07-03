
-- Tabela de relatórios de frete (uma por importação/transportadora/período)
CREATE TABLE public.pj_shipping_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_name TEXT NOT NULL DEFAULT 'Correios',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_shipping_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage shipping reports" ON public.pj_shipping_reports FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view shipping reports" ON public.pj_shipping_reports FOR SELECT USING (auth.uid() IS NOT NULL);

-- Tabela de itens de frete (cada envio individual)
CREATE TABLE public.pj_shipping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.pj_shipping_reports(id) ON DELETE CASCADE,
  posting_date DATE NOT NULL,
  tracking_code TEXT,
  recipient TEXT,
  weight NUMERIC DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_shipping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage shipping items" ON public.pj_shipping_items FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view shipping items" ON public.pj_shipping_items FOR SELECT USING (auth.uid() IS NOT NULL);

-- Index para busca por mês
CREATE INDEX idx_shipping_items_posting_date ON public.pj_shipping_items(posting_date);
CREATE INDEX idx_shipping_items_report_id ON public.pj_shipping_items(report_id);
