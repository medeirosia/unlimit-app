
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export const useWithdrawalConfirmation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConfirmWithdrawal = async (
    withdrawal: any,
    bankAccounts: BankAccount[],
    onDataChange: () => void,
    onRefresh: () => void
  ) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // VALIDAÇÃO: Verificar se o saque já foi completado
    if (withdrawal.is_completed) {
      console.error('❌ Tentativa de confirmar saque já completado:', withdrawal.id);
      toast.error('Este saque já foi confirmado anteriormente');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Confirmando saque:', withdrawal);

      // 1. MARCAR saque como completado PRIMEIRO (para evitar confirmações duplicadas)
      const { error: completeError } = await supabase
        .from('pending_withdrawals')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id)
        .eq('is_completed', false); // Garantir que só marca se ainda não estiver completo

      if (completeError) {
        console.error('❌ Erro ao marcar saque como completo:', completeError);
        toast.error('Erro ao processar confirmação do saque');
        return;
      }

      // 2. Buscar a transação pendente correspondente usando reference_id
      const { data: pendingTransaction, error: findError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('reference_id', withdrawal.id)
        .eq('reference_type', 'withdrawal')
        .eq('status', 'pending')
        .maybeSingle();

      if (findError) {
        console.error('❌ Erro ao buscar transação pendente:', findError);
        toast.error('Erro ao localizar transação pendente');
        return;
      }

      if (!pendingTransaction) {
        console.warn('⚠️ Transação pendente não encontrada para o saque:', withdrawal.id);
        toast.warning('Transação pendente não encontrada, mas saque foi marcado como completo');
        
        // Recalcular saldos de qualquer forma
        await supabase.rpc('recalculate_bank_account_balance', { 
          account_id: withdrawal.to_account_id 
        });
        
        onDataChange();
        onRefresh();
        return;
      }

      // 3. Atualizar a transação para confirmada e adicionar conta de destino
      const { error: updateError } = await supabase
        .from('financial_transactions')
        .update({
          status: 'confirmed',
          to_account_id: withdrawal.to_account_id,
          description: `Saque confirmado - ${withdrawal.description || 'Saque de plataforma'}`
        })
        .eq('id', pendingTransaction.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar transação:', updateError);
        toast.error('Erro ao confirmar transação');
        return;
      }

      // 4. RECALCULAR saldo da conta de destino (ao invés de crédito manual)
      const { error: recalcError } = await supabase.rpc('recalculate_bank_account_balance', { 
        account_id: withdrawal.to_account_id 
      });

      if (recalcError) {
        console.error('❌ Erro ao recalcular saldo:', recalcError);
        toast.error('Erro ao atualizar saldo da conta');
        return;
      }

      console.log('✅ Saque confirmado com sucesso');
      toast.success('Saque confirmado com sucesso!');
      
      // Atualizar dados
      onDataChange();
      onRefresh();

    } catch (error) {
      console.error('❌ Erro geral ao confirmar saque:', error);
      toast.error('Erro ao confirmar saque');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleConfirmWithdrawal
  };
};
