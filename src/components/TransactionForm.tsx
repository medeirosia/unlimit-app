
import { Transaction, Mentorship } from '@/types/dashboard';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { TransactionFormFields } from './transactions/TransactionFormFields';
import { PendingTransactionsSection } from './transactions/PendingTransactionsSection';
import { TransactionHistorySection } from './transactions/TransactionHistorySection';
import { toast } from 'sonner';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  transactions: Transaction[];
  mentorships: Mentorship[];
  selectedMonth: number;
  selectedYear: number;
  onUndoTransaction?: (transactionId: string) => void;
  onEditPendingTransaction?: (transactionId: string, transaction: Omit<Transaction, 'id'>) => void;
  onDeletePendingTransaction?: (transactionId: string) => void;
  onRestorePendingTransaction?: (transactionId: string) => void;
  pendingTransactions?: Transaction[];
  onUpdateMentorship?: (mentorshipId: string, updatedMentorship: Mentorship) => void;
}

export const TransactionForm = ({ 
  onAddTransaction, 
  transactions, 
  mentorships,
  selectedMonth, 
  selectedYear,
  onUndoTransaction,
  onEditPendingTransaction,
  onDeletePendingTransaction,
  onRestorePendingTransaction,
  pendingTransactions = [],
  onUpdateMentorship
}: TransactionFormProps) => {
  const {
    formData,
    setFormData,
    editingTransaction,
    editDialogOpen,
    setEditDialogOpen,
    handleSubmit,
    handleEditPending,
    cancelEdit,
  } = useTransactionForm({ onAddTransaction, onEditPendingTransaction });

  return (
    <div className="space-y-6">
      <TransactionFormFields
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        editingTransaction={editingTransaction}
        onCancel={cancelEdit}
      />

      <PendingTransactionsSection
        pendingTransactions={pendingTransactions}
        onEditPendingTransaction={onEditPendingTransaction}
        onDeletePendingTransaction={onDeletePendingTransaction}
        onRestorePendingTransaction={onRestorePendingTransaction}
        formData={formData}
        setFormData={setFormData}
        editingTransaction={editingTransaction}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        handleSubmit={handleSubmit}
        handleEditPending={handleEditPending}
        cancelEdit={cancelEdit}
      />

      <TransactionHistorySection
        transactions={transactions}
        mentorships={mentorships}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onUndoTransaction={onUndoTransaction}
        onUpdateMentorship={onUpdateMentorship}
      />
    </div>
  );
};
