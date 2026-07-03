-- Migration: Confirmar saque de R$ 870 no extrato
-- Data: 2025-10-03

-- 1. Atualizar a transação pendente para confirmada
UPDATE financial_transactions
SET 
  status = 'confirmed',
  description = 'Saque confirmado - Saque de plataforma'
WHERE id = '2ee25307-bf49-449d-955e-90757918db46'
AND status = 'pending';

-- 2. Validação: Verificar se a transação foi atualizada corretamente
DO $$
DECLARE
    transaction_status TEXT;
    pending_withdrawal_completed BOOLEAN;
BEGIN
    -- Verificar status da transação
    SELECT status INTO transaction_status 
    FROM financial_transactions 
    WHERE id = '2ee25307-bf49-449d-955e-90757918db46';
    
    -- Verificar se o pending_withdrawal está completo
    SELECT is_completed INTO pending_withdrawal_completed
    FROM pending_withdrawals
    WHERE id = '3dead188-564b-4d37-bf83-021c83ede439';
    
    IF transaction_status = 'confirmed' THEN
        RAISE NOTICE '✅ Transação confirmada no extrato';
    ELSE
        RAISE WARNING '❌ Transação não foi confirmada. Status atual: %', transaction_status;
    END IF;
    
    IF pending_withdrawal_completed = true THEN
        RAISE NOTICE '✅ Saque marcado como completo';
    ELSE
        RAISE WARNING '❌ Saque não está marcado como completo';
    END IF;
END $$;