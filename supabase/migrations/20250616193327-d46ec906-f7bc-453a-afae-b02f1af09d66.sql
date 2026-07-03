
-- Criar enum para os tipos de usuário (verificar se não existe)
DO $$ BEGIN
    CREATE TYPE public.user_type as enum ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Atualizar tabela profiles para incluir tipo de usuário e hierarquia
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Criar tabela para controle de acesso aos módulos
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  module public.app_module NOT NULL,
  has_access boolean DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Habilitar RLS na tabela user_module_access
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Admins can manage module access for their users" ON public.user_module_access;
DROP POLICY IF EXISTS "Users can view their own module access" ON public.user_module_access;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create subaccounts" ON public.profiles;

-- Criar políticas para user_module_access
CREATE POLICY "Admins can manage module access for their users" 
  ON public.user_module_access 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
      AND (
        id = (SELECT parent_user_id FROM public.profiles WHERE id = user_module_access.user_id)
        OR id = user_module_access.user_id
      )
    )
  );

CREATE POLICY "Users can view their own module access" 
  ON public.user_module_access 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Criar novas políticas para profiles
CREATE POLICY "Users can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
      ) 
      AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id 
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.user_type = 'admin'
      ) 
      AND parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create subaccounts" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type = 'admin'
    ) 
    AND parent_user_id = auth.uid()
  );

-- Função para verificar se usuário tem acesso a um módulo
CREATE OR REPLACE FUNCTION public.user_has_module_access(_user_id uuid, _module public.app_module)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT has_access FROM public.user_module_access 
     WHERE user_id = _user_id AND module = _module),
    -- Se não há registro específico, verificar se é admin (tem acesso total)
    (SELECT user_type = 'admin' FROM public.profiles WHERE id = _user_id)
  );
$$;
