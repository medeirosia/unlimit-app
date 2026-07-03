
-- Criar tabela para projetos
CREATE TABLE public.projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  receita NUMERIC NOT NULL DEFAULT 0,
  investimento NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para mentorias
CREATE TABLE public.mentorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  projeto TEXT NOT NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  valor_recebido NUMERIC NOT NULL DEFAULT 0,
  valor_pendente NUMERIC NOT NULL DEFAULT 0,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para lançamentos
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas (mas permitir acesso compartilhado)
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS que permitem acesso compartilhado para usuários autenticados
CREATE POLICY "Shared access to projetos" ON public.projetos
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Shared access to mentorias" ON public.mentorias
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Shared access to lancamentos" ON public.lancamentos
  FOR ALL USING (auth.uid() IS NOT NULL);
