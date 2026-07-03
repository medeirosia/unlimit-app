-- Criar enum para sub-módulos do financeiro
CREATE TYPE public.financial_submodule AS ENUM (
  'accounts',
  'transactions', 
  'payable',
  'receivable',
  'withdrawals',
  'reports',
  'settings'
);

-- Criar tabela para permissões de sub-módulos do financeiro
CREATE TABLE public.user_financial_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submodule financial_submodule NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir que cada usuário tenha apenas uma entrada por sub-módulo
  UNIQUE(user_id, submodule)
);

-- Habilitar RLS
ALTER TABLE public.user_financial_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_financial_permissions
CREATE POLICY "Admin can manage financial permissions"
ON public.user_financial_permissions
FOR ALL
USING (is_admin_user());

CREATE POLICY "Users can view their own financial permissions"
ON public.user_financial_permissions  
FOR SELECT
USING (auth.uid() = user_id);

-- Função para verificar se usuário tem acesso a sub-módulo do financeiro
CREATE OR REPLACE FUNCTION public.has_financial_submodule_access(
  _user_id UUID, 
  _submodule financial_submodule
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT has_access 
     FROM user_financial_permissions 
     WHERE user_id = _user_id AND submodule = _submodule),
    -- Se não há registro específico, verificar se tem acesso ao módulo financeiro geral
    (SELECT 'financial' = ANY(modulos_permitidos) 
     FROM profiles 
     WHERE id = _user_id)
  );
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_financial_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_financial_permissions_updated_at
  BEFORE UPDATE ON public.user_financial_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_permissions_updated_at();