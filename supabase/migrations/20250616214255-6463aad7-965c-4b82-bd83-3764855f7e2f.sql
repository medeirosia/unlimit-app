
-- Remover todas as políticas RLS restritivas que filtram por user_id
-- e criar políticas que permitem acesso compartilhado aos dados

-- BANK ACCOUNTS - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can create their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update their own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON public.bank_accounts;

CREATE POLICY "Authenticated users can view all bank accounts" 
  ON public.bank_accounts 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create bank accounts" 
  ON public.bank_accounts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bank accounts" 
  ON public.bank_accounts 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete bank accounts" 
  ON public.bank_accounts 
  FOR DELETE 
  TO authenticated
  USING (true);

-- EXPENSE CATEGORIES - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can create their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense categories" ON public.expense_categories;

CREATE POLICY "Authenticated users can view all expense categories" 
  ON public.expense_categories 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create expense categories" 
  ON public.expense_categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expense categories" 
  ON public.expense_categories 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete expense categories" 
  ON public.expense_categories 
  FOR DELETE 
  TO authenticated
  USING (true);

-- RECEIVABLE CATEGORIES - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own receivable categories" ON public.receivable_categories;
DROP POLICY IF EXISTS "Users can create their own receivable categories" ON public.receivable_categories;
DROP POLICY IF EXISTS "Users can update their own receivable categories" ON public.receivable_categories;
DROP POLICY IF EXISTS "Users can delete their own receivable categories" ON public.receivable_categories;

CREATE POLICY "Authenticated users can view all receivable categories" 
  ON public.receivable_categories 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create receivable categories" 
  ON public.receivable_categories 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update receivable categories" 
  ON public.receivable_categories 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete receivable categories" 
  ON public.receivable_categories 
  FOR DELETE 
  TO authenticated
  USING (true);

-- ACCOUNTS PAYABLE - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can create their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can update their own accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Users can delete their own accounts payable" ON public.accounts_payable;

CREATE POLICY "Authenticated users can view all accounts payable" 
  ON public.accounts_payable 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create accounts payable" 
  ON public.accounts_payable 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts payable" 
  ON public.accounts_payable 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete accounts payable" 
  ON public.accounts_payable 
  FOR DELETE 
  TO authenticated
  USING (true);

-- ACCOUNTS RECEIVABLE - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can create their own accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can update their own accounts receivable" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Users can delete their own accounts receivable" ON public.accounts_receivable;

CREATE POLICY "Authenticated users can view all accounts receivable" 
  ON public.accounts_receivable 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create accounts receivable" 
  ON public.accounts_receivable 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update accounts receivable" 
  ON public.accounts_receivable 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete accounts receivable" 
  ON public.accounts_receivable 
  FOR DELETE 
  TO authenticated
  USING (true);

-- FINANCIAL TRANSACTIONS - Permitir acesso compartilhado
DROP POLICY IF EXISTS "Users can view their own financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can create their own financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can update their own financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Users can delete their own financial transactions" ON public.financial_transactions;

CREATE POLICY "Authenticated users can view all financial transactions" 
  ON public.financial_transactions 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create financial transactions" 
  ON public.financial_transactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update financial transactions" 
  ON public.financial_transactions 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete financial transactions" 
  ON public.financial_transactions 
  FOR DELETE 
  TO authenticated
  USING (true);
