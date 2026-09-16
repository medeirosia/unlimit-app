ALTER TABLE public.bank_accounts
ADD COLUMN IF NOT EXISTS real_balance numeric NULL,
ADD COLUMN IF NOT EXISTS real_balance_updated_at timestamp with time zone NULL;

COMMENT ON COLUMN public.bank_accounts.real_balance IS 'Saldo real conferido manualmente pelo usuário, sem efeito no saldo contábil, lançamentos, entradas ou saídas.';
COMMENT ON COLUMN public.bank_accounts.real_balance_updated_at IS 'Data/hora da última atualização manual do saldo real.';
