
CREATE OR REPLACE FUNCTION public.recalculate_bank_account_balance(account_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND type = 'transfer'
    AND (status = 'confirmed' OR status IS NULL);
    
    -- TRANSFERÊNCIAS ENVIADAS: financial_transactions tipo 'transfer' desta conta
    SELECT COALESCE(SUM(amount), 0) INTO transferencias_enviadas
    FROM financial_transactions
    WHERE from_account_id = account_id 
    AND type = 'transfer'
    AND (status = 'confirmed' OR status IS NULL);
    
    -- Cálculo final
    current_balance := initial_bal + entradas_recebidas - saidas_pagas + transferencias_recebidas - transferencias_enviadas;
    
    -- Atualizar saldo na tabela
    UPDATE bank_accounts 
    SET balance = current_balance, updated_at = now()
    WHERE id = account_id;
    
    RETURN current_balance;
END;
$function$;

-- Também atualizar recalculate_all para SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.recalculate_all_bank_balances()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    account_record RECORD;
BEGIN
    FOR account_record IN SELECT id FROM bank_accounts WHERE active = true LOOP
        PERFORM recalculate_bank_account_balance(account_record.id);
    END LOOP;
END;
$function$;
