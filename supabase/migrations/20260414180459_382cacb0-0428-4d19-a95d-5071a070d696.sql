
-- Add pricing_status to pj_products
ALTER TABLE public.pj_products 
ADD COLUMN pricing_status text NOT NULL DEFAULT 'aguardando_precificacao';

-- Set existing products with sale_price to 'atualizado'
UPDATE public.pj_products SET pricing_status = 'atualizado' WHERE sale_price IS NOT NULL AND sale_price > 0;

-- Create price history table
CREATE TABLE public.pj_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.pj_products(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric,
  old_status text,
  new_status text,
  changed_by uuid,
  change_type text NOT NULL DEFAULT 'price_change',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pj_price_history ENABLE ROW LEVEL SECURITY;

-- Policies for price history
CREATE POLICY "Authenticated users can view price history"
ON public.pj_price_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert price history"
ON public.pj_price_history FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admin can manage
CREATE POLICY "Admin can manage price history"
ON public.pj_price_history FOR ALL
USING (is_admin_user());

-- Create index for fast lookups
CREATE INDEX idx_pj_price_history_product_id ON public.pj_price_history(product_id);
CREATE INDEX idx_pj_price_history_created_at ON public.pj_price_history(created_at DESC);

-- Trigger function to auto-log price changes and reset status
CREATE OR REPLACE FUNCTION public.log_product_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if sale_price actually changed
  IF OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
    INSERT INTO pj_price_history (product_id, old_price, new_price, old_status, new_status, changed_by, change_type)
    VALUES (NEW.id, OLD.sale_price, NEW.sale_price, OLD.pricing_status, 'precificado', auth.uid(), 'price_change');
    
    -- Auto-set status to 'precificado' when price changes
    NEW.pricing_status := 'precificado';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger
CREATE TRIGGER trg_log_price_change
BEFORE UPDATE ON public.pj_products
FOR EACH ROW
EXECUTE FUNCTION public.log_product_price_change();
