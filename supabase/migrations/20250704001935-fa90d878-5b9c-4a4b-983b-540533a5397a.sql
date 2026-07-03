
-- Permitir o tipo 'withdrawal' na tabela financial_transactions
-- Verificar se há alguma constraint que impeça este tipo
-- Se necessário, adicionar constraint para tipos válidos
ALTER TABLE financial_transactions 
DROP CONSTRAINT IF EXISTS financial_transactions_type_check;

-- Adicionar constraint permitindo os tipos necessários incluindo 'withdrawal'
ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_type_check 
CHECK (type IN ('income', 'expense', 'transfer', 'withdrawal', 'payment'));

-- Garantir que a categoria "Tarifa Bancária" existe para todos os usuários
-- Criar função para garantir categoria de tarifa bancária
CREATE OR REPLACE FUNCTION ensure_bank_fee_category(user_uuid uuid)
RETURNS uuid AS $$
DECLARE
    category_id uuid;
BEGIN
    -- Tentar encontrar categoria existente
    SELECT id INTO category_id
    FROM expense_categories 
    WHERE name = 'Tarifa Bancária' AND user_id = user_uuid;
    
    -- Se não existir, criar
    IF category_id IS NULL THEN
        INSERT INTO expense_categories (name, user_id)
        VALUES ('Tarifa Bancária', user_uuid)
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
