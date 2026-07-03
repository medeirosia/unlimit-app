
-- Tabela de chargebacks
CREATE TABLE public.pj_chargebacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chargeback_date date NOT NULL,
  client_name text NOT NULL,
  client_data text NOT NULL DEFAULT '',
  order_value numeric NOT NULL DEFAULT 0,
  chargeback_value numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Aberto',
  registered_by_agent_id uuid REFERENCES pj_aftersales_agents(id),
  recovery_agent_id uuid REFERENCES pj_aftersales_agents(id),
  recovery_date date,
  recovery_value numeric NOT NULL DEFAULT 0,
  recovery_notes text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_chargebacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage chargebacks" ON public.pj_chargebacks FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view chargebacks" ON public.pj_chargebacks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert chargebacks" ON public.pj_chargebacks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update chargebacks" ON public.pj_chargebacks FOR UPDATE USING (auth.uid() IS NOT NULL);
