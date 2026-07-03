
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrphanedWithdrawals } from './useOrphanedWithdrawals';

export interface PendingWithdrawal {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  fee_amount: number;
  description: string;
  created_at: string;
  is_completed: boolean;
  completed_at: string | null;
  from_account?: { name: string } | null;
  to_account?: { name: string } | null;
}

export const usePendingWithdrawalsFetch = () => {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const { checkForOrphanedWithdrawals } = useOrphanedWithdrawals();

  const fetchPendingWithdrawals = useCallback(async () => {
    console.log('🔄 Iniciando busca de saques pendentes...');
    setLoading(true);
    
    try {
      // Primeiro, verificar e corrigir saques órfãos
      await checkForOrphanedWithdrawals();
      
      console.log('🔍 Fazendo query para saques pendentes das transações...');
      
      // Buscar saques pendentes das financial_transactions com is_platform_withdrawal = true e status = 'pending'
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('is_platform_withdrawal', true)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📊 Query de transações executada - Dados encontrados:', transactionsData?.length || 0);
      console.log('📊 Dados das transações:', transactionsData);
      console.log('❌ Erro na query de transações:', transactionsError);

      if (transactionsError) {
        console.error('Erro ao carregar saques pendentes:', transactionsError);
        toast.error('Erro ao carregar saques pendentes: ' + transactionsError.message);
        setPendingWithdrawals([]);
        return;
      }

      if (!transactionsData || transactionsData.length === 0) {
        console.log('📋 Nenhum saque pendente encontrado nas transações');
        setPendingWithdrawals([]);
        return;
      }

      // Buscar dados complementares da tabela pending_withdrawals para pegar to_account_id e fee_amount
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_withdrawals')
        .select('*')
        .eq('is_completed', false)
        .in('from_account_id', transactionsData.map(t => t.from_account_id));

      if (pendingError) {
        console.error('Erro ao carregar dados complementares:', pendingError);
      }

      // Buscar todas as contas bancárias para fazer o match
      console.log('🔍 Buscando contas bancárias...');
      const { data: bankAccountsData, error: bankAccountsError } = await supabase
        .from('bank_accounts')
        .select('id, name');

      if (bankAccountsError) {
        console.error('Erro ao carregar contas bancárias:', bankAccountsError);
        toast.error('Erro ao carregar contas bancárias: ' + bankAccountsError.message);
        setPendingWithdrawals([]);
        return;
      }

      console.log('📊 Contas bancárias encontradas:', bankAccountsData?.length || 0);

      // Fazer o match entre transações e dados complementares
      const transformedData: PendingWithdrawal[] = transactionsData.map(transaction => {
        // Encontrar dados complementares na tabela pending_withdrawals
        const pendingInfo = pendingData?.find(p => 
          p.from_account_id === transaction.from_account_id && 
          p.amount === transaction.amount
        );

        const fromAccount = bankAccountsData?.find(acc => acc.id === transaction.from_account_id);
        const toAccount = bankAccountsData?.find(acc => acc.id === (transaction.to_account_id || pendingInfo?.to_account_id));

        return {
          id: pendingInfo?.id || transaction.id,
          from_account_id: transaction.from_account_id,
          to_account_id: transaction.to_account_id || pendingInfo?.to_account_id || '',
          amount: transaction.amount,
          fee_amount: pendingInfo?.fee_amount || 0,
          description: transaction.description,
          created_at: transaction.created_at,
          is_completed: false,
          completed_at: null,
          from_account: fromAccount ? { name: fromAccount.name } : null,
          to_account: toAccount ? { name: toAccount.name } : null,
        };
      });

      console.log('✅ Dados transformados finais:', transformedData);
      setPendingWithdrawals(transformedData);
      
      if (transformedData.length > 0) {
        console.log(`✅ ${transformedData.length} saque(s) pendente(s) carregado(s) com sucesso`);
      }
      
    } catch (error) {
      console.error('Erro geral ao buscar saques:', error);
      toast.error('Erro ao carregar saques pendentes');
      setPendingWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, [checkForOrphanedWithdrawals]);

  return {
    pendingWithdrawals,
    loading,
    fetchPendingWithdrawals
  };
};
