

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/dashboard';
import { DollarSign, TrendingUp, Undo } from 'lucide-react';
import { getProjectDisplayName, getTransactionTypeLabel } from './utils/transactionUtils';

interface TransactionTableProps {
  transactions: Transaction[];
  showUndoButton?: boolean;
  onUndoTransaction?: (transactionId: string) => void;
}

// Função para formatar data corretamente sem problemas de timezone
const formatDateForDisplay = (dateString: string) => {
  // Parse the date as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day); // month is 0-indexed
  
  return localDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const TransactionTable = ({ 
  transactions, 
  showUndoButton = false, 
  onUndoTransaction 
}: TransactionTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead className="text-right">Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            {showUndoButton && <TableHead className="text-center">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-sm">
                {formatDateForDisplay(transaction.date)}
              </TableCell>
              <TableCell className="text-sm">
                {getProjectDisplayName(transaction.project)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <Badge 
                    variant={transaction.type.includes('revenue') ? 'default' : 'secondary'}
                    className="flex items-center gap-1 w-fit"
                  >
                    {transaction.type.includes('revenue') ? (
                      <DollarSign className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    {getTransactionTypeLabel(transaction.type)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {transaction.description || '-'}
              </TableCell>
              <TableCell className={`text-right font-medium ${
                transaction.type.includes('revenue') ? 'text-green-600' : 'text-blue-600'
              }`}>
                R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              {showUndoButton && (
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUndoTransaction?.(transaction.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
