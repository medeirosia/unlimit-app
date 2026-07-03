
-- Create dedicated exchanges table
CREATE TABLE public.pj_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exchange_date DATE NOT NULL,
  exchange_type TEXT NOT NULL DEFAULT 'troca_com_devolucao',
  -- Client info
  client_data TEXT NOT NULL,
  -- Products
  product_returned TEXT,
  product_sent TEXT NOT NULL,
  -- Shipping
  return_shipping TEXT NOT NULL DEFAULT 'na',
  send_shipping TEXT NOT NULL DEFAULT 'loja',
  -- Financials
  received_value NUMERIC NOT NULL DEFAULT 0,
  store_cost NUMERIC NOT NULL DEFAULT 0,
  -- Attribution
  agent_id UUID REFERENCES public.pj_aftersales_agents(id),
  error_source TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'Em andamento',
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pj_exchanges ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as pj_resends)
CREATE POLICY "Admin can manage exchanges" ON public.pj_exchanges FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view exchanges" ON public.pj_exchanges FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can insert exchanges" ON public.pj_exchanges FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update exchanges" ON public.pj_exchanges FOR UPDATE USING (true);
CREATE POLICY "Anon can view exchanges" ON public.pj_exchanges FOR SELECT USING (true);

-- Migrate existing exchange records from pj_resends
INSERT INTO public.pj_exchanges (exchange_date, exchange_type, client_data, product_returned, product_sent, received_value, agent_id, error_source, status, created_at)
SELECT 
  resend_date,
  'troca_com_devolucao',
  client_data,
  NULL,
  products,
  received_value,
  agent_id,
  error_source,
  status,
  created_at
FROM public.pj_resends
WHERE reason IN ('Trocas', 'Troca');

-- Remove migrated records from pj_resends
DELETE FROM public.pj_resends WHERE reason IN ('Trocas', 'Troca');
