
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Undo } from 'lucide-react';
import { formatDateOnlyBrazil } from '@/utils/dateUtils';
import type { FinancialTransaction } from '@/types/financial';

interface TransactionTableRowProps {
  transaction: FinancialTransaction;
  onUndo: (transactionId: string) => void;
}

export const TransactionTableRow = ({ transaction, onUndo }: TransactionTableRowProps) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // 🎯 CORREÇÃO: Sempre usar transaction_date como prioridade, se disponível
  const dateToDisplay = transaction.transaction_date || transaction.created_at;
  
  console.log('📅 [TransactionTableRow] Data que será exibida:', {
    transaction_id: transaction.id,
    description: transaction.description,
    transaction_date: transaction.transaction_date,
    created_at: transaction.created_at,
    final_date_to_display: dateToDisplay
  });

  const getStatusBadge = () => {
    // 🚨 SAQUE DE PLATAFORMA (is_platform_withdrawal = true)
    if (transaction.is_platform_withdrawal) {
      if (transaction.status === 'pending') {
        return (
          <Badge className="bg-amber-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Saque Pendente
          </Badge>
        );
      } else if (transaction.status === 'confirmed') {
        return (
          <Badge className="bg-green-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Saque Confirmado
          </Badge>
        );
      }
      return (
        <Badge className="bg-purple-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
          Saque de Plataforma
        </Badge>
      );
    }

    // Transferência que é resultado de saque confirmado
    if (transaction.type === 'transfer' && transaction.reference_type === 'withdrawal') {
      return (
        <Badge className="bg-green-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
          Saque Confirmado
        </Badge>
      );
    }

    // Outros tipos de transação
    switch (transaction.type) {
      case 'transfer':
        return (
          <Badge className="bg-blue-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Transferência
          </Badge>
        );
      case 'payment':
        return (
          <Badge className="bg-red-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Pagamento
          </Badge>
        );
      case 'receipt':
        return (
          <Badge className="bg-green-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Recebimento
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge className="bg-gray-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            Ajuste
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-700 text-white border-0 whitespace-nowrap px-3 py-1 text-xs font-medium">
            {transaction.type || 'Desconhecido'}
          </Badge>
        );
    }
  };

  return (
    <TableRow className="hover:bg-gray-50/80">
      <TableCell className="py-4 px-4 text-sm text-gray-600 font-medium">
        {formatDateOnlyBrazil(dateToDisplay)}
      </TableCell>
      <TableCell className="py-4 px-4">
        <div className="text-sm text-gray-900 font-medium">
          {transaction.description}
        </div>
      </TableCell>
      <TableCell className="py-4 px-4">
        {getStatusBadge()}
      </TableCell>
      <TableCell className="py-4 px-4 text-sm text-gray-600">
        {transaction.from_account?.name || '-'}
      </TableCell>
      <TableCell className="py-4 px-4 text-sm text-gray-600">
        {transaction.to_account?.name || '-'}
      </TableCell>
      <TableCell className="py-4 px-4 text-right">
        <span className="text-sm font-semibold text-gray-900">
          {formatAmount(transaction.amount)}
        </span>
      </TableCell>
      <TableCell className="py-4 px-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUndo(transaction.id)}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          title="Desfazer transação"
        >
          <Undo className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
