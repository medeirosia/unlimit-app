
ALTER TABLE public.pj_cashflow_reports
  ADD COLUMN total_sales_count integer NOT NULL DEFAULT 0,
  ADD COLUMN gateway_fees numeric NOT NULL DEFAULT 0;
