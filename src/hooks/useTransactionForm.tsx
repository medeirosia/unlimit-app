
import { useState } from 'react';
import { Transaction } from '@/types/dashboard';
import { toast } from 'sonner';

interface UseTransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onEditPendingTransaction?: (transactionId: string, transaction: Omit<Transaction, 'id'>) => void;
}

export const useTransactionForm = ({ onAddTransaction, onEditPendingTransaction }: UseTransactionFormProps) => {
  // Get current date in local timezone (user's computer timezone)
  const getCurrentLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    project: '',
    type: '' as 'revenue' | 'investment' | 'low-ticket-revenue' | '',
    amount: 0,
    date: getCurrentLocalDate(),
    description: '',
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project || !formData.type || !formData.amount) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const transaction = {
      project: formData.project,
      type: formData.type as 'revenue' | 'investment' | 'low-ticket-revenue',
      amount: formData.amount,
      date: formData.date,
      description: formData.description,
    };

    if (editingTransaction) {
      onEditPendingTransaction?.(editingTransaction.id, transaction);
      setEditingTransaction(null);
      setEditDialogOpen(false);
      toast.success('Transação editada com sucesso!');
    } else {
      onAddTransaction(transaction);
      toast.success('Transação adicionada com sucesso!');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      project: '',
      type: '' as 'revenue' | 'investment' | 'low-ticket-revenue' | '',
      amount: 0,
      date: getCurrentLocalDate(),
      description: '',
    });
  };

  const handleEditPending = (transaction: Transaction) => {
    setFormData({
      project: transaction.project,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description || '',
    });
    setEditingTransaction(transaction);
    setEditDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setEditDialogOpen(false);
    resetForm();
  };

  return {
    formData,
    setFormData,
    editingTransaction,
    editDialogOpen,
    setEditDialogOpen,
    handleSubmit,
    handleEditPending,
    cancelEdit,
  };
};
