-- Fix December 2025: mark "Saldo Atual" (type S) entries as ignored
UPDATE pj_cashflow_entries 
SET is_ignored = true 
WHERE report_id = '59a74b12-e058-4b16-a63a-5e037c6ff2c8' 
AND entry_type = 'S' 
AND is_ignored = false;

-- Recalculate total_revenue for December 2025
UPDATE pj_cashflow_reports 
SET total_revenue = 545882.12,
    net_result = 545882.12 - total_expenses,
    updated_at = now()
WHERE id = '59a74b12-e058-4b16-a63a-5e037c6ff2c8';
