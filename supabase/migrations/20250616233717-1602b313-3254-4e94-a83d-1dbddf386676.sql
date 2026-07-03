
-- Atualizar a função RPC para deletar usuário completamente incluindo auth.users
CREATE OR REPLACE FUNCTION delete_user_completo(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário não é admin antes de deletar
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = uid 
    AND email = 'matheusoliveira.comercial@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Não é possível deletar o usuário administrador';
  END IF;

  -- Deletar do profiles primeiro
  DELETE FROM profiles WHERE id = uid;
  
  -- Deletar da auth.users (usando a extensão auth do Supabase)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Conceder permissões para execução da função
GRANT EXECUTE ON FUNCTION delete_user_completo(uuid) TO service_role;
GRANT DELETE ON auth.users TO service_role;
