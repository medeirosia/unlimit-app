
import { usePendingWithdrawals } from '@/hooks/financial/usePendingWithdrawals';
import { PendingWithdrawalsHeader } from './pending-withdrawals/PendingWithdrawalsHeader';
import { PendingWithdrawalsEmpty } from './pending-withdrawals/PendingWithdrawalsEmpty';
import { WithdrawalCard } from './pending-withdrawals/WithdrawalCard';
import type { BankAccount } from '@/types/financial';

interface PendingWithdrawalsTabProps {
  bankAccounts: BankAccount[];
  onDataChange: () => void;
}

export const PendingWithdrawalsTab = ({ bankAccounts, onDataChange }: PendingWithdrawalsTabProps) => {
  const {
    pendingWithdrawals,
    loading,
    fetchPendingWithdrawals,
    handleConfirmWithdrawal,
    handleDeleteWithdrawal
  } = usePendingWithdrawals();

  console.log('🎨 Renderizando PendingWithdrawalsTab');
  console.log('📊 Estado atual:', {
    withdrawalsCount: pendingWithdrawals.length,
    loading,
    withdrawals: pendingWithdrawals
  });

  const onConfirmWithdrawal = (withdrawal: any) => {
    handleConfirmWithdrawal(withdrawal, bankAccounts, onDataChange);
  };

  const onDeleteWithdrawal = (withdrawal: any) => {
    handleDeleteWithdrawal(withdrawal, bankAccounts, onDataChange);
  };

  const handleRefresh = () => {
    console.log('🔄 Botão Atualizar clicado - Forçando re-fetch');
    fetchPendingWithdrawals();
  };

  return (
    <div className="space-y-6">
      <PendingWithdrawalsHeader 
        pendingCount={pendingWithdrawals.length}
        onRefresh={handleRefresh}
        bankAccounts={bankAccounts}
        onDataChange={onDataChange}
      />

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">Carregando saques pendentes...</div>
        </div>
      ) : pendingWithdrawals.length === 0 ? (
        <PendingWithdrawalsEmpty />
      ) : (
        <div className="grid gap-4">
          {pendingWithdrawals.map((withdrawal) => {
            console.log('🎯 Renderizando withdrawal:', withdrawal);
            return (
              <WithdrawalCard
                key={withdrawal.id}
                withdrawal={withdrawal}
                loading={loading}
                onConfirm={onConfirmWithdrawal}
                onDelete={onDeleteWithdrawal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
