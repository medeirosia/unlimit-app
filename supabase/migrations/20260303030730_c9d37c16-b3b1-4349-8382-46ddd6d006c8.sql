
-- Add due_date and is_preview to pj_shipping_reports
ALTER TABLE public.pj_shipping_reports
  ADD COLUMN due_date date,
  ADD COLUMN is_preview boolean NOT NULL DEFAULT false;

-- Create unique constraint: only one real invoice (not preview) per carrier+due_date
-- Previews can coexist temporarily but will be replaced
CREATE UNIQUE INDEX idx_shipping_reports_carrier_due_date 
  ON public.pj_shipping_reports (carrier_name, due_date) 
  WHERE is_preview = false;

-- Index for preview lookups
CREATE INDEX idx_shipping_reports_preview 
  ON public.pj_shipping_reports (carrier_name, is_preview);
