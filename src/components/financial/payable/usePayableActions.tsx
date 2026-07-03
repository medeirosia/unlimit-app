
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
  const payAccount = async (payableId: string, bankAccountId: string) => {
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

    console.log('💳 Processando pagamento:', {
      payable_id: payableId,
      description: payable.description,
      amount: payable.amount,
      bank_account: bankAccount.name,
      current_balance: bankAccount.balance,
      new_balance: bankAccount.balance - payable.amount
    });

    try {
      // Marcar conta como paga
      const { error: payableError } = await supabase
        .from('accounts_payable')
        .update({
          is_paid: true,
          paid_date: payable.due_date // Usar a data de vencimento como data de pagamento
        })
        .eq('id', payableId);

      if (payableError) {
        console.error('❌ Erro ao atualizar conta a pagar:', payableError);
        toast.error('Erro ao atualizar conta a pagar');
        return;
      }

      // Recalcular saldo da conta bancária de forma atômica
      const { error: balanceError } = await supabase.rpc('recalculate_bank_account_balance', {
        account_id: bankAccountId
      });

      if (balanceError) {
        console.error('❌ Erro ao recalcular saldo:', balanceError);
        toast.error('Erro ao recalcular saldo');
        return;
      }

      // Criar transação financeira
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert([{
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          description: `Pagamento: ${payable.description}`,
          amount: payable.amount,
          type: 'payment',
          from_account_id: bankAccountId,
          reference_id: payableId,
          reference_type: 'payable',
          transaction_date: payable.due_date // Usar a data de vencimento como data da transação
        }]);

      if (transactionError) {
        console.error('❌ Erro ao registrar transação:', transactionError);
        toast.error('Erro ao registrar transação');
        return;
      }

      console.log('✅ Pagamento processado com sucesso');
      toast.success('Pagamento realizado com sucesso');
      onDataChange();

    } catch (error) {
      console.error('❌ Erro no processo de pagamento:', error);
      toast.error('Erro ao processar pagamento');
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

  return { payAccount, deletePayable };
};
