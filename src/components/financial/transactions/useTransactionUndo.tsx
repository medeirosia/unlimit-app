
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  from_account_id: string | null;
  to_account_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  transaction_date: string;
  created_at: string;
  status?: string;
  is_platform_withdrawal?: boolean;
  from_account?: { name: string };
  to_account?: { name: string };
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export const useTransactionUndo = (
  financialTransactions: FinancialTransaction[],
  bankAccounts: BankAccount[],
  onDataChange: () => void
) => {
  const undoTransaction = async (transactionId: string) => {
    const transaction = financialTransactions.find(t => t.id === transactionId);
    if (!transaction) {
      console.error('❌ Transação não encontrada para desfazer');
      return;
    }

    console.log('🔄 Iniciando processo de desfazer transação:', {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      from_account_id: transaction.from_account_id,
      to_account_id: transaction.to_account_id,
      reference_type: transaction.reference_type,
      reference_id: transaction.reference_id,
      status: transaction.status,
      is_platform_withdrawal: transaction.is_platform_withdrawal
    });

    try {
      // 🚨 CORREÇÃO CRÍTICA: Verificar se é um saque de plataforma
      if (transaction.type === 'withdrawal' && transaction.is_platform_withdrawal) {
        console.log('🚨 DESFAZENDO SAQUE DE PLATAFORMA PENDENTE...');
        
        // Buscar dados adicionais do saque (taxa)
        const { data: pendingWithdrawal } = await supabase
          .from('pending_withdrawals')
          .select('fee_amount, to_account_id')
          .eq('from_account_id', transaction.from_account_id)
          .eq('amount', transaction.amount)
          .eq('is_completed', false)
          .single();

        const feeAmount = pendingWithdrawal?.fee_amount || 0;
        const totalAmountToRestore = transaction.amount + feeAmount;

        console.log('💰 Valores do saque de plataforma:', {
          valorSaque: transaction.amount,
          taxa: feeAmount,
          totalParaRestaurar: totalAmountToRestore
        });

        // 1. RESTAURAR saldo na conta de origem (valor + taxa)
        if (transaction.from_account_id) {
          const fromAccount = bankAccounts.find(acc => acc.id === transaction.from_account_id);
          if (fromAccount) {
            console.log(`💰 RESTAURANDO R$ ${totalAmountToRestore} para ${fromAccount.name} (de R$ ${fromAccount.balance} para R$ ${fromAccount.balance + totalAmountToRestore})`);
            
            const { error: balanceError } = await supabase
              .from('bank_accounts')
              .update({ balance: fromAccount.balance + totalAmountToRestore })
              .eq('id', transaction.from_account_id);

            if (balanceError) {
              console.error('❌ ERRO CRÍTICO ao restaurar saldo:', balanceError);
              throw balanceError;
            }
            
            console.log('✅ Saldo restaurado com sucesso');
          }
        }

        // 2. Remover despesas da taxa (se houver)
        if (feeAmount > 0) {
          console.log('🗑️ Removendo despesas da taxa...');
          const { error: feeError } = await supabase
            .from('accounts_payable')
            .delete()
            .like('description', `Tarifa de saque%`)
            .eq('amount', feeAmount)
            .eq('bank_account_id', transaction.from_account_id);

          if (feeError) {
            console.error('⚠️ Aviso ao remover despesas da taxa:', feeError);
          } else {
            console.log('✅ Despesas da taxa removidas');
          }
        }

        // 3. Remover saque pendente
        const { error: pendingError } = await supabase
          .from('pending_withdrawals')
          .delete()
          .eq('from_account_id', transaction.from_account_id)
          .eq('amount', transaction.amount)
          .eq('is_completed', false);

        if (pendingError) {
          console.error('⚠️ Aviso ao remover saque pendente:', pendingError);
        } else {
          console.log('✅ Saque pendente removido');
        }

        // 4. Remover a transação
        const { error: deleteError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', transactionId);

        if (deleteError) {
          console.error('❌ Erro ao remover transação:', deleteError);
          throw deleteError;
        }

        console.log('✅ SAQUE DE PLATAFORMA DESFEITO COM SUCESSO - Saldo restaurado');
        toast.success(`Saque de plataforma desfeito - R$ ${totalAmountToRestore.toFixed(2)} restaurado`);
        onDataChange();
        return;
      }

      // Verificar se é um saque confirmado (transferência com reference_type = 'withdrawal') 
      if (transaction.type === 'transfer' && transaction.reference_type === 'withdrawal' && transaction.reference_id) {
        console.log('🔄 Desfazendo saque confirmado...');
        
        // Verificar se o saque foi confirmado
        const { data: withdrawal } = await supabase
          .from('pending_withdrawals')
          .select('is_completed')
          .eq('id', transaction.reference_id)
          .single();

        if (withdrawal?.is_completed) {
          // Saque foi confirmado - remover valor da conta de destino e marcar como não completado
          if (transaction.to_account_id) {
            const toAccount = bankAccounts.find(acc => acc.id === transaction.to_account_id);
            if (toAccount) {
              console.log(`💰 Removendo R$ ${transaction.amount} da conta ${toAccount.name} (saldo atual: R$ ${toAccount.balance})`);
              
              const { error: balanceError } = await supabase
                .from('bank_accounts')
                .update({ balance: toAccount.balance - transaction.amount })
                .eq('id', transaction.to_account_id);

              if (balanceError) {
                console.error('❌ Erro ao atualizar saldo da conta de destino:', balanceError);
                throw balanceError;
              }
            }
          }

          // Marcar saque como não completado (volta para pendente)
          const { error: withdrawalError } = await supabase
            .from('pending_withdrawals')
            .update({ 
              is_completed: false,
              completed_at: null 
            })
            .eq('id', transaction.reference_id);

          if (withdrawalError) {
            console.error('❌ Erro ao marcar saque como pendente:', withdrawalError);
            throw withdrawalError;
          }

          console.log('✅ Saque voltou para pendente');
          toast.success('Saque voltou para pendente');
        }

        // Remover a transação
        const { error: deleteError } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', transactionId);

        if (deleteError) {
          console.error('❌ Erro ao remover transação de saque:', deleteError);
          throw deleteError;
        }

        onDataChange();
        return;
      }

      // Lógica para transferências normais entre contas
      if (transaction.type === 'transfer') {
        console.log('🔄 Desfazendo transferência...');
        
        if (transaction.from_account_id && transaction.to_account_id) {
          const fromAccount = bankAccounts.find(acc => acc.id === transaction.from_account_id);
          const toAccount = bankAccounts.find(acc => acc.id === transaction.to_account_id);

          if (fromAccount && toAccount) {
            console.log(`💰 Revertendo transferência:`);
            console.log(`  - Devolvendo R$ ${transaction.amount} para ${fromAccount.name} (de R$ ${fromAccount.balance} para R$ ${fromAccount.balance + transaction.amount})`);
            console.log(`  - Removendo R$ ${transaction.amount} de ${toAccount.name} (de R$ ${toAccount.balance} para R$ ${toAccount.balance - transaction.amount})`);

            // Devolver valor para conta de origem
            const { error: fromError } = await supabase
              .from('bank_accounts')
              .update({ balance: fromAccount.balance + transaction.amount })
              .eq('id', transaction.from_account_id);

            if (fromError) {
              console.error('❌ Erro ao devolver valor à conta de origem:', fromError);
              throw fromError;
            }

            // Remover valor da conta de destino
            const { error: toError } = await supabase
              .from('bank_accounts')
              .update({ balance: toAccount.balance - transaction.amount })
              .eq('id', transaction.to_account_id);

            if (toError) {
              console.error('❌ Erro ao remover valor da conta de destino:', toError);
              throw toError;
            }
          }
        }
      } 
      // Lógica para pagamentos (contas a pagar)
      else if (transaction.type === 'payment' && transaction.reference_id) {
        console.log('🔄 Desfazendo pagamento...');
        
        // Marcar conta a pagar como não paga
        const { error: payableError } = await supabase
          .from('accounts_payable')
          .update({
            is_paid: false,
            paid_date: null
          })
          .eq('id', transaction.reference_id);

        if (payableError) {
          console.error('❌ Erro ao marcar conta como não paga:', payableError);
          throw payableError;
        }

        console.log('✅ Conta a pagar marcada como não paga');
      }
      // Lógica para recebimentos (contas a receber)
      else if (transaction.type === 'receipt' && transaction.reference_id) {
        console.log('🔄 Desfazendo recebimento...');
        
        // Marcar conta a receber como não recebida
        const { error: receivableError } = await supabase
          .from('accounts_receivable')
          .update({
            is_received: false,
            received_date: null
          })
          .eq('id', transaction.reference_id);

        if (receivableError) {
          console.error('❌ Erro ao marcar conta como não recebida:', receivableError);
          throw receivableError;
        }

        console.log('✅ Conta a receber marcada como não recebida');
      }

      // Remover a transação do banco de dados
      const { error: deleteError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (deleteError) {
        console.error('❌ Erro ao remover transação:', deleteError);
        throw deleteError;
      }

      // Recalcular saldos das contas envolvidas
      if (transaction.from_account_id) {
        await supabase.rpc('recalculate_bank_account_balance', { account_id: transaction.from_account_id });
      }
      if (transaction.to_account_id) {
        await supabase.rpc('recalculate_bank_account_balance', { account_id: transaction.to_account_id });
      }

      console.log('✅ Transação desfeita com sucesso');
      toast.success('Transação desfeita com sucesso');
      onDataChange();

    } catch (error) {
      console.error('❌ Erro ao desfazer transação:', error);
      toast.error('Erro ao desfazer transação');
    }
  };

  return { undoTransaction };
};
