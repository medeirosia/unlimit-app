
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export const useWithdrawalCorrection = () => {
  const [loading, setLoading] = useState(false);

  const correctCompletedWithdrawal = async (
    withdrawalId: string, 
    bankAccounts: BankAccount[],
    onDataChange: () => void
  ) => {
    try {
      setLoading(true);
      console.log('🔧 Iniciando correção do saque:', withdrawalId);

      // Buscar dados do saque
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('pending_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .eq('is_completed', true)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('❌ Erro ao buscar saque:', withdrawalError);
        throw new Error('Saque não encontrado ou não está completo');
      }

      console.log('📋 Dados do saque encontrado:', withdrawal);

      // Verificar se já existe transação de transferência
      const { data: existingTransfer } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('type', 'transfer')
        .eq('from_account_id', withdrawal.from_account_id)
        .eq('to_account_id', withdrawal.to_account_id)
        .eq('amount', withdrawal.amount)
        .eq('reference_type', 'withdrawal')
        .eq('reference_id', withdrawal.id)
        .maybeSingle();

      console.log('🔍 Transação existente:', { transfer: existingTransfer });

      // Criar transação de transferência se não existir
      if (!existingTransfer) {
        console.log('➕ Criando transação de transferência...');
        const { error: transferError } = await supabase
          .from('financial_transactions')
          .insert([{
            user_id: withdrawal.user_id,
            description: `Saque confirmado - ${withdrawal.description}`,
            amount: withdrawal.amount,
            type: 'transfer',
            from_account_id: withdrawal.from_account_id,
            to_account_id: withdrawal.to_account_id,
            reference_id: withdrawal.id,
            reference_type: 'withdrawal',
            transaction_date: withdrawal.completed_at || withdrawal.created_at
          }]);

        if (transferError) {
          console.error('❌ Erro ao criar transação de transferência:', transferError);
          throw new Error(`Erro ao criar transação de transferência: ${transferError.message}`);
        }
        console.log('✅ Transação de transferência criada');
      } else {
        console.log('ℹ️ Transação de transferência já existe');
      }

      toast.success('Histórico do saque corrigido com sucesso!');
      onDataChange();
      
    } catch (error) {
      console.error('🚨 Erro ao corrigir saque:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao corrigir histórico: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const correctAllIncompleteWithdrawals = async (
    bankAccounts: BankAccount[],
    onDataChange: () => void
  ) => {
    try {
      setLoading(true);
      console.log('🔧 Buscando todos os saques completos sem histórico correto...');

      // Buscar saques completos
      const { data: completedWithdrawals, error: withdrawalsError } = await supabase
        .from('pending_withdrawals')
        .select('*')
        .eq('is_completed', true);

      if (withdrawalsError) {
        console.error('❌ Erro ao buscar saques:', withdrawalsError);
        throw new Error('Erro ao buscar saques completos');
      }

      if (!completedWithdrawals || completedWithdrawals.length === 0) {
        toast.info('Nenhum saque completo encontrado');
        return;
      }

      console.log(`📊 Encontrados ${completedWithdrawals.length} saques completos`);

      let correctedCount = 0;

      for (const withdrawal of completedWithdrawals) {
        try {
          await correctCompletedWithdrawal(withdrawal.id, bankAccounts, () => {});
          correctedCount++;
        } catch (error) {
          console.error(`Erro ao corrigir saque ${withdrawal.id}:`, error);
        }
      }

      if (correctedCount > 0) {
        toast.success(`${correctedCount} saque(s) corrigido(s) com sucesso!`);
        onDataChange();
      } else {
        toast.info('Todos os saques já estão com histórico correto');
      }

    } catch (error) {
      console.error('🚨 Erro na correção em lote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na correção em lote: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    correctCompletedWithdrawal,
    correctAllIncompleteWithdrawals
  };
};
