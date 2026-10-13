
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
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

export const usePayableActions = (
  accountsPayable: AccountPayable[],
  bankAccounts: BankAccount[],
  onDataChange: () => void
) => {
  const processingRef = useRef(new Set<string>());
  const [processingIds, setProcessingIds] = useState<Set<string>>(() => new Set());

  const payAccount = async (payableId: string, bankAccountId: string) => {
    if (processingRef.current.has(payableId)) return;
    const payable = accountsPayable.find(p => p.id === payableId);
    if (!payable) {
      console.error('❌ Conta a pagar não encontrada');
      return;
    }

    const bankAccount = bankAccounts.find(acc => acc.id === bankAccountId);
    if (!bankAccount) {
      console.error('❌ Conta bancária não encontrada');
      toast.error('Conta bancária não encontrada');
      return;
    }

    processingRef.current.add(payableId);
    setProcessingIds(new Set(processingRef.current));

    try {
      // O banco registra pagamento e extrato na mesma transação.
      // Repetir a chamada retorna o pagamento já existente.
      const { error } = await supabase.rpc('pay_account_payable', {
        p_payable_id: payableId
      });
      if (error) throw error;

      console.log('✅ Pagamento processado com sucesso');
      toast.success('Pagamento realizado com sucesso');
      onDataChange();

    } catch (error) {
      console.error('❌ Erro no processo de pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      processingRef.current.delete(payableId);
      setProcessingIds(new Set(processingRef.current));
    }
  };

  const deletePayable = async (payableId: string) => {
    console.log('🗑️ Deletando conta a pagar:', payableId);
    
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', payableId);

    if (error) {
      console.error('❌ Erro ao deletar conta a pagar:', error);
      toast.error('Erro ao deletar conta a pagar');
      return;
    }

    console.log('✅ Conta a pagar deletada com sucesso');
    toast.success('Conta a pagar deletada com sucesso');
    onDataChange();
  };

  return { payAccount, deletePayable, processingIds };
};
