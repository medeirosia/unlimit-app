
-- Buscar o ID do admin principal para usar como parent_user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Buscar o ID do admin principal
  SELECT id INTO admin_id 
  FROM auth.users 
  WHERE email = 'matheusoliveira.comercial@gmail.com'
  LIMIT 1;

  INSERT INTO public.profiles (
    id, 
    email, 
    nome,
    user_type,
    tipo_de_usuario,
    modulos_permitidos,
    parent_user_id
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
    END
  );
  RETURN NEW;
END;
$$;
