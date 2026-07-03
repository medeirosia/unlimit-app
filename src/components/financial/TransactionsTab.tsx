
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Undo, ArrowRight, Calendar } from 'lucide-react';
import { TransactionFilters } from './transactions/TransactionFilters';
import { TransactionTableRow } from './transactions/TransactionTableRow';
import { useTransactionUndo } from './transactions/useTransactionUndo';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { filterTransactionsByPeriod, sortTransactions } from './transactions/transactionUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDateOnlyBrazil } from '@/utils/dateUtils';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

interface TransactionsTabProps {
  financialTransactions: FinancialTransaction[];
  bankAccounts: BankAccount[];
  onDataChange: () => void;
  selectedMonth: string;
  selectedYear: string;
}

export const TransactionsTab = ({
  financialTransactions,
  bankAccounts: allBankAccounts,
  onDataChange,
  selectedMonth,
  selectedYear
}: TransactionsTabProps) => {
  const { can } = useGlobalPermissions();
  const bankAccounts = useMemo(
    () => allBankAccounts.filter(a => can('financeiro.contas.ver_conta', a.id)),
    [allBankAccounts, can]
  );
  const visibleAccountIds = useMemo(() => new Set(bankAccounts.map(a => a.id)), [bankAccounts]);
  const visibleTransactions = useMemo(
    () => financialTransactions.filter(t => {
      const from = t.from_account_id;
      const to = t.to_account_id;
      // Hide transaction if it references an account the user cannot see
      if (from && !visibleAccountIds.has(from)) return false;
      if (to && !visibleAccountIds.has(to)) return false;
      return true;
    }),
    [financialTransactions, visibleAccountIds]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const isMobile = useIsMobile();

  const { undoTransaction } = useTransactionUndo(visibleTransactions, bankAccounts, onDataChange);

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = filterTransactionsByPeriod(
      visibleTransactions,
      selectedMonth,
      selectedYear,
      searchTerm,
      selectedAccount,
      selectedType
    );
    
    return sortTransactions(filtered, sortBy);
  }, [visibleTransactions, selectedMonth, selectedYear, searchTerm, selectedAccount, selectedType, sortBy]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getTransactionBadge = (transaction: FinancialTransaction) => {
    if (transaction.is_platform_withdrawal) {
      if (transaction.status === 'pending') {
        return <Badge className="bg-amber-700 text-white text-xs">Saque Pendente</Badge>;
      } else if (transaction.status === 'confirmed') {
        return <Badge className="bg-green-700 text-white text-xs">Saque Confirmado</Badge>;
      }
      return <Badge className="bg-purple-700 text-white text-xs">Saque de Plataforma</Badge>;
    }

    if (transaction.type === 'transfer' && transaction.reference_type === 'withdrawal') {
      return <Badge className="bg-green-700 text-white text-xs">Saque Confirmado</Badge>;
    }

    switch (transaction.type) {
      case 'transfer':
        return <Badge className="bg-blue-700 text-white text-xs">Transferência</Badge>;
      case 'payment':
        return <Badge className="bg-red-700 text-white text-xs">Pagamento</Badge>;
      case 'receipt':
        return <Badge className="bg-green-700 text-white text-xs">Recebimento</Badge>;
      case 'adjustment':
        return <Badge className="bg-gray-700 text-white text-xs">Ajuste</Badge>;
      default:
        return <Badge className="bg-gray-700 text-white text-xs">{transaction.type || 'Desconhecido'}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
        <div>
          <h2 className={`font-bold text-slate-800 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Extrato de Transações</h2>
          <p className="text-sm text-slate-600">
            {selectedMonth}/{selectedYear} • {filteredAndSortedTransactions.length} transações
          </p>
        </div>
      </div>

      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        sortBy={sortBy}
        onSortChange={setSortBy}
        bankAccounts={bankAccounts}
      />

      {isMobile ? (
        <div className="space-y-3">
          {filteredAndSortedTransactions.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhuma transação encontrada para o período selecionado
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTransactions.map((transaction) => (
              <Card key={transaction.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{transaction.description}</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {formatAmount(transaction.amount)}
                      </p>
                    </div>
                    {getTransactionBadge(transaction)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateOnlyBrazil(transaction.transaction_date || transaction.created_at)}
                    </div>
                    {(transaction.from_account?.name || transaction.to_account?.name) && (
                      <div className="flex items-center gap-1">
                        <span>{transaction.from_account?.name || '-'}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{transaction.to_account?.name || '-'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => undoTransaction(transaction.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Undo className="h-4 w-4 mr-1" />
                      Desfazer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gray-50/50">
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </TableHead>
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </TableHead>
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </TableHead>
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origem
                  </TableHead>
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </TableHead>
                  <TableHead className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </TableHead>
                  <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.length === 0 ? (
                  <TableRow>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma transação encontrada para o período selecionado
                    </td>
                  </TableRow>
                ) : (
                  filteredAndSortedTransactions.map((transaction) => (
                    <TransactionTableRow
                      key={transaction.id}
                      transaction={transaction}
                      onUndo={undoTransaction}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
