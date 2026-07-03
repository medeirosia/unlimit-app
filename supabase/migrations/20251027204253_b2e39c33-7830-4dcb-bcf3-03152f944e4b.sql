
-- Corrigir o saque pendente de R$ 30.000 que foi desfeito mas não restaurou o saldo
-- ID do saque: 8c12b6f3-8d5a-498c-9962-c11fa063eed2
-- Conta: Hotmart (7739b8b8-84d0-4028-be61-b1c682784507)

DO $$
DECLARE
    withdrawal_id uuid := '8c12b6f3-8d5a-498c-9962-c11fa063eed2';
    account_id uuid := '7739b8b8-84d0-4028-be61-b1c682784507';
    expense_id uuid := '4e01ee84-093c-4179-8174-ee948fc77907';
BEGIN
    -- 1. Deletar a despesa da taxa que ficou órfã
    DELETE FROM accounts_payable WHERE id = expense_id;
    RAISE NOTICE 'Despesa da taxa deletada';
    
    -- 2. Deletar o saque pendente
    DELETE FROM pending_withdrawals WHERE id = withdrawal_id;
    RAISE NOTICE 'Saque pendente deletado';
    
    -- 3. Recalcular o saldo da conta Hotmart
    PERFORM recalculate_bank_account_balance(account_id);
    RAISE NOTICE 'Saldo recalculado';
END $$;

-- Validar: Mostrar o saldo atualizado da conta Hotmart
SELECT name, balance FROM bank_accounts WHERE id = '7739b8b8-84d0-4028-be61-b1c682784507';
