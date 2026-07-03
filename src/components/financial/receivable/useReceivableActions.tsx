
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
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

export const useReceivableActions = (
  accountsReceivable: AccountReceivable[],
  bankAccounts: BankAccount[],
  onDataChange: () => void
) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const receiveAccount = async (receivableId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(receivableId);
    const receivedDate = new Date().toISOString().split('T')[0];

    try {
      const receivable = accountsReceivable.find(r => r.id === receivableId);
      if (!receivable) {
        toast.error('Conta a receber não encontrada');
        return;
      }

      console.log('💰 [useReceivableActions] Processando recebimento:', {
        id: receivableId,
        description: receivable.description,
        amount: receivable.amount,
        bank_account_id: receivable.bank_account_id,
        due_date: receivable.due_date,
        original_due_date_format: receivable.due_date
      });

      // 1. Atualizar a conta a receber
      const { error: updateError } = await supabase
        .from('accounts_receivable')
        .update({
          is_received: true,
          received_date: receivedDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', receivableId);

      if (updateError) {
        console.error('❌ [useReceivableActions] Erro ao marcar conta como recebida:', updateError);
        toast.error('Erro ao marcar conta como recebida');
        return;
      }

      console.log('✅ [useReceivableActions] Conta marcada como recebida');

      // 2. Criar transação financeira correspondente usando EXATAMENTE a data de vencimento original
      if (receivable.bank_account_id && user?.id) {
        // 🎯 CORREÇÃO CRÍTICA: Usar diretamente a string da due_date
        const transactionDate = receivable.due_date; // Usar diretamente a string da due_date

        console.log('🔄 [useReceivableActions] Criando transação financeira:', {
          description: `Recebimento: ${receivable.description}`,
          amount: receivable.amount,
          to_account_id: receivable.bank_account_id,
          transaction_date: transactionDate,
          original_due_date: receivable.due_date,
          reference_id: receivableId,
          user_id: user.id
        });

        const { data: transactionData, error: transactionError } = await supabase
          .from('financial_transactions')
          .insert({
            description: `Recebimento: ${receivable.description}`,
            amount: receivable.amount,
            type: 'receipt',
            to_account_id: receivable.bank_account_id,
            transaction_date: transactionDate, // Usar diretamente a string da due_date
            reference_id: receivableId,
            reference_type: 'receivable',
            user_id: user.id
          })
          .select()
          .single();

        if (transactionError) {
          console.error('❌ [useReceivableActions] Erro ao criar transação financeira:', transactionError);
          toast.error('Erro ao criar transação financeira');
          
          // Reverter a atualização da conta a receber
          await supabase
            .from('accounts_receivable')
            .update({
              is_received: false,
              received_date: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', receivableId);
          
          return;
        }

        console.log('✅ [useReceivableActions] Transação financeira criada com sucesso:', {
          transaction_id: transactionData?.id,
          transaction_date_saved: transactionData?.transaction_date,
          original_due_date: receivable.due_date
        });
      }

      // 3. Recalcular saldo da conta bancária de forma atômica
      if (receivable.bank_account_id) {
        console.log('🏦 [useReceivableActions] Recalculando saldo da conta:', receivable.bank_account_id);

        const { error: balanceError } = await supabase.rpc('recalculate_bank_account_balance', {
          account_id: receivable.bank_account_id
        });

        if (balanceError) {
          console.error('❌ [useReceivableActions] Erro ao recalcular saldo da conta:', balanceError);
          toast.error('Erro ao recalcular saldo da conta');
        } else {
          console.log('✅ [useReceivableActions] Saldo da conta recalculado');
        }
      }

      toast.success('Conta marcada como recebida com sucesso!');
      console.log('🎉 [useReceivableActions] Processo de recebimento concluído com sucesso');
      onDataChange();
      
    } catch (error) {
      console.error('❌ [useReceivableActions] Erro inesperado ao processar recebimento:', error);
      toast.error('Erro inesperado ao processar recebimento');
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteReceivable = async (receivableId: string) => {
    try {
      const receivable = accountsReceivable.find(r => r.id === receivableId);
      if (!receivable) {
        toast.error('Conta a receber não encontrada');
        return;
      }

      console.log('🗑️ [useReceivableActions] Deletando conta a receber:', {
        id: receivableId,
        description: receivable.description,
        is_received: receivable.is_received
      });

      // Se a conta foi recebida, precisamos reverter as operações
      if (receivable.is_received && receivable.bank_account_id) {
        // Deletar transação financeira associada
        const { error: transactionDeleteError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('reference_id', receivableId)
          .eq('reference_type', 'receivable');

        if (transactionDeleteError) {
          console.error('❌ [useReceivableActions] Erro ao deletar transação:', transactionDeleteError);
        }
      }

      // Deletar a conta a receber
      const { error: deleteError } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', receivableId);

      if (deleteError) {
        console.error('❌ [useReceivableActions] Erro ao excluir conta a receber:', deleteError);
        toast.error('Erro ao excluir conta a receber');
        return;
      }

      console.log('✅ [useReceivableActions] Conta a receber excluída com sucesso');

      // Recalcular saldo da conta se a conta era recebida
      if (receivable.is_received && receivable.bank_account_id) {
        await supabase.rpc('recalculate_bank_account_balance', {
          account_id: receivable.bank_account_id
        });
      }

      toast.success('Conta a receber excluída com sucesso!');
      onDataChange();
      
    } catch (error) {
      console.error('❌ [useReceivableActions] Erro inesperado ao excluir conta:', error);
      toast.error('Erro inesperado ao excluir conta');
    }
  };

  return {
    receiveAccount,
    deleteReceivable,
    isProcessing
  };
};
