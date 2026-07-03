
-- Verificar se a tabela profiles tem os campos necessários e adicionar se não existirem
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS tipo_de_usuario text DEFAULT 'colaborador',
ADD COLUMN IF NOT EXISTS modulos_permitidos text[] DEFAULT ARRAY['dashboard'];

-- Garantir que o admin específico mantenha suas permissões
UPDATE public.profiles 
SET tipo_de_usuario = 'admin', 
    modulos_permitidos = ARRAY['dashboard', 'projects', 'mentorship', 'financial']
WHERE email = 'matheusoliveira.comercial@gmail.com';

-- Atualizar usuários existentes que não sejam o admin para colaborador
UPDATE public.profiles 
SET tipo_de_usuario = 'colaborador'
WHERE email != 'matheusoliveira.comercial@gmail.com' 
AND tipo_de_usuario IS NULL;
