
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PendingWithdrawal } from './usePendingWithdrawalsFetch';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export const useWithdrawalDeletion = () => {
  const [loading, setLoading] = useState(false);

  const handleDeleteWithdrawal = async (
    withdrawal: PendingWithdrawal, 
    bankAccounts: BankAccount[], 
    onDataChange: () => void,
    onRefreshWithdrawals: () => void
  ) => {
    try {
      setLoading(true);
      console.log('🗑️ Deletando saque:', withdrawal);
      
      // Verificar se o saque não foi completado
      if (withdrawal.is_completed) {
        toast.error('Não é possível apagar um saque já confirmado');
        return;
      }

      const fromAccount = bankAccounts.find(acc => acc.id === withdrawal.from_account_id);
      if (!fromAccount) {
        toast.error('Conta de origem não encontrada');
        return;
      }

      // PASSO 1: Verificar se existe transação pendente
      console.log('🔍 Verificando se existe transação pendente...');
      const { data: withdrawalTransactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('type', 'transfer')
        .eq('is_platform_withdrawal', true)
        .eq('status', 'pending')
        .eq('from_account_id', withdrawal.from_account_id)
        .eq('amount', withdrawal.amount);

      const hasTransaction = withdrawalTransactions && withdrawalTransactions.length > 0;
      console.log('💡 Transação encontrada:', hasTransaction);

      // Se não há transação pendente, significa que o débito já foi feito mas a transação falhou
      // Neste caso, apenas recalcular o saldo ao invés de adicionar manualmente
      if (!hasTransaction) {
        console.log('⚠️ Transação não encontrada, será feito recálculo do saldo');
      }

      // PASSO 2: Deletar a transação de saque se existir
      if (hasTransaction && withdrawalTransactions && withdrawalTransactions.length > 0) {
        console.log('🗑️ Deletando transação de saque...');
        const { error: deleteTransactionError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', withdrawalTransactions[0].id);

        if (deleteTransactionError) {
          console.error('❌ Erro ao deletar transação:', deleteTransactionError);
          throw new Error(`Erro ao deletar transação: ${deleteTransactionError.message}`);
        }
        console.log('✅ Transação de saque deletada');
      }

      // PASSO 3: Deletar despesas da taxa relacionadas (independente se está paga ou não)
      if (withdrawal.fee_amount > 0) {
        console.log('🗑️ Deletando despesas da taxa...');
        const { error: expenseError } = await supabase
          .from('accounts_payable')
          .delete()
          .like('description', `%Taxa de saque%`)
          .eq('amount', withdrawal.fee_amount)
          .eq('bank_account_id', withdrawal.from_account_id);

        if (expenseError) {
          console.error('⚠️ Aviso ao deletar despesas da taxa:', expenseError);
          // Não reverter aqui, pois as despesas podem não existir
        } else {
          console.log('✅ Despesas da taxa deletadas');
        }

        // PASSO 3.1: Deletar também a transação da taxa no extrato
        console.log('🗑️ Deletando transação da taxa no extrato...');
        const { error: feeTransactionError } = await supabase
          .from('financial_transactions')
          .delete()
          .like('description', `%Taxa de saque%`)
          .eq('amount', withdrawal.fee_amount)
          .eq('from_account_id', withdrawal.from_account_id)
          .eq('type', 'payment');

        if (feeTransactionError) {
          console.error('⚠️ Aviso ao deletar transação da taxa:', feeTransactionError);
        } else {
          console.log('✅ Transação da taxa deletada do extrato');
        }
      }

      // PASSO 4: Deletar o saque pendente
      console.log('🗑️ Deletando saque pendente...');
      const { error: withdrawalError } = await supabase
        .from('pending_withdrawals')
        .delete()
        .eq('id', withdrawal.id);

      if (withdrawalError) {
        console.error('❌ Erro ao deletar saque:', withdrawalError);
        throw new Error(`Erro ao deletar saque: ${withdrawalError.message}`);
      }
      console.log('✅ Saque pendente deletado');

      // PASSO 5: Recalcular o saldo da conta de origem
      console.log('🔄 Recalculando saldo da conta de origem...');
      const { error: recalcError } = await supabase.rpc('recalculate_bank_account_balance', { 
        account_id: withdrawal.from_account_id 
      });

      if (recalcError) {
        console.error('❌ Erro ao recalcular saldo:', recalcError);
        toast.error('Erro ao recalcular saldo da conta');
        return;
      }
      console.log('✅ Saldo recalculado com sucesso');

      toast.success('Saque apagado e valor restaurado com sucesso!');
      
      // Atualizar dados
      console.log('🔄 Atualizando dados...');
      await onRefreshWithdrawals();
      onDataChange();
      
    } catch (error) {
      console.error('🚨 ERRO GERAL ao apagar saque:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao apagar saque: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleDeleteWithdrawal
  };
};
