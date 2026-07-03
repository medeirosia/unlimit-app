
-- Adicionar campos necessários para controle de saques de plataforma
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS is_platform_withdrawal BOOLEAN DEFAULT false;

-- Criar índice para melhor performance nas consultas de saques pendentes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_platform_withdrawals 
ON financial_transactions (is_platform_withdrawal, status) 
WHERE is_platform_withdrawal = true;
