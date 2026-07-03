
import { useState } from 'react';
import { ReceivableDialog } from './ReceivableDialog';
import { ReceivableTable } from './receivable/ReceivableTable';
import { ReceivableSortSelect } from './receivable/ReceivableSortSelect';
import { useReceivableActions } from './receivable/useReceivableActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

interface AccountsReceivableTabProps {
  accountsReceivable: AccountReceivable[];
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  onDataChange: () => void;
}

export const AccountsReceivableTab = ({
  accountsReceivable,
  bankAccounts,
  receivableCategories,
  onDataChange
}: AccountsReceivableTabProps) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('all');
  const isMobile = useIsMobile();
  const { receiveAccount, deleteReceivable } = useReceivableActions(
    accountsReceivable,
    bankAccounts,
    onDataChange
  );
  const [receivableDialogOpen, setReceivableDialogOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  console.log('📊 [ReceivableTab] Props recebidas:', {
    accountsReceivableLength: accountsReceivable.length,
    bankAccountsLength: bankAccounts.length,
    receivableCategoriesLength: receivableCategories.length,
    selectedBankAccount,
    sortOrder
  });

  console.log('📋 [ReceivableTab] Lista completa de contas a receber:', 
    accountsReceivable.map(item => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      due_date: item.due_date,
      is_received: item.is_received,
      received_date: item.received_date,
      created_at: item.created_at,
      bank_account_id: item.bank_account_id,
      category_id: item.category_id,
      bank_account_name: item.bank_accounts?.name,
      category_name: item.receivable_categories?.name
    }))
  );

  // Filtrar por conta bancária
  const filteredByBankAccount = selectedBankAccount === 'all' 
    ? accountsReceivable 
    : accountsReceivable.filter(receivable => receivable.bank_account_id === selectedBankAccount);

  console.log('🔍 [ReceivableTab] Após filtro por conta bancária:', {
    originalCount: accountsReceivable.length,
    filteredCount: filteredByBankAccount.length,
    selectedBankAccount,
    filteredItems: filteredByBankAccount.map(item => ({
      id: item.id,
      description: item.description,
      bank_account_id: item.bank_account_id
    }))
  });

  // Ordenar os dados baseado na data de vencimento e created_at
  const sortedAccountsReceivable = [...filteredByBankAccount].sort((a, b) => {
    // Para contas recebidas, priorizar received_date ou created_at
    // Para contas pendentes, usar due_date
    let dateA: Date, dateB: Date;
    
    if (a.is_received) {
      dateA = new Date(a.received_date || a.created_at);
    } else {
      dateA = new Date(a.due_date);
    }
    
    if (b.is_received) {
      dateB = new Date(b.received_date || b.created_at);
    } else {
      dateB = new Date(b.due_date);
    }
    
    // Se as datas forem iguais, usar created_at como critério secundário
    if (dateA.getTime() === dateB.getTime()) {
      const createdDateA = new Date(a.created_at).getTime();
      const createdDateB = new Date(b.created_at).getTime();
      
      const result = sortOrder === 'desc' ? createdDateB - createdDateA : createdDateA - createdDateB;
      console.log('[ReceivableTab] Secondary Sorting by created_at:', { 
        createdA: a.created_at, 
        createdB: b.created_at, 
        sortOrder, 
        result,
        descA: a.description,
        descB: b.description
      });
      return result;
    }
    
    // desc = mais recentes primeiro (dateB - dateA)
    // asc = mais antigas primeiro (dateA - dateB)
    const result = sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    console.log('[ReceivableTab] Primary Sorting by date:', { 
      dateA: dateA.toISOString(), 
      dateB: dateB.toISOString(), 
      sortOrder, 
      result,
      descA: a.description,
      descB: b.description
    });
    return result;
  });

  console.log('📊 [ReceivableTab] Dados finais para renderização:', {
    sortedCount: sortedAccountsReceivable.length,
    items: sortedAccountsReceivable.map(item => ({
      id: item.id,
      description: item.description,
      amount: item.amount,
      due_date: item.due_date,
      is_received: item.is_received,
      created_at: item.created_at,
      received_date: item.received_date,
      bank_account_name: item.bank_accounts?.name,
      category_name: item.receivable_categories?.name
    }))
  });

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
        <h2 className={`font-bold text-slate-800 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Contas a Receber</h2>
        {isMobile ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger className="h-9 text-xs px-2">
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todas</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ReceivableSortSelect
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                isMobile={true}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
              <SelectTrigger className="w-48">
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
            <ReceivableSortSelect
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </div>
        )}
      </div>

      <ReceivableTable
        accountsReceivable={sortedAccountsReceivable}
        bankAccounts={bankAccounts}
        receivableCategories={receivableCategories}
        onReceive={receiveAccount}
        onDelete={deleteReceivable}
        onDataChange={onDataChange}
      />

      {/* Floating Action Button - Nova Conta a Receber */}
      <div className="fixed bottom-6 right-6 z-50">
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white transition-transform hover:scale-105"
              aria-label="Nova conta a receber"
            >
              <Plus className={`h-6 w-6 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-56 p-1.5 mb-2">
            <button
              onClick={() => { setFabOpen(false); setReceivableDialogOpen(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-slate-100 text-slate-700"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              Nova Conta a Receber
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <ReceivableDialog
        bankAccounts={bankAccounts}
        receivableCategories={receivableCategories}
        onReceivableCreated={onDataChange}
        open={receivableDialogOpen}
        onOpenChange={setReceivableDialogOpen}
      />
    </div>
  );
};
