
-- Verificar a constraint atual do reference_type
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'financial_transactions'::regclass 
AND conname LIKE '%reference_type%';

-- Remover a constraint atual se existir
ALTER TABLE public.financial_transactions 
DROP CONSTRAINT IF EXISTS financial_transactions_reference_type_check;

-- Criar nova constraint que inclui 'withdrawal'
ALTER TABLE public.financial_transactions 
ADD CONSTRAINT financial_transactions_reference_type_check 
CHECK (reference_type IN ('payable', 'receivable', 'withdrawal', 'transfer'));
