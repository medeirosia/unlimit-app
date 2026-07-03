
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

interface BalanceIssue {
  type: 'duplicate' | 'missing_counterpart' | 'orphaned' | 'date_mismatch' | 'unbalanced_transfer';
  transaction: FinancialTransaction;
  description: string;
  impact: number;
  relatedTransactionId?: string;
}

interface BalanceAnalysisResult {
  accountName: string;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
  issues: BalanceIssue[];
  recommendations: string[];
}

export const useBalanceAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeAccountBalance = async (
    accountName: string,
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ): Promise<BalanceAnalysisResult | null> => {
    setAnalyzing(true);
    console.log(`🔍 Iniciando análise detalhada da conta: ${accountName}`);

    try {
      const account = bankAccounts.find(acc => acc.name === accountName);
      if (!account) {
        console.error(`❌ Conta ${accountName} não encontrada`);
        return null;
      }

      console.log(`📊 Conta encontrada: ${account.name} - Saldo atual: R$ ${account.balance}`);

      // Filtrar transações da conta
      const accountTransactions = allTransactions.filter(t => 
        t.from_account_id === account.id || t.to_account_id === account.id
      );

      console.log(`📋 Total de transações encontradas: ${accountTransactions.length}`);

      // Calcular saldo baseado nas transações
      let calculatedBalance = 0;
      const issues: BalanceIssue[] = [];
      const accountIdSet = new Set(bankAccounts.map(acc => acc.id));

      // Análise de duplicatas
      const duplicateGroups = findDuplicates(accountTransactions);
      duplicateGroups.forEach(group => {
        group.slice(1).forEach(duplicate => {
          const impact = duplicate.to_account_id === account.id ? 
            -Number(duplicate.amount) : Number(duplicate.amount);
          
          issues.push({
            type: 'duplicate',
            transaction: duplicate,
            description: `Transação duplicada: ${duplicate.description}`,
            impact
          });
        });
      });

      // Análise de transferências desbalanceadas
      const transferIssues = analyzeTransferBalance(accountTransactions, bankAccounts, allTransactions);
      issues.push(...transferIssues);

      // Análise de transferências órfãs
      const orphanedIssues = analyzeTransferIntegrity(accountTransactions, bankAccounts);
      issues.push(...orphanedIssues);

      // Análise de discrepâncias de data
      const dateIssues = analyzeDateDiscrepancies(accountTransactions);
      issues.push(...dateIssues);

      // Calcular saldo considerando apenas transações válidas (não duplicadas)
      accountTransactions.forEach(transaction => {
        const isDuplicate = issues.some(issue => 
          issue.type === 'duplicate' && issue.transaction.id === transaction.id
        );
        
        if (!isDuplicate) {
          if (transaction.to_account_id === account.id) {
            calculatedBalance += Number(transaction.amount);
          } else if (transaction.from_account_id === account.id) {
            calculatedBalance -= Number(transaction.amount);
          }
        }
      });

      const difference = account.balance - calculatedBalance;

      console.log(`📈 Análise completa:`, {
        saldoAtual: account.balance,
        saldoCalculado: calculatedBalance,
        diferenca: difference,
        problemasEncontrados: issues.length
      });

      // Gerar recomendações
      const recommendations = generateRecommendations(issues, difference);

      const result: BalanceAnalysisResult = {
        accountName: account.name,
        currentBalance: account.balance,
        calculatedBalance,
        difference,
        issues,
        recommendations
      };

      // Log detalhado dos problemas
      if (issues.length > 0) {
        console.log(`🚨 Problemas identificados na conta ${accountName}:`);
        issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.type}: ${issue.description} (Impacto: R$ ${issue.impact})`);
          console.log(`   Transação ID: ${issue.transaction.id}`);
          console.log(`   Data: ${issue.transaction.transaction_date}`);
          console.log(`   Valor: R$ ${issue.transaction.amount}`);
          if (issue.relatedTransactionId) {
            console.log(`   Transação relacionada: ${issue.relatedTransactionId}`);
          }
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Erro na análise:', error);
      toast.error('Erro ao analisar saldo da conta');
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const findDuplicates = (transactions: FinancialTransaction[]): FinancialTransaction[][] => {
    const groups = new Map<string, FinancialTransaction[]>();
    
    transactions.forEach(transaction => {
      // Criar chave mais específica para detectar duplicatas
      const key = `${transaction.description}-${transaction.amount}-${transaction.type}-${transaction.from_account_id}-${transaction.to_account_id}-${transaction.transaction_date}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(transaction);
    });

    return Array.from(groups.values()).filter(group => group.length > 1);
  };

  const analyzeTransferBalance = (
    accountTransactions: FinancialTransaction[],
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ): BalanceIssue[] => {
    const issues: BalanceIssue[] = [];
    const accountIdSet = new Set(bankAccounts.map(acc => acc.id));

    // Verificar transferências entre contas internas
    const internalTransfers = accountTransactions.filter(t => 
      t.type === 'transfer' && 
      t.from_account_id && 
      t.to_account_id &&
      accountIdSet.has(t.from_account_id) && 
      accountIdSet.has(t.to_account_id)
    );

    console.log(`🔄 Analisando ${internalTransfers.length} transferências internas`);

    internalTransfers.forEach(transfer => {
      // Para cada transferência, procurar a contrapartida
      const counterpart = allTransactions.find(t => 
        t.id !== transfer.id &&
        ((t.from_account_id === transfer.to_account_id && t.to_account_id === transfer.from_account_id) ||
         (t.from_account_id === transfer.from_account_id && t.to_account_id === transfer.to_account_id)) &&
        Number(t.amount) === Number(transfer.amount) &&
        Math.abs(new Date(t.transaction_date).getTime() - new Date(transfer.transaction_date).getTime()) < 86400000 // 24 horas
      );

      if (!counterpart) {
        // Verificar se é uma transferência com taxas
        const withFeeCounterpart = allTransactions.find(t => 
          t.id !== transfer.id &&
          t.from_account_id === transfer.to_account_id &&
          t.to_account_id === transfer.from_account_id &&
          Number(t.amount) !== Number(transfer.amount) &&
          Math.abs(new Date(t.transaction_date).getTime() - new Date(transfer.transaction_date).getTime()) < 86400000
        );

        if (withFeeCounterpart) {
          const difference = Number(transfer.amount) - Number(withFeeCounterpart.amount);
          if (difference > 0) {
            console.log(`💰 Transferência com taxa detectada: R$ ${difference}`);
            issues.push({
              type: 'unbalanced_transfer',
              transaction: transfer,
              description: `Transferência com taxa de R$ ${difference.toFixed(2)}`,
              impact: 0, // Taxa é esperada, não é erro
              relatedTransactionId: withFeeCounterpart.id
            });
          }
        } else {
          // Transferência sem contrapartida - pode causar discrepância
          issues.push({
            type: 'missing_counterpart',
            transaction: transfer,
            description: `Transferência interna sem contrapartida encontrada`,
            impact: transfer.from_account_id === accountTransactions[0]?.from_account_id || 
                   transfer.from_account_id === accountTransactions[0]?.to_account_id ? 
                   -Number(transfer.amount) : Number(transfer.amount)
          });
        }
      }
    });

    return issues;
  };

  const analyzeTransferIntegrity = (
    transactions: FinancialTransaction[], 
    bankAccounts: BankAccount[]
  ): BalanceIssue[] => {
    const issues: BalanceIssue[] = [];
    const accountIds = new Set(bankAccounts.map(acc => acc.id));

    transactions.forEach(transaction => {
      // Verificar contas órfãs
      if (transaction.from_account_id && !accountIds.has(transaction.from_account_id)) {
        issues.push({
          type: 'orphaned',
          transaction,
          description: `Conta de origem não existe: ${transaction.from_account_id}`,
          impact: transaction.type === 'transfer' ? Number(transaction.amount) : 0
        });
      }

      if (transaction.to_account_id && !accountIds.has(transaction.to_account_id)) {
        issues.push({
          type: 'orphaned',
          transaction,
          description: `Conta de destino não existe: ${transaction.to_account_id}`,
          impact: transaction.type === 'transfer' ? -Number(transaction.amount) : 0
        });
      }
    });

    return issues;
  };

  const analyzeDateDiscrepancies = (transactions: FinancialTransaction[]): BalanceIssue[] => {
    const issues: BalanceIssue[] = [];

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.transaction_date);
      const createdDate = new Date(transaction.created_at);
      
      // Verificar discrepâncias grandes entre data da transação e data de criação
      const daysDifference = Math.abs(transactionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDifference > 30) { // Mais de 30 dias de diferença
        issues.push({
          type: 'date_mismatch',
          transaction,
          description: `Grande discrepância entre data da transação (${transaction.transaction_date}) e data de criação (${transaction.created_at})`,
          impact: 0
        });
      }
    });

    return issues;
  };

  const generateRecommendations = (issues: BalanceIssue[], difference: number): string[] => {
    const recommendations: string[] = [];

    const duplicates = issues.filter(i => i.type === 'duplicate');
    if (duplicates.length > 0) {
      recommendations.push(`Remover ${duplicates.length} transação(ões) duplicada(s)`);
    }

    const orphaned = issues.filter(i => i.type === 'orphaned');
    if (orphaned.length > 0) {
      recommendations.push(`Corrigir ${orphaned.length} transação(ões) órfã(s)`);
    }

    const missingCounterparts = issues.filter(i => i.type === 'missing_counterpart');
    if (missingCounterparts.length > 0) {
      recommendations.push(`Verificar ${missingCounterparts.length} transferência(s) sem contrapartida`);
    }

    const unbalancedTransfers = issues.filter(i => i.type === 'unbalanced_transfer');
    if (unbalancedTransfers.length > 0) {
      recommendations.push(`Verificar ${unbalancedTransfers.length} transferência(s) com taxas`);
    }

    if (Math.abs(difference) > 0.01) {
      recommendations.push(`Ajustar saldo da conta em R$ ${Math.abs(difference).toFixed(2)}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Nenhum problema crítico identificado');
    }

    return recommendations;
  };

  const fixBalanceIssues = async (
    analysis: BalanceAnalysisResult,
    bankAccounts: BankAccount[]
  ): Promise<boolean> => {
    console.log(`🔧 Iniciando correção automática para conta ${analysis.accountName}`);
    
    try {
      const account = bankAccounts.find(acc => acc.name === analysis.accountName);
      if (!account) return false;

      // Remover duplicatas
      const duplicates = analysis.issues.filter(i => i.type === 'duplicate');
      for (const duplicate of duplicates) {
        console.log(`🗑️ Removendo transação duplicada: ${duplicate.transaction.id}`);
        
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', duplicate.transaction.id);

        if (error) {
          console.error('Erro ao remover duplicata:', error);
          toast.error(`Erro ao remover transação duplicada: ${duplicate.transaction.description}`);
          return false;
        }
      }

      // Corrigir saldo da conta
      if (Math.abs(analysis.difference) > 0.01) {
        console.log(`💰 Corrigindo saldo da conta de R$ ${analysis.currentBalance} para R$ ${analysis.calculatedBalance}`);
        
        const { error } = await supabase
          .from('bank_accounts')
          .update({ balance: analysis.calculatedBalance })
          .eq('id', account.id);

        if (error) {
          console.error('Erro ao corrigir saldo:', error);
          toast.error('Erro ao corrigir saldo da conta');
          return false;
        }
      }

      console.log('✅ Correções aplicadas com sucesso');
      toast.success(`Conta ${analysis.accountName} corrigida com sucesso!`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao aplicar correções:', error);
      toast.error('Erro ao aplicar correções');
      return false;
    }
  };

  return {
    analyzing,
    analyzeAccountBalance,
    fixBalanceIssues
  };
};
