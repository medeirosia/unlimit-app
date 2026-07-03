
-- Primeira etapa: Verificar quantas categorias "Tarifa Bancária" existem
DO $$
DECLARE
    categoria_count INTEGER;
    categoria_para_manter UUID;
    categoria_record RECORD;
BEGIN
    -- Contar quantas categorias "Tarifa Bancária" existem
    SELECT COUNT(*) INTO categoria_count
    FROM expense_categories 
    WHERE LOWER(TRIM(name)) LIKE '%tarifa%bancár%' 
       OR LOWER(TRIM(name)) LIKE '%tarifa%bancar%'
       OR name ILIKE '%Tarifa Bancária%'
       OR name ILIKE '%tarifa bancaria%';
    
    RAISE NOTICE 'Encontradas % categorias de Tarifa Bancária', categoria_count;
    
    IF categoria_count > 1 THEN
        -- Encontrar a categoria mais antiga para manter
        SELECT id INTO categoria_para_manter
        FROM expense_categories 
        WHERE LOWER(TRIM(name)) LIKE '%tarifa%bancár%' 
           OR LOWER(TRIM(name)) LIKE '%tarifa%bancar%'
           OR name ILIKE '%Tarifa Bancária%'
           OR name ILIKE '%tarifa bancaria%'
        ORDER BY created_at ASC
        LIMIT 1;
        
        RAISE NOTICE 'Categoria para manter: %', categoria_para_manter;
        
        -- Atualizar todas as contas a pagar que usam as categorias duplicadas
        UPDATE accounts_payable 
        SET category_id = categoria_para_manter
        WHERE category_id IN (
            SELECT id FROM expense_categories 
            WHERE (LOWER(TRIM(name)) LIKE '%tarifa%bancár%' 
                OR LOWER(TRIM(name)) LIKE '%tarifa%bancar%'
                OR name ILIKE '%Tarifa Bancária%'
                OR name ILIKE '%tarifa bancaria%')
            AND id != categoria_para_manter
        );
        
        -- Remover as categorias duplicadas (mantendo apenas a mais antiga)
        DELETE FROM expense_categories 
        WHERE (LOWER(TRIM(name)) LIKE '%tarifa%bancár%' 
            OR LOWER(TRIM(name)) LIKE '%tarifa%bancar%'
            OR name ILIKE '%Tarifa Bancária%'
            OR name ILIKE '%tarifa bancaria%')
        AND id != categoria_para_manter;
        
        -- Padronizar o nome da categoria mantida
        UPDATE expense_categories 
        SET name = 'Tarifa Bancária'
        WHERE id = categoria_para_manter;
        
        RAISE NOTICE 'Limpeza concluída. Categoria mantida: %', categoria_para_manter;
    END IF;
END $$;

-- Verificar o resultado final
SELECT id, name, created_at 
FROM expense_categories 
WHERE LOWER(TRIM(name)) LIKE '%tarifa%bancár%' 
   OR LOWER(TRIM(name)) LIKE '%tarifa%bancar%'
   OR name ILIKE '%Tarifa Bancária%'
   OR name ILIKE '%tarifa bancaria%'
ORDER BY created_at;
