
-- Remover políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create subaccounts" ON public.profiles;

-- Criar políticas mais simples e diretas para evitar recursão
CREATE POLICY "Users can view own profile and subusers" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR parent_user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile and subusers" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    auth.uid() = id 
    OR parent_user_id = auth.uid()
  );

CREATE POLICY "Users can create subaccounts" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (parent_user_id = auth.uid());

-- Simplificar a política de user_module_access
DROP POLICY IF EXISTS "Admins can manage module access for their users" ON public.user_module_access;

CREATE POLICY "Users can manage module access for their subusers" 
  ON public.user_module_access 
  FOR ALL
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_module_access.user_id 
      AND parent_user_id = auth.uid()
    )
  );
