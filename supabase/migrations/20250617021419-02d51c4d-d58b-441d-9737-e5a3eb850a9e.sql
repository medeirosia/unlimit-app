
-- Corrigir as funções que têm search_path mutável
-- Recriar as funções com search_path fixo para maior segurança

-- 1. Atualizar função user_has_module_access
CREATE OR REPLACE FUNCTION public.user_has_module_access(_user_id uuid, _module app_module)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(
    (SELECT has_access FROM public.user_module_access 
     WHERE user_id = _user_id AND module = _module),
    -- Se não há registro específico, verificar se é admin (tem acesso total)
    (SELECT user_type = 'admin' FROM public.profiles WHERE id = _user_id)
  );
$function$;

-- 2. Atualizar função is_admin_user
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT email = 'matheusoliveira.comercial@gmail.com'
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$function$;

-- 3. Atualizar função delete_user_completo
CREATE OR REPLACE FUNCTION public.delete_user_completo(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verificar se o usuário não é admin antes de deletar
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = uid 
    AND email = 'matheusoliveira.comercial@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Não é possível deletar o usuário administrador';
  END IF;

  -- Deletar do profiles primeiro
  DELETE FROM public.profiles WHERE id = uid;
  
  -- Deletar da auth.users (usando a extensão auth do Supabase)
  DELETE FROM auth.users WHERE id = uid;
END;
$function$;
