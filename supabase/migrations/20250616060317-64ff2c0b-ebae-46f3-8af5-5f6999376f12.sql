
-- Criar tabela para contas bancárias
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para categorias de despesas
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para contas a pagar
CREATE TABLE public.accounts_payable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  due_date DATE NOT NULL,
  paid_date DATE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para contas a receber
CREATE TABLE public.accounts_receivable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  due_date DATE NOT NULL,
  received_date DATE,
  is_received BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para histórico de transações financeiras (extrato)
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'payment', 'receipt')),
  from_account_id UUID REFERENCES public.bank_accounts(id),
  to_account_id UUID REFERENCES public.bank_accounts(id),
  reference_id UUID, -- Para referenciar contas a pagar/receber
  reference_type TEXT CHECK (reference_type IN ('payable', 'receivable')),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bank_accounts
CREATE POLICY "Users can view their own bank accounts" 
  ON public.bank_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bank accounts" 
  ON public.bank_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts" 
  ON public.bank_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts" 
  ON public.bank_accounts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para expense_categories
CREATE POLICY "Users can view their own expense categories" 
  ON public.expense_categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense categories" 
  ON public.expense_categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories" 
  ON public.expense_categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories" 
  ON public.expense_categories 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para accounts_payable
CREATE POLICY "Users can view their own accounts payable" 
  ON public.accounts_payable 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts payable" 
  ON public.accounts_payable 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts payable" 
  ON public.accounts_payable 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts payable" 
  ON public.accounts_payable 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para accounts_receivable
CREATE POLICY "Users can view their own accounts receivable" 
  ON public.accounts_receivable 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts receivable" 
  ON public.accounts_receivable 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts receivable" 
  ON public.accounts_receivable 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts receivable" 
  ON public.accounts_receivable 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para financial_transactions
CREATE POLICY "Users can view their own financial transactions" 
  ON public.financial_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial transactions" 
  ON public.financial_transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial transactions" 
  ON public.financial_transactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial transactions" 
  ON public.financial_transactions 
  FOR DELETE 
  USING (auth.uid() = user_id);
