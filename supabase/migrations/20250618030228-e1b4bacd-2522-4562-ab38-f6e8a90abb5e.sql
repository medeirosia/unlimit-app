
-- Criar tabela específica para histórico de mentorias
CREATE TABLE public.mentoria_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentoria_id UUID NOT NULL REFERENCES public.mentorias(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('venda_inicial', 'pagamento_agendado')),
  valor NUMERIC NOT NULL,
  data_transacao DATE NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX idx_mentoria_historico_mentoria_id ON public.mentoria_historico(mentoria_id);
CREATE INDEX idx_mentoria_historico_data ON public.mentoria_historico(data_transacao);

-- Habilitar RLS
ALTER TABLE public.mentoria_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view mentoria history" 
  ON public.mentoria_historico 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create mentoria history" 
  ON public.mentoria_historico 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mentoria history" 
  ON public.mentoria_historico 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete mentoria history" 
  ON public.mentoria_historico 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Limpar registros de mentorias da tabela lancamentos
DELETE FROM public.lancamentos 
WHERE categoria LIKE 'Mentoria%' OR descricao LIKE '%Mentoria%';
