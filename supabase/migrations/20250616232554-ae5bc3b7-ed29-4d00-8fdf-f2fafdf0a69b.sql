
-- Adicionar coluna para marcar usuários como ativos/removidos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Atualizar a função handle_new_user para verificar se o usuário foi removido antes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  admin_id uuid;
  user_was_removed boolean := false;
BEGIN
  -- Buscar o ID do admin principal
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = 'matheusoliveira.comercial@gmail.com'
  LIMIT 1;

  -- Verificar se o usuário foi removido anteriormente
  SELECT NOT ativo INTO user_was_removed 
  FROM public.profiles 
  WHERE id = NEW.id;

  -- Se o usuário foi removido, não recriar o perfil ativo
  IF user_was_removed THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    nome,
    user_type,
    tipo_de_usuario,
    modulos_permitidos,
    parent_user_id,
    ativo
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'fullName', ''),
    'user'::public.user_type,
    'colaborador',
    ARRAY['dashboard'],
    CASE 
      WHEN NEW.email = 'matheusoliveira.comercial@gmail.com' THEN NULL
      ELSE admin_id
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, profiles.nome),
    ativo = CASE 
      WHEN profiles.ativo = false THEN false 
      ELSE true 
    END;
  
  RETURN NEW;
END;
$$;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own active profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all active profiles" ON public.profiles;

-- Política para usuários verem seus próprios perfis (apenas se ativos)
CREATE POLICY "Users can view own active profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id AND ativo = true);

-- Política para admin ver todos os perfis ativos
CREATE POLICY "Admin can view all active profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_admin_user() AND ativo = true);

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
