
-- Criar função para recalcular saldo de conta bancária baseado nas transações
CREATE OR REPLACE FUNCTION recalculate_bank_account_balance(account_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance DECIMAL(10,2) := 0;
    initial_bal DECIMAL(10,2) := 0;
BEGIN
    -- Buscar saldo inicial da conta
    SELECT COALESCE(initial_balance, 0) INTO initial_bal
    FROM bank_accounts 
    WHERE id = account_id;
    
    -- Calcular saldo baseado em transações
    SELECT 
        initial_bal + 
        COALESCE(SUM(
            CASE 
                WHEN to_account_id = account_id THEN amount
                WHEN from_account_id = account_id THEN -amount
                ELSE 0
            END
        ), 0)
    INTO current_balance
    FROM financial_transactions
    WHERE (to_account_id = account_id OR from_account_id = account_id);
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id;
    
    RETURN current_balance;
END;
$$;

-- Criar função para sincronizar contas bancárias com base nos pagamentos/recebimentos
CREATE OR REPLACE FUNCTION sync_bank_accounts_from_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    account_record RECORD;
BEGIN
    -- Criar contas bancárias baseadas em accounts_payable que ainda não existem
    INSERT INTO bank_accounts (id, name, user_id, balance, initial_balance)
    SELECT DISTINCT 
        ap.bank_account_id,
        'Conta ' || ROW_NUMBER() OVER (ORDER BY ap.bank_account_id),
        ap.user_id,
        0,
        0
    FROM accounts_payable ap
    WHERE ap.bank_account_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM bank_accounts ba WHERE ba.id = ap.bank_account_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Criar contas bancárias baseadas em accounts_receivable que ainda não existem
    INSERT INTO bank_accounts (id, name, user_id, balance, initial_balance)
    SELECT DISTINCT 
        ar.bank_account_id,
        'Conta ' || ROW_NUMBER() OVER (ORDER BY ar.bank_account_id),
        ar.user_id,
        0,
        0
    FROM accounts_receivable ar
    WHERE ar.bank_account_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM bank_accounts ba WHERE ba.id = ar.bank_account_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Recalcular saldos de todas as contas
    FOR account_record IN SELECT id FROM bank_accounts LOOP
        PERFORM recalculate_bank_account_balance(account_record.id);
    END LOOP;
END;
$$;

-- Executar sincronização inicial
SELECT sync_bank_accounts_from_transactions();
