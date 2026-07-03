
-- Atualizar função para recalcular saldo de conta bancária incluindo initial_balance
CREATE OR REPLACE FUNCTION recalculate_bank_account_balance(account_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance DECIMAL(10,2) := 0;
    initial_bal DECIMAL(10,2) := 0;
    entradas DECIMAL(10,2) := 0;
    saidas DECIMAL(10,2) := 0;
BEGIN
    -- Buscar saldo inicial da conta
    SELECT COALESCE(initial_balance, 0) INTO initial_bal
    FROM bank_accounts 
    WHERE id = account_id;
    
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
    
    -- Cálculo final: Initial Balance + Entradas - Saídas
    current_balance := initial_bal + entradas - saidas;
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id;
    
    RETURN current_balance;
END;
$$;

-- Executar recálculo de todos os saldos com a nova lógica incluindo initial_balance
SELECT recalculate_all_bank_balances();
