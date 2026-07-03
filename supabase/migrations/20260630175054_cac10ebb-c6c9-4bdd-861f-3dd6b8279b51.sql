CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND email IN ('matheusoliveira.comercial@gmail.com', 'medeiros.ecom@gmail.com')
      AND ativo = true
  )
$function$;