
-- Recriar função para recalcular saldo de conta bancária baseado nas movimentações reais
CREATE OR REPLACE FUNCTION recalculate_bank_account_balance(account_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance DECIMAL(10,2) := 0;
    entradas DECIMAL(10,2) := 0;
    saidas DECIMAL(10,2) := 0;
BEGIN
    -- ENTRADAS (somar ao saldo)
    
    -- 1. Contas a receber que foram recebidas
    SELECT COALESCE(SUM(amount), 0) INTO entradas
    FROM accounts_receivable
    WHERE bank_account_id = account_id 
    AND is_received = TRUE;
    
    -- 2. Transações do tipo 'receipt' recebidas na conta
    SELECT entradas + COALESCE(SUM(amount), 0) INTO entradas
    FROM financial_transactions
    WHERE to_account_id = account_id 
    AND type = 'receipt';
    
    -- 3. Transferências recebidas na conta
    SELECT entradas + COALESCE(SUM(amount), 0) INTO entradas
    FROM financial_transactions
    WHERE to_account_id = account_id 
    AND type = 'transfer';
    
    -- SAÍDAS (subtrair do saldo)
    
    -- 4. Contas a pagar que foram pagas
    SELECT COALESCE(SUM(amount), 0) INTO saidas
    FROM accounts_payable
    WHERE bank_account_id = account_id 
    AND paid_date IS NOT NULL;
    
    -- 5. Transações do tipo 'payment' saindo da conta
    SELECT saidas + COALESCE(SUM(amount), 0) INTO saidas
    FROM financial_transactions
    WHERE from_account_id = account_id 
    AND type = 'payment';
    
    -- 6. Transferências enviadas da conta
    SELECT saidas + COALESCE(SUM(amount), 0) INTO saidas
    FROM financial_transactions
    WHERE from_account_id = account_id 
    AND type = 'transfer';
    
    -- Cálculo final: Entradas - Saídas
    current_balance := entradas - saidas;
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id;
    
    RETURN current_balance;
END;
$$;

-- Função para recalcular todos os saldos
CREATE OR REPLACE FUNCTION recalculate_all_bank_balances()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    account_record RECORD;
BEGIN
    FOR account_record IN SELECT id FROM bank_accounts LOOP
        PERFORM recalculate_bank_account_balance(account_record.id);
    END LOOP;
END;
$$;

-- Executar recálculo de todos os saldos com a nova lógica
SELECT recalculate_all_bank_balances();
