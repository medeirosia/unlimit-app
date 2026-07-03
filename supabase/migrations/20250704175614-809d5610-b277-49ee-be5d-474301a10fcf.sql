
-- Identificar as categorias duplicadas de "Tarifa Bancária"
-- e manter apenas uma, atualizando as referências existentes

-- Primeiro, vamos encontrar todas as categorias "Tarifa Bancária"
-- e manter a mais antiga (menor created_at)
WITH tarifa_categories AS (
  SELECT id, name, created_at,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM expense_categories 
  WHERE LOWER(name) LIKE '%tarifa bancária%' OR LOWER(name) LIKE '%tarifa bancaria%'
),
keep_category AS (
  SELECT id as keep_id FROM tarifa_categories WHERE rn = 1
),
delete_categories AS (
  SELECT id as delete_id FROM tarifa_categories WHERE rn > 1
)
-- Atualizar todas as contas a pagar que usam as categorias duplicadas
-- para usar a categoria que será mantida
UPDATE accounts_payable 
SET category_id = (SELECT keep_id FROM keep_category)
WHERE category_id IN (SELECT delete_id FROM delete_categories);

-- Remover as categorias duplicadas
DELETE FROM expense_categories 
WHERE id IN (
  SELECT id FROM expense_categories 
  WHERE LOWER(name) LIKE '%tarifa bancária%' OR LOWER(name) LIKE '%tarifa bancaria%'
  AND id NOT IN (
    SELECT id FROM expense_categories 
    WHERE LOWER(name) LIKE '%tarifa bancária%' OR LOWER(name) LIKE '%tarifa bancaria%'
    ORDER BY created_at ASC 
    LIMIT 1
  )
);

-- Garantir que a categoria mantida tenha o nome padronizado
UPDATE expense_categories 
SET name = 'Tarifa Bancária'
WHERE LOWER(name) LIKE '%tarifa bancária%' OR LOWER(name) LIKE '%tarifa bancaria%';
