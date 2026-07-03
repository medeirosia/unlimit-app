-- Criar tabela para configurações de projetos
CREATE TABLE public.project_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.project_configurations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam todas as configurações de projetos
CREATE POLICY "All users can view project configurations"
ON public.project_configurations FOR SELECT
TO authenticated
USING (true);

-- Política para admin gerenciar configurações
CREATE POLICY "Admin can manage project configurations"
ON public.project_configurations FOR ALL
TO authenticated
USING (is_admin_user());

-- Inserir projetos padrão
INSERT INTO public.project_configurations (name, key, active, user_id) VALUES
('Projeto Matheus', 'matheus', true, (SELECT id FROM auth.users WHERE email = 'matheusoliveira.comercial@gmail.com' LIMIT 1)),
('Projeto Kenneth', 'kenneth', true, (SELECT id FROM auth.users WHERE email = 'matheusoliveira.comercial@gmail.com' LIMIT 1)),
('Low-ticket sem experts', 'low-ticket', true, (SELECT id FROM auth.users WHERE email = 'matheusoliveira.comercial@gmail.com' LIMIT 1)),
('Projeto Validde', 'validde', true, (SELECT id FROM auth.users WHERE email = 'matheusoliveira.comercial@gmail.com' LIMIT 1)),
('Projeto AdsScanner', 'adsscanner', true, (SELECT id FROM auth.users WHERE email = 'matheusoliveira.comercial@gmail.com' LIMIT 1));

-- Trigger para updated_at
CREATE TRIGGER update_project_configurations_updated_at
    BEFORE UPDATE ON public.project_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();