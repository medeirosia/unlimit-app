
-- Add new columns to pj_inventory_items for entries and previous balance
ALTER TABLE public.pj_inventory_items
  ADD COLUMN IF NOT EXISTS balance_before numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entries numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_cost numeric NOT NULL DEFAULT 0;

-- Add new columns to pj_inventory_reports for entry totals and previous inventory
ALTER TABLE public.pj_inventory_reports
  ADD COLUMN IF NOT EXISTS total_entry_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_previous_inventory_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inventory_variation numeric NOT NULL DEFAULT 0;
