
-- Recalcular saldo da Conta Simples (c4719368-b566-4ea6-8de2-30836faf2140)
-- O saldo deveria incluir o saque de R$ 23.000,00 confirmado

DO $$
DECLARE
    current_balance DECIMAL(10,2) := 0;
    initial_bal DECIMAL(10,2) := 0;
    entradas_recebidas DECIMAL(10,2) := 0;
    saidas_pagas DECIMAL(10,2) := 0;
    transferencias_recebidas DECIMAL(10,2) := 0;
    transferencias_enviadas DECIMAL(10,2) := 0;
    account_id_param uuid := 'c4719368-b566-4ea6-8de2-30836faf2140';
BEGIN
    -- Buscar saldo inicial da conta
    SELECT COALESCE(initial_balance, 0) INTO initial_bal
    FROM bank_accounts 
    WHERE id = account_id_param;
    
    -- ENTRADAS: Contas a receber que foram recebidas
    SELECT COALESCE(SUM(amount), 0) INTO entradas_recebidas
    FROM accounts_receivable
    WHERE bank_account_id = account_id_param 
    AND is_received = TRUE;
    
    -- SAÍDAS: Contas a pagar que foram pagas
    SELECT COALESCE(SUM(amount), 0) INTO saidas_pagas
    FROM accounts_payable
    WHERE bank_account_id = account_id_param 
    AND paid_date IS NOT NULL;
    
    -- TRANSFERÊNCIAS RECEBIDAS: apenas confirmadas
    SELECT COALESCE(SUM(amount), 0) INTO transferencias_recebidas
    FROM financial_transactions
    WHERE to_account_id = account_id_param 
    AND type = 'transfer'
    AND (status = 'confirmed' OR status IS NULL);
    
    -- TRANSFERÊNCIAS ENVIADAS: apenas confirmadas
    SELECT COALESCE(SUM(amount), 0) INTO transferencias_enviadas
    FROM financial_transactions
    WHERE from_account_id = account_id_param 
    AND type = 'transfer'
    AND (status = 'confirmed' OR status IS NULL);
    
    -- Cálculo final
    current_balance := initial_bal + entradas_recebidas - saidas_pagas + transferencias_recebidas - transferencias_enviadas;
    
    -- Log para debug
    RAISE NOTICE 'Conta Simples - Saldo Inicial: %, Entradas: %, Saídas: %, Transf Recebidas: %, Transf Enviadas: %, Saldo Final: %', 
        initial_bal, entradas_recebidas, saidas_pagas, transferencias_recebidas, transferencias_enviadas, current_balance;
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id_param;
    
    RAISE NOTICE 'Saldo da Conta Simples atualizado para: %', current_balance;
END $$;

-- Validação: Mostrar o saldo atualizado
SELECT name, balance FROM bank_accounts WHERE id = 'c4719368-b566-4ea6-8de2-30836faf2140';
