export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  initial_balance: number;
  category?: string;
  created_at: string;
  updated_at: string;
  active?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  expense_categories?: { name: string };
  bank_accounts?: { name: string };
}

export interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  bank_account_id: string;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  bank_accounts?: { name: string };
  receivable_categories?: { name: string };
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  from_account_id: string | null;
  to_account_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  transaction_date: string;
  created_at: string;
  status?: string;
  is_platform_withdrawal?: boolean;
  from_account?: { name: string };
  to_account?: { name: string };
}

export interface ReceivableCategory {
  id: string;
  name: string;
  created_at: string;
}
