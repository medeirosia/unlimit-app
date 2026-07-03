
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ReceivableEditDialog } from './ReceivableEditDialog';
import { formatDateString } from '@/utils/dateUtils';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface ReceivableCategory {
  id: string;
  name: string;
  created_at: string;
}

interface AccountReceivable {
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

interface ReceivableTableRowProps {
  receivable: AccountReceivable;
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  onReceive: (receivableId: string, bankAccountId: string) => void;
  onDelete: (receivableId: string) => void;
  onDataChange: () => void;
}

export const ReceivableTableRow = ({ 
  receivable, 
  bankAccounts, 
  receivableCategories, 
  onReceive, 
  onDelete, 
  onDataChange 
}: ReceivableTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{receivable.description}</TableCell>
      <TableCell>{receivable.receivable_categories?.name}</TableCell>
      <TableCell>{receivable.bank_accounts?.name}</TableCell>
      <TableCell>
        {formatDateString(receivable.due_date)}
      </TableCell>
      <TableCell className="text-right font-mono">
        R$ {receivable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell>
        <Badge variant={receivable.is_received ? 'default' : 'destructive'}>
          {receivable.is_received ? 'Recebido' : 'Pendente'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {!receivable.is_received && receivable.bank_account_id && (
            <Button
              size="sm"
              onClick={() => onReceive(receivable.id, receivable.bank_account_id)}
            >
              Receber
            </Button>
          )}
          <ReceivableEditDialog
            receivable={receivable}
            bankAccounts={bankAccounts}
            receivableCategories={receivableCategories}
            onReceivableUpdated={onDataChange}
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(receivable.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
