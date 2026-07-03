-- Criar função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'matheusoliveira.comercial@gmail.com'
    AND ativo = true
  )
$$;

-- Criar função para verificar se usuário pode gerenciar permissões
CREATE OR REPLACE FUNCTION public.can_manage_permissions()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_user()
$$;

-- Criar política para proteger atualizações na tabela profiles
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
CREATE POLICY "Only admin can update user permissions"
ON profiles
FOR UPDATE
USING (
  -- Admin pode atualizar qualquer perfil OU 
  -- Usuário pode atualizar apenas seu próprio perfil MAS não pode alterar modulos_permitidos
  is_admin_user() OR (
    auth.uid() = id AND 
    -- Verificar se está tentando alterar modulos_permitidos
    modulos_permitidos = (SELECT modulos_permitidos FROM profiles WHERE id = auth.uid())
  )
);