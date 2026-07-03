
export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  initial_balance: number;
  created_at: string;
  updated_at: string;
}

export interface FormData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  feeAmount: number;
  description?: string;
}
