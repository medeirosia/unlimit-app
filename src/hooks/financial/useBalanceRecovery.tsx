
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

export const useBalanceRecovery = () => {
  const [loading, setLoading] = useState(false);

  const restoreBalance = async (
    accountId: string,
    amount: number,
    description: string,
    onDataChange: () => void
  ) => {
    try {
      setLoading(true);
      console.log('🚨 Restauração de emergência de saldo:', { accountId, amount, description });

      // Buscar conta atual
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError || !account) {
        toast.error('Conta não encontrada');
        return;
      }

      // Calcular novo saldo
      const newBalance = account.balance + amount;
      console.log('💰 Saldo atual:', account.balance, 'Valor a restaurar:', amount, 'Novo saldo:', newBalance);

      // Atualizar saldo
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (updateError) {
        console.error('❌ Erro ao restaurar saldo:', updateError);
        throw new Error(`Erro ao restaurar saldo: ${updateError.message}`);
      }

      // Criar transação de ajuste para histórico
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          type: 'adjustment',
          description: `Ajuste de saldo: ${description}`,
          amount: amount,
          to_account_id: accountId,
          transaction_date: new Date().toISOString(),
          user_id: account.user_id
        });

      if (transactionError) {
        console.error('⚠️ Erro ao criar transação de ajuste:', transactionError);
        // Não bloquear o processo se não conseguir criar o histórico
      }

      console.log('✅ Saldo restaurado com sucesso');
      toast.success(`Saldo restaurado: R$ ${amount.toFixed(2)} adicionado à conta ${account.name}`);
      
      onDataChange();

    } catch (error) {
      console.error('🚨 ERRO na restauração de saldo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na restauração: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    restoreBalance
  };
};
