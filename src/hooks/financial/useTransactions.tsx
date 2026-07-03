
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { FinancialTransaction } from '@/types/financial';

export const useTransactions = () => {
  const { user } = useAuth();
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [allFinancialTransactions, setAllFinancialTransactions] = useState<FinancialTransaction[]>([]);

  const fetchFinancialTransactions = async () => {
    console.log('🔄 [useTransactions] Carregando transações financeiras (últimas 50)...');
    const { data, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        from_account:bank_accounts!financial_transactions_from_account_id_fkey(name),
        to_account:bank_accounts!financial_transactions_to_account_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ [useTransactions] Erro ao carregar extrato:', error);
      toast.error('Erro ao carregar extrato');
      return;
    }
    
    console.log('✅ [useTransactions] Transações carregadas (últimas 50):', data?.length);
    
    // 🔍 DEBUG: Log detalhado das transações para investigar datas
    console.log('🔍 [useTransactions] DEBUG - Transações detalhadas:', 
      data?.map(t => ({
        id: t.id,
        description: t.description,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
        type: t.type,
        reference_type: t.reference_type,
        reference_id: t.reference_id
      }))
    );
    
    setFinancialTransactions(data || []);
  };

  const fetchAllFinancialTransactions = async () => {
    console.log('🔄 [useTransactions] Carregando todas as transações financeiras...');
    const { data, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        from_account:bank_accounts!financial_transactions_from_account_id_fkey(name),
        to_account:bank_accounts!financial_transactions_to_account_id_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [useTransactions] Erro ao carregar histórico de transações:', error);
      toast.error('Erro ao carregar histórico de transações');
      return;
    }
    
    console.log('✅ [useTransactions] Todas as transações carregadas:', data?.length);
    
    // 🔍 DEBUG: Log detalhado de todas as transações
    console.log('🔍 [useTransactions] DEBUG - Todas as transações detalhadas:', 
      data?.map(t => ({
        id: t.id,
        description: t.description,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
        type: t.type,
        reference_type: t.reference_type,
        reference_id: t.reference_id,
        amount: t.amount
      }))
    );
    
    setAllFinancialTransactions(data || []);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchFinancialTransactions(),
        fetchAllFinancialTransactions()
      ]);
    }
  }, [user]);

  return {
    financialTransactions,
    allFinancialTransactions,
    fetchFinancialTransactions,
    fetchAllFinancialTransactions
  };
};
