
-- Add 'aftersales' to pancada_submodule enum
ALTER TYPE pancada_submodule ADD VALUE IF NOT EXISTS 'aftersales';

-- Agents table
CREATE TABLE pj_aftersales_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pj_aftersales_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage aftersales agents" ON pj_aftersales_agents FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view aftersales agents" ON pj_aftersales_agents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can view active aftersales agents" ON pj_aftersales_agents FOR SELECT USING (true);

-- Config table
CREATE TABLE pj_aftersales_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pj_aftersales_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage aftersales config" ON pj_aftersales_config FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view aftersales config" ON pj_aftersales_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can read aftersales password" ON pj_aftersales_config FOR SELECT USING (key = 'aftersales_password');

-- Insert default config values
INSERT INTO pj_aftersales_config (key, value, label) VALUES
  ('aftersales_password', '1234', 'Senha de acesso público'),
  ('ra_commission_pool', '600', 'Comissão total Reclame Aqui (R$)'),
  ('ra_top_bonus', '200', 'Bônus top resolvedor RA (R$)'),
  ('returns_commission', '200', 'Comissão devoluções (R$)');

-- Reclame Aqui cases
CREATE TABLE pj_reclame_aqui (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_date date NOT NULL,
  complaint_link text,
  client_name text NOT NULL,
  problem_summary text NOT NULL,
  origin text,
  resolved_by_agent_id uuid REFERENCES pj_aftersales_agents(id),
  status text NOT NULL DEFAULT 'Em andamento',
  conclusion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pj_reclame_aqui ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage reclame aqui" ON pj_reclame_aqui FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view reclame aqui" ON pj_reclame_aqui FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can insert reclame aqui" ON pj_reclame_aqui FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can view reclame aqui" ON pj_reclame_aqui FOR SELECT USING (true);
CREATE POLICY "Anon can update reclame aqui" ON pj_reclame_aqui FOR UPDATE USING (true);

-- Returns table
CREATE TABLE pj_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_date date NOT NULL,
  reason text NOT NULL,
  error_source text,
  products text,
  client_data text NOT NULL,
  received_value numeric NOT NULL DEFAULT 0,
  refund_value numeric NOT NULL DEFAULT 0,
  agent_id uuid REFERENCES pj_aftersales_agents(id),
  refund_agent_id uuid REFERENCES pj_aftersales_agents(id),
  status text NOT NULL DEFAULT 'Aguardando estorno',
  max_refund_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pj_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage returns" ON pj_returns FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view returns" ON pj_returns FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can insert returns" ON pj_returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can view returns" ON pj_returns FOR SELECT USING (true);
CREATE POLICY "Anon can update returns" ON pj_returns FOR UPDATE USING (true);

-- Resends table
CREATE TABLE pj_resends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_date date NOT NULL,
  reason text NOT NULL,
  error_source text,
  products text NOT NULL,
  client_data text NOT NULL,
  received_value numeric NOT NULL DEFAULT 0,
  agent_id uuid REFERENCES pj_aftersales_agents(id),
  status text NOT NULL DEFAULT 'Resolvido',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pj_resends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage resends" ON pj_resends FOR ALL USING (is_admin_user());
CREATE POLICY "Authenticated users can view resends" ON pj_resends FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anon can insert resends" ON pj_resends FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can view resends" ON pj_resends FOR SELECT USING (true);
CREATE POLICY "Anon can update resends" ON pj_resends FOR UPDATE USING (true);
