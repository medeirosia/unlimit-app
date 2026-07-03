-- Primeiro, remover o trigger problemático
DROP TRIGGER IF EXISTS update_project_configurations_updated_at ON public.project_configurations;

-- Criar uma função específica para project_configurations que usa o campo correto
CREATE OR REPLACE FUNCTION public.update_project_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger com a função correta
CREATE TRIGGER update_project_configurations_updated_at
    BEFORE UPDATE ON public.project_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_configurations_updated_at();