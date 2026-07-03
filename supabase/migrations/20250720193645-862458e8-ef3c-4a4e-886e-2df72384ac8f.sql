-- Criar tabela para tipos de transação
CREATE TABLE public.transaction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project text NOT NULL,
  value text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project, value)
);

-- Habilitar RLS
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view all transaction types"
ON public.transaction_types
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create transaction types"
ON public.transaction_types
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transaction types"
ON public.transaction_types
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete transaction types"
ON public.transaction_types
FOR DELETE
USING (true);

-- Inserir tipos padrão para projetos existentes
INSERT INTO public.transaction_types (name, project, value, user_id) VALUES
('Receita', 'low-ticket', 'revenue', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34'),
('Investimento em Tráfego', 'low-ticket', 'investment', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34'),
('Receita Low-ticket', 'matheus', 'low-ticket-revenue', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34'),
('Investimento em Tráfego', 'matheus', 'investment', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34'),
('Receita Low-ticket', 'kenneth', 'low-ticket-revenue', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34'),
('Investimento em Tráfego', 'kenneth', 'investment', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34');