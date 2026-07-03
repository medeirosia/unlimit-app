
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Wallet, Tag } from 'lucide-react';
import { ReceivableTableRow } from './ReceivableTableRow';
import { ReceivableEditDialog } from './ReceivableEditDialog';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface ReceivableTableProps {
  accountsReceivable: AccountReceivable[];
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  onReceive: (receivableId: string, bankAccountId: string) => void;
  onDelete: (receivableId: string) => void;
  onDataChange: () => void;
}

export const ReceivableTable = ({ 
  accountsReceivable, 
  bankAccounts, 
  receivableCategories, 
  onReceive, 
  onDelete, 
  onDataChange 
}: ReceivableTableProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {accountsReceivable.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma conta a receber encontrada
            </CardContent>
          </Card>
        ) : (
          accountsReceivable.map((receivable) => (
            <Card key={receivable.id} className={`bg-white border-l-4 ${receivable.is_received ? 'border-l-green-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{receivable.description}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      R$ {receivable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Badge variant={receivable.is_received ? 'default' : 'secondary'} className="ml-2 shrink-0">
                    {receivable.is_received ? 'Recebido' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateString(receivable.due_date)}
                  </div>
                  {receivable.receivable_categories?.name && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {receivable.receivable_categories.name}
                    </div>
                  )}
                  {receivable.bank_accounts?.name && (
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      {receivable.bank_accounts.name}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!receivable.is_received && receivable.bank_account_id && (
                    <Button
                      size="sm"
                      className="flex-1"
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
              <TableHead className="text-right w-32">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsReceivable.map((receivable) => (
              <ReceivableTableRow
                key={receivable.id}
                receivable={receivable}
                bankAccounts={bankAccounts}
                receivableCategories={receivableCategories}
                onReceive={onReceive}
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
