-- Adicionar coluna active à tabela bank_accounts
ALTER TABLE bank_accounts ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Arquivar a conta "Caixa" que reapareceu
UPDATE bank_accounts SET active = false WHERE name = 'Caixa';

-- Atualizar função sync_bank_accounts_from_transactions para não recriar contas arquivadas
CREATE OR REPLACE FUNCTION public.sync_bank_accounts_from_transactions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    account_record RECORD;
BEGIN
    -- Criar contas bancárias baseadas em accounts_payable que ainda não existem
    -- Mas apenas se não foram arquivadas anteriormente
    INSERT INTO bank_accounts (id, name, user_id, balance, initial_balance, active)
    SELECT DISTINCT 
        ap.bank_account_id,
        'Conta ' || ROW_NUMBER() OVER (ORDER BY ap.bank_account_id),
        ap.user_id,
        0,
        0,
        true
    FROM accounts_payable ap
    WHERE ap.bank_account_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM bank_accounts ba WHERE ba.id = ap.bank_account_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Criar contas bancárias baseadas em accounts_receivable que ainda não existem
    -- Mas apenas se não foram arquivadas anteriormente
    INSERT INTO bank_accounts (id, name, user_id, balance, initial_balance, active)
    SELECT DISTINCT 
        ar.bank_account_id,
        'Conta ' || ROW_NUMBER() OVER (ORDER BY ar.bank_account_id),
        ar.user_id,
        0,
        0,
        true
    FROM accounts_receivable ar
    WHERE ar.bank_account_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM bank_accounts ba WHERE ba.id = ar.bank_account_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Recalcular saldos apenas de contas ativas
    FOR account_record IN SELECT id FROM bank_accounts WHERE active = true LOOP
        PERFORM recalculate_bank_account_balance(account_record.id);
    END LOOP;
END;
$function$;