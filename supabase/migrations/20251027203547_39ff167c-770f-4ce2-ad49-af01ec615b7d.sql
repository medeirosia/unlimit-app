
-- Corrigir o saque pendente que foi confirmado mas a transação foi deletada
-- ID do pending_withdrawal: 01912bc3-d843-481b-9575-79adba71885f

DO $$
DECLARE
    withdrawal_id uuid := '01912bc3-d843-481b-9575-79adba71885f';
    from_acc uuid := '58fe6bc0-bb9d-4852-af0b-f21c8094b528';
    to_acc uuid := 'c4719368-b566-4ea6-8de2-30836faf2140';
    user_uid uuid := 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34';
BEGIN
    -- 1. Criar a transação confirmada que foi perdida
    INSERT INTO financial_transactions (
        user_id,
        description,
        amount,
        type,
        status,
        from_account_id,
        to_account_id,
        is_platform_withdrawal,
        reference_id,
        reference_type
    ) VALUES (
        user_uid,
        'Saque confirmado - Saque de plataforma',
        23000.00,
        'transfer',
        'confirmed',
        from_acc,
        to_acc,
        true,
        withdrawal_id,
        'withdrawal'
    );
    
    RAISE NOTICE 'Transação de R$ 23.000 criada com sucesso';
    
    -- 2. Marcar o saque como completado
    UPDATE pending_withdrawals
    SET is_completed = true,
        completed_at = now()
    WHERE id = withdrawal_id;
    
    RAISE NOTICE 'Saque marcado como completado';
    
    -- 3. Recalcular o saldo da conta de destino
    PERFORM recalculate_bank_account_balance(to_acc);
    
    RAISE NOTICE 'Saldo recalculado';
END $$;

-- Validar: Mostrar os saldos atualizados
SELECT name, balance 
FROM bank_accounts 
WHERE id IN ('58fe6bc0-bb9d-4852-af0b-f21c8094b528', 'c4719368-b566-4ea6-8de2-30836faf2140')
ORDER BY name;
