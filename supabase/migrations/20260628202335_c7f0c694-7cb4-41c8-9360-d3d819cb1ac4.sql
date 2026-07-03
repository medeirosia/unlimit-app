
-- =========================================================================
-- PARTE 1: NOVO SISTEMA DE PERMISSÕES
-- =========================================================================

-- Catálogo de chaves de permissão
CREATE TABLE public.permission_keys (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_dynamic BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.permission_keys TO authenticated;
GRANT ALL ON public.permission_keys TO service_role;
ALTER TABLE public.permission_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read permission_keys"
  ON public.permission_keys FOR SELECT TO authenticated USING (true);

-- Grupos de permissão (templates)
CREATE TABLE public.permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.permission_groups TO authenticated;
GRANT ALL ON public.permission_groups TO service_role;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read permission_groups"
  ON public.permission_groups FOR SELECT TO authenticated USING (true);

-- Itens (chaves) de cada grupo
CREATE TABLE public.permission_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permission_keys(key) ON DELETE CASCADE,
  resource_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, permission_key, resource_id)
);

CREATE INDEX idx_pgi_group ON public.permission_group_items(group_id);
GRANT SELECT ON public.permission_group_items TO authenticated;
GRANT ALL ON public.permission_group_items TO service_role;
ALTER TABLE public.permission_group_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read permission_group_items"
  ON public.permission_group_items FOR SELECT TO authenticated USING (true);

-- Overrides individuais (granted true = libera, false = bloqueia mesmo no grupo)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_key TEXT NOT NULL REFERENCES public.permission_keys(key) ON DELETE CASCADE,
  resource_id UUID NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key, resource_id)
);

CREATE INDEX idx_up_user ON public.user_permissions(user_id);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can read own permissions"
  ON public.user_permissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Grupo atual de cada usuário (1-pra-1)
CREATE TABLE public.user_permission_group (
  user_id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.permission_groups(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_permission_group TO authenticated;
GRANT ALL ON public.user_permission_group TO service_role;
ALTER TABLE public.user_permission_group ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can read own group assignment"
  ON public.user_permission_group FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================================
-- Função has_perm: override individual > grupo
-- =========================================================================

CREATE OR REPLACE FUNCTION public.has_perm(_user_id UUID, _key TEXT, _resource_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  override_val BOOLEAN;
  group_val BOOLEAN;
BEGIN
  -- 1) Override individual
  SELECT granted INTO override_val
  FROM user_permissions
  WHERE user_id = _user_id
    AND permission_key = _key
    AND resource_id IS NOT DISTINCT FROM _resource_id
  LIMIT 1;

  IF override_val IS NOT NULL THEN
    RETURN override_val;
  END IF;

  -- 2) Grupo
  SELECT EXISTS (
    SELECT 1
    FROM user_permission_group upg
    JOIN permission_group_items pgi ON pgi.group_id = upg.group_id
    WHERE upg.user_id = _user_id
      AND pgi.permission_key = _key
      AND pgi.resource_id IS NOT DISTINCT FROM _resource_id
  ) INTO group_val;

  RETURN COALESCE(group_val, false);
END;
$$;

-- Lista todas as chaves efetivas de um usuário (para carregar no front)
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(permission_key TEXT, resource_id UUID)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH from_group AS (
    SELECT pgi.permission_key, pgi.resource_id
    FROM user_permission_group upg
    JOIN permission_group_items pgi ON pgi.group_id = upg.group_id
    WHERE upg.user_id = _user_id
  ),
  overrides AS (
    SELECT permission_key, resource_id, granted
    FROM user_permissions
    WHERE user_id = _user_id
  )
  SELECT permission_key, resource_id FROM (
    SELECT fg.permission_key, fg.resource_id
    FROM from_group fg
    LEFT JOIN overrides o
      ON o.permission_key = fg.permission_key
     AND o.resource_id IS NOT DISTINCT FROM fg.resource_id
    WHERE o.granted IS NULL OR o.granted = true

    UNION

    SELECT permission_key, resource_id
    FROM overrides
    WHERE granted = true
  ) merged;
$$;

GRANT EXECUTE ON FUNCTION public.has_perm(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID) TO authenticated;

-- =========================================================================
-- SEED: catálogo de chaves
-- =========================================================================

INSERT INTO public.permission_keys (key, label, category, description, is_dynamic, sort_order) VALUES
  -- Início
  ('inicio.acessar',          'Acessar a rota Início',                'Início', 'Permite entrar em /inicio', false, 10),
  ('inicio.metricas_topo',    'Ver métricas do topo (Início)',        'Início', 'Cards de Faturamento, Investimento, ROAS, Lucro', false, 11),
  ('inicio.painel_geral',     'Aba: Painel Geral',                    'Início', NULL, false, 12),
  ('inicio.projetos',         'Aba: Projetos',                        'Início', NULL, false, 13),
  ('inicio.lancamentos',      'Aba: Lançamentos',                     'Início', NULL, false, 14),
  ('inicio.mentorias',        'Aba: Mentorias',                       'Início', NULL, false, 15),
  ('inicio.configuracoes',    'Aba: Configurações',                   'Início', NULL, false, 16),

  -- Financeiro
  ('financeiro.acessar',              'Acessar a rota Financeiro',        'Financeiro', NULL, false, 20),
  ('financeiro.metricas_topo',        'Ver métricas do topo (Financeiro)','Financeiro', NULL, false, 21),
  ('financeiro.contas.acessar',       'Aba: Contas',                      'Financeiro', NULL, false, 22),
  ('financeiro.contas.saldo_total',   'Ver saldo total consolidado',      'Financeiro', NULL, false, 23),
  ('financeiro.contas.editar',        'Criar/editar/arquivar contas',     'Financeiro', NULL, false, 24),
  ('financeiro.contas.ver_conta',     'Ver uma conta bancária específica','Financeiro', 'Chave dinâmica - uma por conta', true, 25),
  ('financeiro.lancamentos.acessar',  'Aba: Lançamentos',                 'Financeiro', NULL, false, 26),
  ('financeiro.pagar.acessar',        'Aba: Contas a Pagar',              'Financeiro', NULL, false, 27),
  ('financeiro.receber.acessar',      'Aba: Contas a Receber',            'Financeiro', NULL, false, 28),
  ('financeiro.saques.acessar',       'Aba: Saques Pendentes',            'Financeiro', NULL, false, 29),
  ('financeiro.relatorios.acessar',   'Aba: Relatórios',                  'Financeiro', NULL, false, 30),
  ('financeiro.configuracoes.acessar','Aba: Configurações',               'Financeiro', NULL, false, 31),

  -- Sistema
  ('sistema.gerenciar_permissoes', 'Gerenciar permissões e grupos', 'Sistema', 'Acesso à área de Permissões em Configurações', false, 90),
  ('sistema.gerenciar_usuarios',   'Criar e editar usuários',       'Sistema', NULL, false, 91);

-- =========================================================================
-- SEED: grupos pré-prontos
-- =========================================================================

INSERT INTO public.permission_groups (name, description, is_system) VALUES
  ('Acesso Total',                'Acesso completo ao sistema, incluindo gerência de permissões', true),
  ('Somente Início',              'Apenas a rota Início com todas as abas', true),
  ('Financeiro Completo',         'Acesso completo ao módulo Financeiro', true),
  ('Financeiro Restrito',         'Financeiro sem relatórios e sem configurações', true);

-- Acesso Total: tudo (exceto chaves dinâmicas, que são liberadas via trigger por conta)
INSERT INTO public.permission_group_items (group_id, permission_key)
SELECT g.id, k.key
FROM public.permission_groups g
CROSS JOIN public.permission_keys k
WHERE g.name = 'Acesso Total'
  AND k.is_dynamic = false;

-- Somente Início
INSERT INTO public.permission_group_items (group_id, permission_key)
SELECT g.id, k.key
FROM public.permission_groups g
CROSS JOIN public.permission_keys k
WHERE g.name = 'Somente Início'
  AND k.key IN (
    'inicio.acessar','inicio.metricas_topo','inicio.painel_geral',
    'inicio.projetos','inicio.lancamentos','inicio.mentorias','inicio.configuracoes'
  );

-- Financeiro Completo
INSERT INTO public.permission_group_items (group_id, permission_key)
SELECT g.id, k.key
FROM public.permission_groups g
CROSS JOIN public.permission_keys k
WHERE g.name = 'Financeiro Completo'
  AND k.category = 'Financeiro'
  AND k.is_dynamic = false;

-- Financeiro Restrito (sem relatórios e sem configurações)
INSERT INTO public.permission_group_items (group_id, permission_key)
SELECT g.id, k.key
FROM public.permission_groups g
CROSS JOIN public.permission_keys k
WHERE g.name = 'Financeiro Restrito'
  AND k.category = 'Financeiro'
  AND k.is_dynamic = false
  AND k.key NOT IN ('financeiro.relatorios.acessar','financeiro.configuracoes.acessar','financeiro.contas.editar');

-- =========================================================================
-- Chaves dinâmicas: uma por conta bancária existente
-- (liberadas no grupo Acesso Total)
-- =========================================================================

INSERT INTO public.permission_group_items (group_id, permission_key, resource_id)
SELECT g.id, 'financeiro.contas.ver_conta', ba.id
FROM public.permission_groups g
CROSS JOIN public.bank_accounts ba
WHERE g.name = 'Acesso Total';

-- Financeiro Completo e Restrito também veem todas as contas existentes por padrão
INSERT INTO public.permission_group_items (group_id, permission_key, resource_id)
SELECT g.id, 'financeiro.contas.ver_conta', ba.id
FROM public.permission_groups g
CROSS JOIN public.bank_accounts ba
WHERE g.name IN ('Financeiro Completo','Financeiro Restrito');

-- =========================================================================
-- Trigger: novas contas bancárias geram permissão automática
-- =========================================================================

CREATE OR REPLACE FUNCTION public.auto_grant_new_bank_account_permission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.permission_group_items (group_id, permission_key, resource_id)
  SELECT id, 'financeiro.contas.ver_conta', NEW.id
  FROM public.permission_groups
  WHERE name IN ('Acesso Total','Financeiro Completo','Financeiro Restrito')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bank_accounts_auto_perm
AFTER INSERT ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_new_bank_account_permission();

-- =========================================================================
-- Conversão dos usuários atuais
-- =========================================================================

-- Admin principal -> Acesso Total
INSERT INTO public.user_permission_group (user_id, group_id)
SELECT p.id, g.id
FROM public.profiles p
CROSS JOIN public.permission_groups g
WHERE p.email = 'matheusoliveira.comercial@gmail.com'
  AND g.name = 'Acesso Total'
ON CONFLICT (user_id) DO UPDATE SET group_id = EXCLUDED.group_id;

-- Demais usuários ativos: quem tem 'financial' -> Financeiro Completo; senão Somente Início
INSERT INTO public.user_permission_group (user_id, group_id)
SELECT
  p.id,
  CASE
    WHEN 'financial' = ANY(COALESCE(p.modulos_permitidos, ARRAY[]::text[])) THEN
      (SELECT id FROM public.permission_groups WHERE name = 'Financeiro Completo')
    ELSE
      (SELECT id FROM public.permission_groups WHERE name = 'Somente Início')
  END
FROM public.profiles p
WHERE p.ativo = true
  AND p.email <> 'matheusoliveira.comercial@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================================
-- PARTE 2: REMOÇÃO DO MÓDULO PANCADA JOIAS
-- =========================================================================

-- Tabelas antigas de permissão (Pancada e module_access genérico)
DROP TABLE IF EXISTS public.user_pancada_permissions CASCADE;
DROP TABLE IF EXISTS public.user_financial_permissions CASCADE;
DROP TABLE IF EXISTS public.user_module_access CASCADE;

-- Funções auxiliares dessas tabelas
DROP FUNCTION IF EXISTS public.has_pancada_submodule_access(UUID, public.pancada_submodule) CASCADE;
DROP FUNCTION IF EXISTS public.has_financial_submodule_access(UUID, public.financial_submodule) CASCADE;
DROP FUNCTION IF EXISTS public.user_has_module_access(UUID, public.app_module) CASCADE;
DROP FUNCTION IF EXISTS public.update_financial_permissions_updated_at() CASCADE;

-- Enums associados
DROP TYPE IF EXISTS public.pancada_submodule CASCADE;
DROP TYPE IF EXISTS public.financial_submodule CASCADE;
DROP TYPE IF EXISTS public.app_module CASCADE;

-- Tabelas do módulo Pancada Joias
DROP TABLE IF EXISTS public.pj_drop_sale_items CASCADE;
DROP TABLE IF EXISTS public.pj_drop_sales CASCADE;
DROP TABLE IF EXISTS public.pj_drop_days CASCADE;
DROP TABLE IF EXISTS public.pj_ra_commission_payments CASCADE;
DROP TABLE IF EXISTS public.pj_reclame_aqui CASCADE;
DROP TABLE IF EXISTS public.pj_returns CASCADE;
DROP TABLE IF EXISTS public.pj_resends CASCADE;
DROP TABLE IF EXISTS public.pj_exchanges CASCADE;
DROP TABLE IF EXISTS public.pj_chargebacks CASCADE;
DROP TABLE IF EXISTS public.pj_aftersales_agents CASCADE;
DROP TABLE IF EXISTS public.pj_aftersales_config CASCADE;
DROP TABLE IF EXISTS public.pj_replenishment_items CASCADE;
DROP TABLE IF EXISTS public.pj_replenishment_plans CASCADE;
DROP TABLE IF EXISTS public.pj_inventory_items CASCADE;
DROP TABLE IF EXISTS public.pj_inventory_reports CASCADE;
DROP TABLE IF EXISTS public.pj_shipping_items CASCADE;
DROP TABLE IF EXISTS public.pj_shipping_reports CASCADE;
DROP TABLE IF EXISTS public.pj_cashflow_entries CASCADE;
DROP TABLE IF EXISTS public.pj_cashflow_exits CASCADE;
DROP TABLE IF EXISTS public.pj_cashflow_reports CASCADE;
DROP TABLE IF EXISTS public.pj_price_history CASCADE;
DROP TABLE IF EXISTS public.pj_price_notifications CASCADE;
DROP TABLE IF EXISTS public.pj_notification_views CASCADE;
DROP TABLE IF EXISTS public.pj_pricing_config CASCADE;
DROP TABLE IF EXISTS public.pj_catalog_users CASCADE;
DROP TABLE IF EXISTS public.pj_products CASCADE;

-- Funções específicas do Pancada
DROP FUNCTION IF EXISTS public.get_shipping_cost_by_month(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_shipping_cost_by_month_and_carrier(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.log_product_price_change() CASCADE;

-- Trigger updated_at do permission_groups
CREATE TRIGGER trg_permission_groups_updated_at
BEFORE UPDATE ON public.permission_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
