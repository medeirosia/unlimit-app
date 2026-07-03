
-- Verificar se o tipo user_type existe e criar se necessário
DO $$ BEGIN
    CREATE TYPE public.user_type as enum ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar se o tipo app_module existe e criar se necessário
DO $$ BEGIN
    CREATE TYPE public.app_module as enum ('dashboard', 'financial', 'projects', 'mentorship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Garantir que a tabela profiles tem a estrutura correta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'user',
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS tipo_de_usuario text DEFAULT 'colaborador',
ADD COLUMN IF NOT EXISTS modulos_permitidos text[] DEFAULT ARRAY['dashboard'],
ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Atualizar a função handle_new_user para funcionar corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    nome,
    user_type,
    tipo_de_usuario,
    modulos_permitidos
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'fullName', ''),
    'user'::public.user_type,
    'colaborador',
    ARRAY['dashboard']
  );
  RETURN NEW;
END;
$$;

-- Garantir que o admin específico tenha as permissões corretas
INSERT INTO public.profiles (id, email, nome, user_type, tipo_de_usuario, modulos_permitidos)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'fullName', 'Admin'),
  'admin'::public.user_type,
  'admin',
  ARRAY['dashboard', 'projects', 'mentorship', 'financial']
FROM auth.users 
WHERE email = 'matheusoliveira.comercial@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin'::public.user_type,
  tipo_de_usuario = 'admin',
  modulos_permitidos = ARRAY['dashboard', 'projects', 'mentorship', 'financial'];
