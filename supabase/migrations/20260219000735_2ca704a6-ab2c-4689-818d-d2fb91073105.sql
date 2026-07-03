
-- Adicionar 'cashflow' ao enum pancada_submodule
ALTER TYPE public.pancada_submodule ADD VALUE IF NOT EXISTS 'cashflow';

-- Tabela de fechamentos mensais
CREATE TABLE public.pj_cashflow_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  net_result NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_month, period_year)
);

-- Tabela de entradas importadas
CREATE TABLE public.pj_cashflow_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.pj_cashflow_reports(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  client TEXT,
  cpf TEXT,
  category TEXT,
  description TEXT,
  entry_type TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  bank TEXT,
  period TEXT,
  external_id TEXT,
  is_ignored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de saídas importadas
CREATE TABLE public.pj_cashflow_exits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.pj_cashflow_reports(id) ON DELETE CASCADE,
  exit_date DATE NOT NULL,
  client TEXT,
  cpf TEXT,
  category TEXT,
  description TEXT,
  exit_type TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  bank TEXT,
  period TEXT,
  external_id TEXT,
  is_ignored BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para pj_cashflow_reports
ALTER TABLE public.pj_cashflow_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage cashflow reports" ON public.pj_cashflow_reports FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view cashflow reports" ON public.pj_cashflow_reports FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS para pj_cashflow_entries
ALTER TABLE public.pj_cashflow_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage cashflow entries" ON public.pj_cashflow_entries FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view cashflow entries" ON public.pj_cashflow_entries FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS para pj_cashflow_exits
ALTER TABLE public.pj_cashflow_exits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage cashflow exits" ON public.pj_cashflow_exits FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view cashflow exits" ON public.pj_cashflow_exits FOR SELECT USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_cashflow_entries_report ON public.pj_cashflow_entries(report_id);
CREATE INDEX idx_cashflow_exits_report ON public.pj_cashflow_exits(report_id);
CREATE INDEX idx_cashflow_reports_period ON public.pj_cashflow_reports(period_year, period_month);
