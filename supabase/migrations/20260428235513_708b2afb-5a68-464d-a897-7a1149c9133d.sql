ALTER TABLE public.pj_products
ADD COLUMN IF NOT EXISTS purchase_type text NOT NULL DEFAULT 'bruto';

COMMENT ON COLUMN public.pj_products.purchase_type IS 'bruto = produto comprado bruto (peso + custo bruto + banho); pronto = produto comprado pronto (apenas custo total, sem banho)';