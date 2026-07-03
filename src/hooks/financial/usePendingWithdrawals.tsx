
import { useEffect } from 'react';
import { usePendingWithdrawalsFetch } from './usePendingWithdrawalsFetch';
import { useWithdrawalConfirmation } from './useWithdrawalConfirmation';
import { useWithdrawalDeletion } from './useWithdrawalDeletion';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export const usePendingWithdrawals = () => {
  const {
    pendingWithdrawals,
    loading: fetchLoading,
    fetchPendingWithdrawals
  } = usePendingWithdrawalsFetch();

  const {
    loading: confirmLoading,
    handleConfirmWithdrawal: confirmWithdrawal
  } = useWithdrawalConfirmation();

  const {
    loading: deleteLoading,
    handleDeleteWithdrawal: deleteWithdrawal
  } = useWithdrawalDeletion();

  const handleConfirmWithdrawal = (withdrawal: any, bankAccounts: BankAccount[], onDataChange: () => void) => {
    confirmWithdrawal(withdrawal, bankAccounts, onDataChange, fetchPendingWithdrawals);
  };

  const handleDeleteWithdrawal = (withdrawal: any, bankAccounts: BankAccount[], onDataChange: () => void) => {
    deleteWithdrawal(withdrawal, bankAccounts, onDataChange, fetchPendingWithdrawals);
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchPendingWithdrawals();
  }, [fetchPendingWithdrawals]);

  return {
    pendingWithdrawals,
    loading: fetchLoading || confirmLoading || deleteLoading,
    fetchPendingWithdrawals,
    handleConfirmWithdrawal,
    handleDeleteWithdrawal
  };
};

// Re-export the interface for components that need it
export type { PendingWithdrawal } from './usePendingWithdrawalsFetch';
