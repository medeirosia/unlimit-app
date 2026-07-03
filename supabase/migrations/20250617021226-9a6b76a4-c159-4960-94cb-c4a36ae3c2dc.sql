
-- Habilitar RLS na tabela mentoria_pagamentos
ALTER TABLE public.mentoria_pagamentos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que usuários vejam todos os pagamentos de mentoria
-- (assumindo que todos os usuários autenticados podem ver os dados)
CREATE POLICY "Users can view mentoria payments" 
  ON public.mentoria_pagamentos 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Criar política para permitir que usuários autenticados insiram pagamentos
CREATE POLICY "Users can create mentoria payments" 
  ON public.mentoria_pagamentos 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Criar política para permitir que usuários autenticados atualizem pagamentos
CREATE POLICY "Users can update mentoria payments" 
  ON public.mentoria_pagamentos 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Criar política para permitir que usuários autenticados deletem pagamentos
CREATE POLICY "Users can delete mentoria payments" 
  ON public.mentoria_pagamentos 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);
