
-- Adicionar coluna initial_balance para armazenar o saldo inicial real de cada conta
ALTER TABLE public.bank_accounts 
ADD COLUMN initial_balance DECIMAL(10,2) DEFAULT 0;

-- Migrar os saldos atuais para initial_balance (estes serão os saldos base)
UPDATE public.bank_accounts 
SET initial_balance = balance;

-- Comentário: A coluna balance continuará existindo mas será sempre calculada
-- baseada no initial_balance + todas as transações
