
-- Table to track RA commission payments per month (delta tracking)
CREATE TABLE public.pj_ra_commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  efficiency NUMERIC NOT NULL DEFAULT 0,
  pool_config_value NUMERIC NOT NULL DEFAULT 600,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  agent_payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.pj_ra_commission_payments ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admin can manage ra commission payments"
ON public.pj_ra_commission_payments
FOR ALL
USING (is_admin_user());

-- Authenticated users can view
CREATE POLICY "Authenticated users can view ra commission payments"
ON public.pj_ra_commission_payments
FOR SELECT
USING (auth.uid() IS NOT NULL);
