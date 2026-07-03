
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

interface TransferIssue {
  id: string;
  type: 'incomplete' | 'orphaned' | 'date_mismatch' | 'duplicate';
  description: string;
  transaction: FinancialTransaction;
  relatedTransaction?: FinancialTransaction;
  impact: number;
  suggestion: string;
}

interface TransferValidationResult {
  totalTransfers: number;
  validTransfers: number;
  issues: TransferIssue[];
  accountsAffected: string[];
  recommendations: string[];
}

export const useTransferValidation = () => {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<TransferValidationResult | null>(null);

  const validateTransfers = async (
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ): Promise<TransferValidationResult> => {
    setValidating(true);
    console.log('🔍 Iniciando validação de transferências internas...');

    try {
      // Filtrar apenas transferências
      const transfers = allTransactions.filter(t => t.type === 'transfer');
      console.log(`📊 Total de transferências encontradas: ${transfers.length}`);

      const issues: TransferIssue[] = [];
      const accountsAffected = new Set<string>();
      const accountIdMap = new Map(bankAccounts.map(acc => [acc.id, acc.name]));

      // 1. Verificar transferências com dados incompletos
      console.log('🔍 Verificando transferências incompletas...');
      transfers.forEach(transfer => {
        if (transfer.from_account_id && !transfer.to_account_id) {
          issues.push({
            id: `incomplete-${transfer.id}`,
            type: 'incomplete',
            description: `Transferência sem conta de destino`,
            transaction: transfer,
            impact: Number(transfer.amount),
            suggestion: 'Definir conta de destino ou converter para outro tipo de transação'
          });
          accountsAffected.add(transfer.from_account_id);
        }

        if (!transfer.from_account_id && transfer.to_account_id) {
          issues.push({
            id: `incomplete-${transfer.id}`,
            type: 'incomplete',
            description: `Transferência sem conta de origem`,
            transaction: transfer,
            impact: -Number(transfer.amount),
            suggestion: 'Definir conta de origem ou converter para outro tipo de transação'
          });
          accountsAffected.add(transfer.to_account_id);
        }

        if (!transfer.from_account_id && !transfer.to_account_id) {
          issues.push({
            id: `incomplete-${transfer.id}`,
            type: 'incomplete',
            description: `Transferência sem contas de origem e destino`,
            transaction: transfer,
            impact: 0,
            suggestion: 'Remover ou corrigir esta transação'
          });
        }
      });

      // 2. Verificar transferências órfãs (contas inexistentes)
      console.log('🔍 Verificando transferências órfãs...');
      transfers.forEach(transfer => {
        if (transfer.from_account_id && !accountIdMap.has(transfer.from_account_id)) {
          issues.push({
            id: `orphaned-${transfer.id}`,
            type: 'orphaned',
            description: `Conta de origem não existe: ${transfer.from_account_id}`,
            transaction: transfer,
            impact: Number(transfer.amount),
            suggestion: 'Criar conta bancária ou corrigir ID da conta'
          });
        }

        if (transfer.to_account_id && !accountIdMap.has(transfer.to_account_id)) {
          issues.push({
            id: `orphaned-${transfer.id}`,
            type: 'orphaned',
            description: `Conta de destino não existe: ${transfer.to_account_id}`,
            transaction: transfer,
            impact: -Number(transfer.amount),
            suggestion: 'Criar conta bancária ou corrigir ID da conta'
          });
        }
      });

      // 3. Verificar transferências duplicadas
      console.log('🔍 Verificando transferências duplicadas...');
      const transferGroups = new Map<string, FinancialTransaction[]>();
      
      transfers.forEach(transfer => {
        const key = `${transfer.from_account_id}-${transfer.to_account_id}-${transfer.amount}-${transfer.description}`;
        if (!transferGroups.has(key)) {
          transferGroups.set(key, []);
        }
        transferGroups.get(key)!.push(transfer);
      });

      transferGroups.forEach(group => {
        if (group.length > 1) {
          // Verificar se são duplicatas por data próxima
          for (let i = 0; i < group.length - 1; i++) {
            const transfer1 = group[i];
            const transfer2 = group[i + 1];
            const date1 = new Date(transfer1.transaction_date);
            const date2 = new Date(transfer2.transaction_date);
            const timeDiff = Math.abs(date2.getTime() - date1.getTime());
            
            // Se foram criadas com menos de 24 horas de diferença
            if (timeDiff < 86400000) {
              issues.push({
                id: `duplicate-${transfer2.id}`,
                type: 'duplicate',
                description: `Transferência duplicada`,
                transaction: transfer2,
                relatedTransaction: transfer1,
                impact: Number(transfer2.amount),
                suggestion: 'Remover transferência duplicada'
              });
              
              if (transfer1.from_account_id) accountsAffected.add(transfer1.from_account_id);
              if (transfer1.to_account_id) accountsAffected.add(transfer1.to_account_id);
            }
          }
        }
      });

      // 4. Verificar discrepâncias de data (transferências em meses diferentes)
      console.log('🔍 Verificando discrepâncias de data...');
      const monthlyTransfers = new Map<string, FinancialTransaction[]>();
      
      transfers.forEach(transfer => {
        const month = new Date(transfer.transaction_date).toISOString().substring(0, 7);
        const key = `${transfer.from_account_id}-${transfer.to_account_id}-${transfer.amount}`;
        
        if (!monthlyTransfers.has(key)) {
          monthlyTransfers.set(key, []);
        }
        monthlyTransfers.get(key)!.push(transfer);
      });

      monthlyTransfers.forEach(group => {
        if (group.length > 1) {
          const months = new Set(group.map(t => new Date(t.transaction_date).toISOString().substring(0, 7)));
          if (months.size > 1) {
            group.forEach(transfer => {
              issues.push({
                id: `date-mismatch-${transfer.id}`,
                type: 'date_mismatch',
                description: `Transferência com data inconsistente - mesmo valor em meses diferentes`,
                transaction: transfer,
                impact: 0,
                suggestion: 'Verificar se são transferências distintas ou corrigir data'
              });
              
              if (transfer.from_account_id) accountsAffected.add(transfer.from_account_id);
              if (transfer.to_account_id) accountsAffected.add(transfer.to_account_id);
            });
          }
        }
      });

      // 5. Foco especial em contas críticas
      const criticalAccounts = ['Pagar.me', 'Hotmart', 'Conta Simples'];
      const criticalAccountIds = bankAccounts
        .filter(acc => criticalAccounts.some(name => acc.name.includes(name)))
        .map(acc => acc.id);

      console.log(`🎯 Contas críticas identificadas: ${criticalAccountIds.length}`);
      
      // Gerar recomendações
      const recommendations: string[] = [];
      
      if (issues.length === 0) {
        recommendations.push('✅ Todas as transferências estão corretas');
      } else {
        const incompleteIssues = issues.filter(i => i.type === 'incomplete');
        const orphanedIssues = issues.filter(i => i.type === 'orphaned');
        const duplicateIssues = issues.filter(i => i.type === 'duplicate');
        const dateMismatchIssues = issues.filter(i => i.type === 'date_mismatch');

        if (incompleteIssues.length > 0) {
          recommendations.push(`🔧 Corrigir ${incompleteIssues.length} transferência(s) incompleta(s)`);
        }
        if (orphanedIssues.length > 0) {
          recommendations.push(`🗑️ Corrigir ${orphanedIssues.length} transferência(s) órfã(s)`);
        }
        if (duplicateIssues.length > 0) {
          recommendations.push(`❌ Remover ${duplicateIssues.length} transferência(s) duplicada(s)`);
        }
        if (dateMismatchIssues.length > 0) {
          recommendations.push(`📅 Verificar ${dateMismatchIssues.length} transferência(s) com data inconsistente`);
        }
      }

      const result: TransferValidationResult = {
        totalTransfers: transfers.length,
        validTransfers: transfers.length - issues.length,
        issues,
        accountsAffected: Array.from(accountsAffected).map(id => accountIdMap.get(id) || id),
        recommendations
      };

      console.log('📋 Resultado da validação:', {
        totalTransfers: result.totalTransfers,
        validTransfers: result.validTransfers,
        issues: result.issues.length,
        accountsAffected: result.accountsAffected.length
      });

      setValidationResult(result);
      return result;

    } catch (error) {
      console.error('❌ Erro na validação:', error);
      toast.error('Erro ao validar transferências');
      throw error;
    } finally {
      setValidating(false);
    }
  };

  const fixTransferIssues = async (issues: TransferIssue[]): Promise<boolean> => {
    console.log('🔧 Iniciando correção automática de transferências...');
    
    try {
      // Remover duplicatas
      const duplicates = issues.filter(i => i.type === 'duplicate');
      for (const duplicate of duplicates) {
        console.log(`🗑️ Removendo transferência duplicada: ${duplicate.transaction.id}`);
        
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', duplicate.transaction.id);

        if (error) {
          console.error('Erro ao remover duplicata:', error);
          toast.error(`Erro ao remover transferência duplicada`);
          return false;
        }
      }

      // Remover transferências órfãs incompletas
      const orphaned = issues.filter(i => i.type === 'orphaned');
      for (const orphan of orphaned) {
        console.log(`🗑️ Removendo transferência órfã: ${orphan.transaction.id}`);
        
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', orphan.transaction.id);

        if (error) {
          console.error('Erro ao remover órfã:', error);
          toast.error(`Erro ao remover transferência órfã`);
          return false;
        }
      }

      console.log('✅ Correções aplicadas com sucesso');
      toast.success(`${duplicates.length + orphaned.length} transferências problemáticas foram corrigidas!`);
      
      return true;

    } catch (error) {
      console.error('❌ Erro ao aplicar correções:', error);
      toast.error('Erro ao aplicar correções');
      return false;
    }
  };

  return {
    validating,
    validationResult,
    validateTransfers,
    fixTransferIssues
  };
};
