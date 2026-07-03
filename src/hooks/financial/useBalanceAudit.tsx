
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

interface BalanceAuditResult {
  accountId: string;
  accountName: string;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
  transactions: FinancialTransaction[];
  duplicateTransactions: FinancialTransaction[];
  pendingWithdrawals: any[];
  recommendations: string[];
}

export const useBalanceAudit = () => {
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<BalanceAuditResult[]>([]);

  const performFullAudit = async (
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ) => {
    setAuditing(true);
    console.log('🔍 Iniciando auditoria completa dos saldos...');

    try {
      const results: BalanceAuditResult[] = [];

      // Buscar saques pendentes
      const { data: pendingWithdrawals } = await supabase
        .from('pending_withdrawals')
        .select('*');

      for (const account of bankAccounts) {
        console.log(`🔍 Auditando conta: ${account.name}`);
        
        // Filtrar transações da conta
        const accountTransactions = allTransactions.filter(t => 
          t.from_account_id === account.id || t.to_account_id === account.id
        );

        // Identificar duplicatas
        const duplicates = findDuplicateTransactions(accountTransactions);

        // Calcular saldo baseado nas transações (excluindo duplicatas)
        let calculatedBalance = 0;
        const validTransactions = accountTransactions.filter(t => 
          !duplicates.some(dup => dup.id === t.id)
        );

        validTransactions.forEach(transaction => {
          if (transaction.to_account_id === account.id) {
            calculatedBalance += Number(transaction.amount);
          } else if (transaction.from_account_id === account.id) {
            calculatedBalance -= Number(transaction.amount);
          }
        });

        // Saques pendentes relacionados à conta
        const accountPendingWithdrawals = pendingWithdrawals?.filter(pw => 
          pw.from_account_id === account.id || pw.to_account_id === account.id
        ) || [];

        const difference = account.balance - calculatedBalance;

        // Gerar recomendações
        const recommendations = generateRecommendations(
          account,
          difference,
          duplicates,
          accountPendingWithdrawals
        );

        results.push({
          accountId: account.id,
          accountName: account.name,
          currentBalance: account.balance,
          calculatedBalance,
          difference,
          transactions: accountTransactions,
          duplicateTransactions: duplicates,
          pendingWithdrawals: accountPendingWithdrawals,
          recommendations
        });

        console.log(`📊 Resultado da auditoria - ${account.name}:`, {
          saldoAtual: account.balance,
          saldoCalculado: calculatedBalance,
          diferenca: difference,
          duplicatas: duplicates.length,
          saquesPendentes: accountPendingWithdrawals.length
        });
      }

      setAuditResults(results);
      return results;

    } catch (error) {
      console.error('❌ Erro na auditoria:', error);
      toast.error('Erro ao realizar auditoria dos saldos');
      return [];
    } finally {
      setAuditing(false);
    }
  };

  const findDuplicateTransactions = (transactions: FinancialTransaction[]) => {
    const duplicates: FinancialTransaction[] = [];
    const seen = new Map<string, FinancialTransaction[]>();

    transactions.forEach(transaction => {
      // Criar chave baseada em características da transação
      const key = `${transaction.description}-${transaction.amount}-${transaction.type}-${transaction.from_account_id}-${transaction.to_account_id}-${transaction.reference_id}`;
      
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(transaction);
    });

    // Encontrar grupos com mais de uma transação
    seen.forEach(group => {
      if (group.length > 1) {
        // Verificar se são realmente duplicatas (criadas próximas no tempo)
        for (let i = 0; i < group.length - 1; i++) {
          const date1 = new Date(group[i].created_at);
          const date2 = new Date(group[i + 1].created_at);
          const timeDiff = Math.abs(date2.getTime() - date1.getTime());
          
          // Se as transações foram criadas com menos de 5 minutos de diferença
          if (timeDiff < 300000) {
            duplicates.push(...group.slice(1)); // Manter apenas a primeira
            break;
          }
        }
      }
    });

    return duplicates;
  };

  const generateRecommendations = (
    account: BankAccount,
    difference: number,
    duplicates: FinancialTransaction[],
    pendingWithdrawals: any[]
  ) => {
    const recommendations: string[] = [];

    if (duplicates.length > 0) {
      recommendations.push(`Remover ${duplicates.length} transação(ões) duplicada(s)`);
    }

    if (pendingWithdrawals.length > 0) {
      const uncompletedWithdrawals = pendingWithdrawals.filter(pw => !pw.is_completed);
      if (uncompletedWithdrawals.length > 0) {
        recommendations.push(`Verificar ${uncompletedWithdrawals.length} saque(s) pendente(s)`);
      }
    }

    if (Math.abs(difference) > 0.01) {
      recommendations.push(`Ajustar saldo da conta em R$ ${Math.abs(difference).toFixed(2)}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Saldo da conta está correto');
    }

    return recommendations;
  };

  const fixAccountBalance = async (
    accountId: string,
    correctBalance: number,
    duplicateTransactions: FinancialTransaction[]
  ) => {
    console.log(`🔧 Corrigindo saldo da conta ${accountId}`);

    try {
      // Remover transações duplicadas
      for (const duplicate of duplicateTransactions) {
        console.log(`🗑️ Removendo transação duplicada: ${duplicate.id}`);
        
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', duplicate.id);

        if (error) {
          console.error('Erro ao remover duplicata:', error);
          throw error;
        }
      }

      if (duplicateTransactions.length > 0) {
        console.log(`✅ ${duplicateTransactions.length} transação(ões) duplicada(s) removida(s)`);
      }

      // Corrigir saldo da conta
      console.log(`💰 Ajustando saldo para R$ ${correctBalance.toFixed(2)}`);
      
      const { error: balanceError } = await supabase
        .from('bank_accounts')
        .update({ balance: correctBalance })
        .eq('id', accountId);

      if (balanceError) {
        console.error('Erro ao corrigir saldo:', balanceError);
        throw balanceError;
      }

      // Criar transação de ajuste para documentar a correção
      const { error: adjustmentError } = await supabase
        .from('financial_transactions')
        .insert([{
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          description: 'Ajuste de saldo - Correção de auditoria',
          amount: 0, // Valor zero pois é apenas um ajuste de documentação
          type: 'adjustment',
          from_account_id: accountId,
          reference_type: 'balance_correction'
        }]);

      if (adjustmentError) {
        console.warn('Aviso ao criar transação de ajuste:', adjustmentError);
      }

      console.log('✅ Saldo da conta corrigido com sucesso');
      toast.success('Saldo da conta corrigido com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro ao corrigir saldo:', error);
      toast.error('Erro ao corrigir saldo da conta');
      return false;
    }
  };

  const fixAllBalances = async () => {
    console.log('🔧 Iniciando correção de todos os saldos...');
    
    let totalFixed = 0;
    for (const result of auditResults) {
      if (Math.abs(result.difference) > 0.01 || result.duplicateTransactions.length > 0) {
        const success = await fixAccountBalance(
          result.accountId,
          result.calculatedBalance,
          result.duplicateTransactions
        );
        if (success) totalFixed++;
      }
    }

    if (totalFixed > 0) {
      toast.success(`${totalFixed} conta(s) corrigida(s) com sucesso!`);
    } else {
      toast.info('Nenhuma correção necessária');
    }

    return totalFixed;
  };

  return {
    auditing,
    auditResults,
    performFullAudit,
    fixAccountBalance,
    fixAllBalances
  };
};
