
-- Criar tabela para saques pendentes
CREATE TABLE public.pending_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_account_id UUID NOT NULL,
  to_account_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Verificar se a categoria "Tarifa Bancária" existe, se não existir, criar
INSERT INTO public.expense_categories (id, name, user_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tarifa Bancária',
  'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
  now()
)
ON CONFLICT DO NOTHING;
