
import { useState } from 'react';
import { PayableDialog } from './PayableDialog';
import { PayableTable } from './payable/PayableTable';
import { PayableSortSelect } from './payable/PayableSortSelect';
import { usePayableActions } from './payable/usePayableActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

interface AccountsPayableTabProps {
  accountsPayable: AccountPayable[];
  bankAccounts: BankAccount[];
  expenseCategories: ExpenseCategory[];
  onDataChange: () => void;
}

type StatusFilter = 'pending' | 'paid' | 'all';

export const AccountsPayableTab = ({
  accountsPayable,
  bankAccounts,
  expenseCategories,
  onDataChange
}: AccountsPayableTabProps) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const { payAccount, deletePayable } = usePayableActions(accountsPayable, bankAccounts, onDataChange);
  const isMobile = useIsMobile();
  const [payableDialogOpen, setPayableDialogOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Contadores para os badges
  const pendingCount = accountsPayable.filter(p => !p.is_paid).length;
  const paidCount = accountsPayable.filter(p => p.is_paid).length;

  // Filtrar por status (pendente/paga)
  const filteredByStatus = statusFilter === 'all' 
    ? accountsPayable 
    : statusFilter === 'pending'
      ? accountsPayable.filter(payable => !payable.is_paid)
      : accountsPayable.filter(payable => payable.is_paid);

  // Filtrar por conta bancária
  const filteredByBankAccount = selectedBankAccount === 'all' 
    ? filteredByStatus 
    : filteredByStatus.filter(payable => payable.bank_account_id === selectedBankAccount);

  // Ordenar os dados baseado na data de vencimento e criação
  const sortedAccountsPayable = [...filteredByBankAccount].sort((a, b) => {
    const dueDateA = new Date(a.due_date).getTime();
    const dueDateB = new Date(b.due_date).getTime();
    
    // Se as datas de vencimento forem iguais, usar created_at como critério secundário
    if (dueDateA === dueDateB) {
      const createdDateA = new Date(a.created_at).getTime();
      const createdDateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? createdDateB - createdDateA : createdDateA - createdDateB;
    }
    
    return sortOrder === 'desc' ? dueDateB - dueDateA : dueDateA - dueDateB;
  });

  const handleSortChange = (value: 'desc' | 'asc') => {
    setSortOrder(value);
  };

  const StatusFilterButton = ({ filter, icon: Icon, label, count, color }: { 
    filter: StatusFilter; 
    icon: typeof Clock; 
    label: string; 
    count: number;
    color: string;
  }) => (
    <button
      onClick={() => setStatusFilter(filter)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        statusFilter === filter 
          ? `${color} text-white shadow-sm` 
          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className={isMobile ? 'hidden sm:inline' : ''}>{label}</span>
      <Badge 
        variant="secondary" 
        className={`ml-1 text-xs px-1.5 py-0 h-5 ${
          statusFilter === filter ? 'bg-white/20 text-white' : ''
        }`}
      >
        {count}
      </Badge>
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Linha de filtros e botão */}
      <div className={`flex flex-wrap items-center gap-2 ${isMobile ? 'justify-center' : 'justify-between'}`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de Status */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
            <StatusFilterButton 
              filter="pending" 
              icon={Clock} 
              label="Pendentes" 
              count={pendingCount}
              color="bg-amber-500"
            />
            <StatusFilterButton 
              filter="paid" 
              icon={CheckCircle2} 
              label="Pagas" 
              count={paidCount}
              color="bg-emerald-500"
            />
            <StatusFilterButton 
              filter="all" 
              icon={List} 
              label="Todas" 
              count={accountsPayable.length}
              color="bg-slate-600"
            />
          </div>

          {/* Filtro por conta bancária */}
          <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
            <SelectTrigger className={isMobile ? 'w-36 h-9 text-xs' : 'w-48'}>
              <SelectValue placeholder="Filtrar por conta" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todas as contas</SelectItem>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <PayableSortSelect
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            isMobile={isMobile}
          />
        </div>

      </div>

      <PayableTable
        accountsPayable={sortedAccountsPayable}
        bankAccounts={bankAccounts}
        expenseCategories={expenseCategories}
        onPay={payAccount}
        onDelete={deletePayable}
        onDataChange={onDataChange}
      />
      {/* Floating Action Button - Novo Pagamento */}
      <div className="fixed bottom-6 right-6 z-50">
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white transition-transform hover:scale-105"
              aria-label="Novo pagamento"
            >
              <Plus className={`h-6 w-6 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-56 p-1.5 mb-2">
            <button
              onClick={() => { setFabOpen(false); setPayableDialogOpen(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-slate-100 text-slate-700"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              Novo Pagamento
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <PayableDialog
        bankAccounts={bankAccounts}
        expenseCategories={expenseCategories}
        onPayableCreated={onDataChange}
        open={payableDialogOpen}
        onOpenChange={setPayableDialogOpen}
      />
    </div>
  );
};
