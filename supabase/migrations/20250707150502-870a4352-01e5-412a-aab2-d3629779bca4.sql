-- Deletar a transação de saque pendente de R$ 4600,00
DELETE FROM financial_transactions 
WHERE id = '1a07bd7c-9a5b-4646-a730-06b9e7dc69d2';

-- Deletar a despesa da taxa de R$ 1,99 de 07/07/2025
DELETE FROM accounts_payable 
WHERE description = 'Taxa de saque - Hotmart' 
AND amount = 1.99 
AND due_date = '2025-07-07';

-- Deletar a transação da taxa de R$ 1,99 no extrato
DELETE FROM financial_transactions 
WHERE description = 'Taxa de saque - Hotmart' 
AND amount = 1.99 
AND transaction_date = '2025-07-07';