
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBankAccounts } from './financial/useBankAccounts';
import { useCategories } from './financial/useCategories';
import { useAccounts } from './financial/useAccounts';
import { useTransactions } from './financial/useTransactions';

export const useFinancialData = () => {
  const { user } = useAuth();

  const {
    bankAccounts,
    fetchBankAccounts
  } = useBankAccounts();

  const {
    expenseCategories,
    receivableCategories,
    fetchExpenseCategories,
    fetchReceivableCategories
  } = useCategories();

  const {
    accountsPayable,
    accountsReceivable,
    fetchAccountsPayable,
    fetchAccountsReceivable,
    forceRefresh
  } = useAccounts();

  const {
    financialTransactions,
    allFinancialTransactions,
    fetchFinancialTransactions,
    fetchAllFinancialTransactions
  } = useTransactions();

  const fetchData = async () => {
    console.log('🔄 Carregando dados financeiros...');
    
    try {
      await Promise.all([
        fetchBankAccounts(),
        fetchExpenseCategories(),
        fetchReceivableCategories(),
        fetchAccountsPayable(),
        fetchAccountsReceivable(),
        fetchFinancialTransactions(),
        fetchAllFinancialTransactions()
      ]);
      console.log('✅ Dados financeiros carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
    }
  };

  // Função para forçar refresh completo (incluindo transações)
  const forceCompleteRefresh = async () => {
    console.log('🔄 [useFinancialData] Forçando refresh completo...');
    
    // Forçar refresh das contas a receber se disponível
    if (forceRefresh) {
      await forceRefresh();
    }
    
    // Sempre executar fetchData para garantir que tudo seja atualizado
    await fetchData();
  };

  // Carregar dados quando usuário estiver disponível
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    bankAccounts,
    expenseCategories,
    receivableCategories,
    accountsPayable,
    accountsReceivable,
    financialTransactions,
    allFinancialTransactions,
    fetchData,
    forceRefresh: forceCompleteRefresh
  };
};
