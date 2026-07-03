
-- Remover políticas existentes que podem estar causando recursão infinita
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Criar função security definer para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'matheusoliveira.comercial@gmail.com'
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política para usuários verem seus próprios perfis
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Política para admin ver todos os perfis
CREATE POLICY "Admin can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_admin_user());

-- Política para admin atualizar todos os perfis
CREATE POLICY "Admin can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (public.is_admin_user());

-- Política para inserção de novos perfis
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
