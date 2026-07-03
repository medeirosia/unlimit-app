
-- Criar tabela para armazenar os pagamentos agendados das mentorias
CREATE TABLE public.mentoria_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentoria_id UUID NOT NULL REFERENCES public.mentorias(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_vencimento DATE,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para melhorar performance das consultas
CREATE INDEX idx_mentoria_pagamentos_mentoria_id ON public.mentoria_pagamentos(mentoria_id);
CREATE INDEX idx_mentoria_pagamentos_status ON public.mentoria_pagamentos(status);
