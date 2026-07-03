
-- Corrigir função para recalcular saldo de conta bancária eliminando duplicidade
CREATE OR REPLACE FUNCTION recalculate_bank_account_balance(account_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance DECIMAL(10,2) := 0;
    initial_bal DECIMAL(10,2) := 0;
    entradas_recebidas DECIMAL(10,2) := 0;
    saidas_pagas DECIMAL(10,2) := 0;
    transferencias_recebidas DECIMAL(10,2) := 0;
    transferencias_enviadas DECIMAL(10,2) := 0;
BEGIN
    -- Buscar saldo inicial da conta
    SELECT COALESCE(initial_balance, 0) INTO initial_bal
    FROM bank_accounts 
    WHERE id = account_id;
    
    -- ENTRADAS: Contas a receber que foram recebidas (is_received = TRUE)
    SELECT COALESCE(SUM(amount), 0) INTO entradas_recebidas
    FROM accounts_receivable
    WHERE bank_account_id = account_id 
    AND is_received = TRUE;
    
    -- SAÍDAS: Contas a pagar que foram pagas (paid_date IS NOT NULL)
    SELECT COALESCE(SUM(amount), 0) INTO saidas_pagas
    FROM accounts_payable
    WHERE bank_account_id = account_id 
    AND paid_date IS NOT NULL;
    
    -- TRANSFERÊNCIAS RECEBIDAS: financial_transactions tipo 'transfer' para esta conta
    SELECT COALESCE(SUM(amount), 0) INTO transferencias_recebidas
    FROM financial_transactions
    WHERE to_account_id = account_id 
    AND type = 'transfer';
    
    -- TRANSFERÊNCIAS ENVIADAS: financial_transactions tipo 'transfer' desta conta
    SELECT COALESCE(SUM(amount), 0) INTO transferencias_enviadas
    FROM financial_transactions
    WHERE from_account_id = account_id 
    AND type = 'transfer';
    
    -- Cálculo final: initial_balance + entradas - saídas + transferências_recebidas - transferências_enviadas
    current_balance := initial_bal + entradas_recebidas - saidas_pagas + transferencias_recebidas - transferencias_enviadas;
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id;
    
    RETURN current_balance;
END;
$$;

-- Executar recálculo de todos os saldos com a nova lógica corrigida
SELECT recalculate_all_bank_balances();
