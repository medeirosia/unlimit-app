
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOrphanedWithdrawals = () => {
  const checkForOrphanedWithdrawals = useCallback(async () => {
    console.log('🔍 Verificando saques órfãos...');
    
    try {
      // Buscar saques pendentes não completados
      const { data: pendingSaques, error: pendingError } = await supabase
        .from('pending_withdrawals')
        .select('*')
        .eq('is_completed', false);

      if (pendingError) {
        console.error('Erro ao buscar saques pendentes:', pendingError);
        return;
      }

      if (!pendingSaques || pendingSaques.length === 0) {
        console.log('✅ Nenhum saque pendente encontrado');
        return;
      }

      // Para cada saque pendente, verificar se existe uma transação de recebimento correspondente
      for (const saque of pendingSaques) {
        console.log(`🔍 Verificando saque ${saque.id}...`);
        
        const { data: receiptTransaction, error: receiptError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('type', 'receipt')
          .eq('to_account_id', saque.to_account_id)
          .eq('amount', saque.amount)
          .eq('reference_type', 'withdrawal')
          .gte('created_at', saque.created_at)
          .single();

        if (receiptError && receiptError.code !== 'PGRST116') {
          console.error(`Erro ao verificar transação de recebimento para saque ${saque.id}:`, receiptError);
          continue;
        }

        // Se encontrou a transação de recebimento, marcar o saque como completo
        if (receiptTransaction) {
          console.log(`✅ Saque órfão encontrado: ${saque.id}. Marcando como completo...`);
          
          const { error: updateError } = await supabase
            .from('pending_withdrawals')
            .update({ 
              is_completed: true, 
              completed_at: receiptTransaction.created_at 
            })
            .eq('id', saque.id);

          if (updateError) {
            console.error(`Erro ao marcar saque ${saque.id} como completo:`, updateError);
          } else {
            console.log(`✅ Saque ${saque.id} marcado como completo com sucesso`);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar saques órfãos:', error);
    }
  }, []);

  return { checkForOrphanedWithdrawals };
};
