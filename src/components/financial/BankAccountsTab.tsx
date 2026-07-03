import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, ArrowRightLeft, Wallet } from 'lucide-react';
import { BankAccountTable } from './bank-accounts/BankAccountTable';
import { CreateAccountDialog } from './CreateAccountDialog';
import { TransferDialog } from './TransferDialog';
import { useBankAccounts } from '@/hooks/financial/useBankAccounts';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

interface BankAccountsTabProps {
  onDataChange?: () => Promise<void>;
}

export const BankAccountsTab = ({ onDataChange }: BankAccountsTabProps = {}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const { can } = useGlobalPermissions();
  const canEdit = can('financeiro.contas.editar');
  const {
    bankAccounts: allAccounts,
    loading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    archiveBankAccount,
  } = useBankAccounts();

  const bankAccounts = allAccounts.filter(a => can('financeiro.contas.ver_conta', a.id));

  const { fetchData } = useFinancialData();

  const handleCreateAccount = async (accountData: { name: string; initial_balance: number; }) => {
    const success = await createBankAccount(accountData);
    if (success) setCreateDialogOpen(false);
    return success;
  };

  const handleTransferComplete = async () => {
    if (onDataChange) await onDataChange();
    else await fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-slate-600">Carregando contas bancárias...</div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Floating Action Button - bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Popover open={fabOpen} onOpenChange={setFabOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white transition-transform hover:scale-105"
              aria-label="Ações"
            >
              <Plus className={`h-6 w-6 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-56 p-1.5 mb-2">
            <button
              onClick={() => { setFabOpen(false); setTransferDialogOpen(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-slate-100 text-slate-700"
            >
              <ArrowRightLeft className="h-4 w-4 text-slate-500" />
              Transferência
            </button>
            {canEdit && (
              <button
                onClick={() => { setFabOpen(false); setCreateDialogOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-slate-100 text-slate-700"
              >
                <Plus className="h-4 w-4 text-slate-500" />
                Nova Conta
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Conteúdo principal */}
      {bankAccounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Nenhuma conta bancária encontrada
            </h3>
            <p className="text-slate-600 mb-6">
              Comece criando sua primeira conta bancária
            </p>
            {canEdit && (
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Conta
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <BankAccountTable
            accounts={bankAccounts}
            onUpdate={async (id, updates) => updateBankAccount(id, updates)}
            onDelete={deleteBankAccount}
            onArchive={archiveBankAccount}
          />
        </div>
      )}

      <CreateAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateAccount={handleCreateAccount}
      />

      <TransferDialog
        bankAccounts={bankAccounts}
        onTransferComplete={handleTransferComplete}
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        hideTrigger
      />
    </div>
  );
};
