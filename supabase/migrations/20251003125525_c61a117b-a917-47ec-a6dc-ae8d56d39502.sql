-- Migration: Corrigir saque de R$ 870 na Ticto e limpar transação órfã
-- Data: 2025-10-03

-- 1. Verificar e deletar transação pendente duplicada (ID: 2ee25307-a8c8-4e0f-a6a8-54a81aa66c49)
DELETE FROM financial_transactions
WHERE id = '2ee25307-a8c8-4e0f-a6a8-54a81aa66c49'
AND status = 'pending'
AND type = 'platform_withdrawal'
AND amount = 870;

-- 2. Debitar R$ 870 da conta Ticto (corrigir saldo)
-- Saldo atual: 1038.85, Saldo esperado: 168.85
UPDATE bank_accounts
SET balance = 168.85,
    updated_at = now()
WHERE name = 'Ticto'
AND balance = 1038.85;

-- 3. Validação: Verificar se não existem outros saques pendentes duplicados
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT reference_id, COUNT(*) as count
        FROM financial_transactions
        WHERE reference_type IN ('withdrawal', 'pending_withdrawal')
        AND status = 'pending'
        AND reference_id IS NOT NULL
        GROUP BY reference_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE WARNING 'Ainda existem % saques pendentes duplicados!', duplicate_count;
    ELSE
        RAISE NOTICE '✅ Nenhum saque pendente duplicado encontrado';
    END IF;
END $$;

-- 4. Validação: Confirmar saldos finais
DO $$
DECLARE
    ticto_balance DECIMAL(10,2);
    simples_balance DECIMAL(10,2);
BEGIN
    SELECT balance INTO ticto_balance FROM bank_accounts WHERE name = 'Ticto';
    SELECT balance INTO simples_balance FROM bank_accounts WHERE name = 'Conta Simples';
    
    IF ticto_balance = 168.85 THEN
        RAISE NOTICE '✅ Ticto: R$ 168,85 (correto)';
    ELSE
        RAISE WARNING '❌ Ticto: R$ % (esperado: R$ 168,85)', ticto_balance;
    END IF;
    
    IF simples_balance = 29383.39 THEN
        RAISE NOTICE '✅ Conta Simples: R$ 29.383,39 (correto)';
    ELSE
        RAISE WARNING '❌ Conta Simples: R$ % (esperado: R$ 29.383,39)', simples_balance;
    END IF;
END $$;