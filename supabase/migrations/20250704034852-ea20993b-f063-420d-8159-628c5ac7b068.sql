
-- Adicionar coluna category à tabela bank_accounts
ALTER TABLE public.bank_accounts 
ADD COLUMN category TEXT DEFAULT 'geral';

-- Comentário explicativo da coluna
COMMENT ON COLUMN public.bank_accounts.category IS 'Categoria da conta bancária (bancaria, cartao, plataforma, geral)';
