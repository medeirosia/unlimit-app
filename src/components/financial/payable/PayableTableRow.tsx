import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { PayableEditDialog } from './PayableEditDialog';
import { formatDateString } from '@/utils/dateUtils';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

interface AccountPayable {
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

interface PayableTableRowProps {
  payable: AccountPayable;
  bankAccounts: BankAccount[];
  expenseCategories: ExpenseCategory[];
  onPay: (payableId: string, bankAccountId: string) => void;
  onDelete: (payableId: string) => void;
  onDataChange: () => void;
}

export const PayableTableRow = ({ 
  payable, 
  bankAccounts, 
  expenseCategories, 
  onPay, 
  onDelete, 
  onDataChange 
}: PayableTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{payable.description}</TableCell>
      <TableCell>{payable.expense_categories?.name}</TableCell>
      <TableCell>{payable.bank_accounts?.name}</TableCell>
      <TableCell>
        {formatDateString(payable.due_date)}
      </TableCell>
      <TableCell className="text-right font-mono">
        R$ {payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell>
        <Badge variant={payable.is_paid ? 'default' : 'destructive'}>
          {payable.is_paid ? 'Pago' : 'Pendente'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {!payable.is_paid && payable.bank_account_id && (
            <Button
              size="sm"
              onClick={() => onPay(payable.id, payable.bank_account_id)}
            >
              Pagar
            </Button>
          )}
          <PayableEditDialog
            payable={payable}
            bankAccounts={bankAccounts}
            expenseCategories={expenseCategories}
            onPayableUpdated={onDataChange}
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(payable.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
