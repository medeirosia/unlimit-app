
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Wallet, Tag } from 'lucide-react';
import { PayableTableRow } from './PayableTableRow';
import { PayableEditDialog } from './PayableEditDialog';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface PayableTableProps {
  accountsPayable: AccountPayable[];
  bankAccounts: BankAccount[];
  expenseCategories: ExpenseCategory[];
  onPay: (payableId: string, bankAccountId: string) => void;
  onDelete: (payableId: string) => void;
  onDataChange: () => void;
}

export const PayableTable = ({ 
  accountsPayable, 
  bankAccounts, 
  expenseCategories, 
  onPay, 
  onDelete, 
  onDataChange 
}: PayableTableProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {accountsPayable.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma conta a pagar encontrada
            </CardContent>
          </Card>
        ) : (
          accountsPayable.map((payable) => (
            <Card key={payable.id} className={`bg-white border-l-4 ${payable.is_paid ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{payable.description}</p>
                    <p className="text-lg font-bold text-red-600 mt-1">
                      R$ {payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Badge variant={payable.is_paid ? 'default' : 'destructive'} className="ml-2 shrink-0">
                    {payable.is_paid ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateString(payable.due_date)}
                  </div>
                  {payable.expense_categories?.name && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {payable.expense_categories.name}
                    </div>
                  )}
                  {payable.bank_accounts?.name && (
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      {payable.bank_accounts.name}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!payable.is_paid && payable.bank_account_id && (
                    <Button
                      size="sm"
                      className="flex-1"
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsPayable.map((payable) => (
              <PayableTableRow
                key={payable.id}
                payable={payable}
                bankAccounts={bankAccounts}
                expenseCategories={expenseCategories}
                onPay={onPay}
                onDelete={onDelete}
                onDataChange={onDataChange}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
