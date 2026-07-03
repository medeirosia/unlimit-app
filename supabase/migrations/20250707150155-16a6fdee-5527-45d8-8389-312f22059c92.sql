INSERT INTO financial_transactions (
  type, 
  status, 
  from_account_id, 
  to_account_id, 
  amount, 
  description, 
  transaction_date, 
  user_id, 
  reference_type, 
  reference_id, 
  is_platform_withdrawal
) VALUES (
  'payment',
  'confirmed', 
  '7739b8b8-84d0-4028-be61-b1c682784507',
  null,
  1.99,
  'Taxa de saque - Hotmart',
  '2025-07-07',
  'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
  'payable',
  '56696228-77eb-448f-a538-e50e290d5c3f',
  false
);