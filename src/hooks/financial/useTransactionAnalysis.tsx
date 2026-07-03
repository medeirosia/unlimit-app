
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

interface TransactionAnalysis {
  duplicates: FinancialTransaction[];
  balanceDiscrepancies: {
    accountId: string;
    accountName: string;
    calculatedBalance: number;
    actualBalance: number;
    difference: number;
  }[];
  orphanedTransactions: FinancialTransaction[];
}

export const useTransactionAnalysis = () => {
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTransactions = async (
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ) => {
    setIsAnalyzing(true);
    console.log('🔍 Iniciando análise de transações...');

    try {
      // 1. Buscar duplicatas potenciais
      const duplicates = findDuplicateTransactions(allTransactions);
      console.log('📊 Duplicatas encontradas:', duplicates.length);

      // 2. Calcular saldo esperado para cada conta
      const balanceDiscrepancies = calculateBalanceDiscrepancies(bankAccounts, allTransactions);
      console.log('💰 Discrepâncias de saldo:', balanceDiscrepancies);

      // 3. Buscar transações órfãs (referenciando contas inexistentes)
      const orphanedTransactions = findOrphanedTransactions(allTransactions, bankAccounts);
      console.log('🚨 Transações órfãs:', orphanedTransactions.length);

      const result: TransactionAnalysis = {
        duplicates,
        balanceDiscrepancies,
        orphanedTransactions
      };

      setAnalysis(result);
      return result;
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      toast.error('Erro ao analisar transações');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findDuplicateTransactions = (transactions: FinancialTransaction[]) => {
    const duplicates: FinancialTransaction[] = [];
    const seen = new Map<string, FinancialTransaction[]>();

    transactions.forEach(transaction => {
      // Criar chave baseada em características da transação
      const key = `${transaction.description}-${transaction.amount}-${transaction.type}-${transaction.from_account_id}-${transaction.to_account_id}`;
      
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(transaction);
    });

    // Encontrar grupos com mais de uma transação
    seen.forEach(group => {
      if (group.length > 1) {
        // Verificar se são realmente duplicatas (dentro de um período próximo)
        for (let i = 0; i < group.length - 1; i++) {
          const date1 = new Date(group[i].created_at);
          const date2 = new Date(group[i + 1].created_at);
          const timeDiff = Math.abs(date2.getTime() - date1.getTime());
          
          // Se as transações foram criadas com menos de 1 hora de diferença
          if (timeDiff < 3600000) {
            duplicates.push(...group);
            break;
          }
        }
      }
    });

    return duplicates;
  };

  const calculateBalanceDiscrepancies = (
    accounts: BankAccount[],
    transactions: FinancialTransaction[]
  ) => {
    return accounts.map(account => {
      let calculatedBalance = 0;

      // Calcular saldo baseado nas transações
      transactions.forEach(transaction => {
        if (transaction.to_account_id === account.id) {
          calculatedBalance += Number(transaction.amount);
        } else if (transaction.from_account_id === account.id) {
          calculatedBalance -= Number(transaction.amount);
        }
      });

      const difference = account.balance - calculatedBalance;

      console.log(`📈 Conta ${account.name}:`, {
        saldoAtual: account.balance,
        saldoCalculado: calculatedBalance,
        diferenca: difference
      });

      return {
        accountId: account.id,
        accountName: account.name,
        calculatedBalance,
        actualBalance: account.balance,
        difference
      };
    }).filter(item => Math.abs(item.difference) > 0.01); // Apenas discrepâncias significativas
  };

  const findOrphanedTransactions = (
    transactions: FinancialTransaction[],
    accounts: BankAccount[]
  ) => {
    const accountIds = new Set(accounts.map(acc => acc.id));
    
    return transactions.filter(transaction => {
      const hasInvalidFromAccount = transaction.from_account_id && 
        !accountIds.has(transaction.from_account_id);
      const hasInvalidToAccount = transaction.to_account_id && 
        !accountIds.has(transaction.to_account_id);
      
      return hasInvalidFromAccount || hasInvalidToAccount;
    });
  };

  const fixBalanceDiscrepancy = async (accountId: string, correctBalance: number) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ balance: correctBalance })
        .eq('id', accountId);

      if (error) {
        toast.error('Erro ao corrigir saldo');
        return false;
      }

      toast.success('Saldo corrigido com sucesso');
      return true;
    } catch (error) {
      toast.error('Erro ao corrigir saldo');
      return false;
    }
  };

  return {
    analysis,
    isAnalyzing,
    analyzeTransactions,
    fixBalanceDiscrepancy
  };
};
