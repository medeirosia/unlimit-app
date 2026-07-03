
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const performRollback = async (
  accountId: string, 
  originalBalance: number, 
  withdrawalId?: string, 
  expenseId?: string,
  debitTransactionId?: string
) => {
  console.log('🔄 Iniciando rollback completo...');
  console.log('📋 Dados do rollback:', {
    accountId,
    originalBalance,
    withdrawalId,
    expenseId,
    debitTransactionId
  });
  
  try {
    // Remover transações relacionadas ao saque (se existirem)
    if (withdrawalId) {
      console.log('🗑️ Removendo transações relacionadas ao saque...');
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('reference_id', withdrawalId)
        .eq('reference_type', 'withdrawal');

      if (transactionError) {
        console.error('⚠️ Erro ao remover transações relacionadas:', transactionError);
      } else {
        console.log('✅ Transações relacionadas removidas');
      }
    }

    // Remover transação de débito específica (se foi criada)
    if (debitTransactionId) {
      console.log('🗑️ Removendo transação de débito específica...');
      const { error: debitError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', debitTransactionId);

      if (debitError) {
        console.error('⚠️ Erro ao remover transação de débito:', debitError);
      } else {
        console.log('✅ Transação de débito removida');
      }
    }

    // Remover despesa (se foi criada)
    if (expenseId) {
      console.log('🗑️ Removendo despesa da taxa...');
      const { error: expenseError } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', expenseId);

      if (expenseError) {
        console.error('⚠️ Erro ao remover despesa:', expenseError);
      } else {
        console.log('✅ Despesa removida');
      }
    }

    // Remover saque pendente (se foi criado)
    if (withdrawalId) {
      console.log('🗑️ Removendo saque pendente...');
      const { error: withdrawalError } = await supabase
        .from('pending_withdrawals')
        .delete()
        .eq('id', withdrawalId);

      if (withdrawalError) {
        console.error('⚠️ Erro ao remover saque pendente:', withdrawalError);
      } else {
        console.log('✅ Saque pendente removido');
      }
    }

    // Restaurar saldo da conta
    console.log(`💰 Restaurando saldo da conta para R$ ${originalBalance}`);
    const { error: balanceError } = await supabase
      .from('bank_accounts')
      .update({ balance: originalBalance })
      .eq('id', accountId);

    if (balanceError) {
      console.error('❌ ERRO CRÍTICO ao restaurar saldo:', balanceError);
      toast.error('Erro crítico ao restaurar saldo. Contate o suporte imediatamente.');
      throw balanceError;
    }

    console.log('✅ Saldo restaurado com sucesso');
    console.log('✅ Rollback completo realizado com sucesso');

  } catch (rollbackError) {
    console.error('🚨 ERRO CRÍTICO NO ROLLBACK:', rollbackError);
    toast.error('Erro crítico no sistema. Contate o suporte imediatamente.');
    throw rollbackError;
  }
};
