
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const useAccounts = () => {
  const { user } = useAuth();
  const [accountsPayable, setAccountsPayable] = useState<any[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([]);

  const fetchAllPagesPayable = async () => {
    const pageSize = 1000;
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*, expense_categories(name), bank_accounts(name)')
        .order('due_date', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      allData = [...allData, ...(data || [])];
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }
    return allData;
  };

  const fetchAllPagesReceivable = async () => {
    const pageSize = 1000;
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*, receivable_categories(name), bank_accounts(name)')
        .order('due_date', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      allData = [...allData, ...(data || [])];
      hasMore = (data?.length || 0) === pageSize;
      from += pageSize;
    }
    return allData;
  };

  const fetchAccountsPayable = async () => {
    console.log('🔄 [useAccounts] Carregando contas a pagar...');
    try {
      const data = await fetchAllPagesPayable();
      console.log('✅ [useAccounts] Contas a pagar carregadas:', data.length);
      setAccountsPayable(data);
    } catch (error) {
      console.error('❌ [useAccounts] Erro ao carregar contas a pagar:', error);
      toast.error('Erro ao carregar contas a pagar');
    }
  };

  const fetchAccountsReceivable = async () => {
    console.log('🔄 [useAccounts] Carregando contas a receber...');
    try {
      const data = await fetchAllPagesReceivable();
      console.log('✅ [useAccounts] Contas a receber carregadas:', data.length);
      setAccountsReceivable(data);
    } catch (error) {
      console.error('❌ [useAccounts] Erro ao carregar contas a receber:', error);
      toast.error('Erro ao carregar contas a receber');
    }
  };

  // Função para forçar refresh das contas
  const forceRefresh = async () => {
    console.log('🔄 [useAccounts] Forçando refresh das contas...');
    await Promise.all([
      fetchAccountsPayable(),
      fetchAccountsReceivable()
    ]);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAccountsPayable(),
        fetchAccountsReceivable()
      ]);
    }
  }, [user]);

  return {
    accountsPayable,
    accountsReceivable,
    fetchAccountsPayable,
    fetchAccountsReceivable,
    forceRefresh
  };
};
