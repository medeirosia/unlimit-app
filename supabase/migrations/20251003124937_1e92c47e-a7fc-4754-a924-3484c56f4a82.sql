
-- ========================================
-- CORREÇÃO DE DADOS: Saque Pendente Duplicado
-- ========================================
-- Problema: Confirmação duplicada do saque de R$ 870,00
-- - Primeira confirmação: creditou Conta Simples corretamente
-- - Segunda confirmação: creditou novamente (saldo incorreto)
-- - Ticto nunca foi debitada
-- ========================================

-- 1. DELETAR transação pendente duplicada (criada na segunda confirmação)
DELETE FROM financial_transactions 
WHERE id = '4ed93263-d99f-42f0-9c74-b4b415fae4a9';

-- 2. MARCAR pending_withdrawal original como completo
UPDATE pending_withdrawals 
SET 
  is_completed = true,
  completed_at = now()
WHERE id = '3dead188-564b-4d37-bf83-021c83ede439';

-- 3. CORRIGIR saldo da Conta Simples (remover crédito duplicado de R$ 870)
UPDATE bank_accounts 
SET 
  balance = balance - 870.00,
  updated_at = now()
WHERE id = 'c4719368-b566-4ea6-8de2-30836faf2140';

-- 4. VERIFICAR se Ticto foi debitada corretamente
-- (Não fazer nada, pois Ticto já foi debitada na criação inicial do saque)

-- 5. VERIFICAR saldos finais esperados
-- Conta Simples: deve ficar em R$ 29.383,39
-- Ticto: deve permanecer em R$ 1.038,85 (já foi debitada corretamente)

-- Log de validação
DO $$
DECLARE
  conta_simples_balance NUMERIC;
  ticto_balance NUMERIC;
BEGIN
  SELECT balance INTO conta_simples_balance FROM bank_accounts WHERE id = 'c4719368-b566-4ea6-8de2-30836faf2140';
  SELECT balance INTO ticto_balance FROM bank_accounts WHERE id = '5c426c8b-8745-4ac3-ba3f-093a1c4b18a6';
  
  RAISE NOTICE 'Saldos após correção:';
  RAISE NOTICE 'Conta Simples: R$ %', conta_simples_balance;
  RAISE NOTICE 'Ticto: R$ %', ticto_balance;
  
  IF conta_simples_balance != 29383.39 THEN
    RAISE WARNING 'Saldo da Conta Simples diferente do esperado! Esperado: 29383.39, Atual: %', conta_simples_balance;
  END IF;
  
  IF ticto_balance != 1038.85 THEN
    RAISE WARNING 'Saldo da Ticto diferente do esperado! Esperado: 1038.85, Atual: %', ticto_balance;
  END IF;
END $$;
