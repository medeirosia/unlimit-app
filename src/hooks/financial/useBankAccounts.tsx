import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { BankAccount } from '@/types/financial';

export const useBankAccounts = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        toast.error('Erro ao carregar contas bancárias');
        console.error('Error fetching bank accounts:', error);
        return;
      }

      setBankAccounts(data || []);
    } catch (error) {
      toast.error('Erro ao carregar contas bancárias');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBankAccount = async (accountData: {
    name: string;
    initial_balance: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([
          {
            name: accountData.name,
            initial_balance: accountData.initial_balance,
            balance: 0, // Será recalculado pela função
            category: 'geral', // Categoria padrão
            user_id: user?.id
          }
        ])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar conta bancária');
        console.error('Error creating bank account:', error);
        return null;
      }

      // Recalcular saldo da nova conta
      await supabase.rpc('recalculate_bank_account_balance', {
        account_id: data.id
      });

      toast.success('Conta bancária criada com sucesso!');
      await fetchBankAccounts();
      return data;
    } catch (error) {
      toast.error('Erro ao criar conta bancária');
      console.error('Error:', error);
      return null;
    }
  };

  const updateBankAccount = async (id: string, updates: {
    name?: string;
    initial_balance?: number;
    category?: string;
  }) => {
    try {
      console.log('Updating bank account with:', { id, updates });
      
      const { error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar conta bancária');
        console.error('Error updating bank account:', error);
        return false;
      }

      // Sempre recalcular saldo após atualização
      await supabase.rpc('recalculate_bank_account_balance', {
        account_id: id
      });

      toast.success('Conta bancária atualizada com sucesso!');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      toast.error('Erro ao atualizar conta bancária');
      console.error('Error:', error);
      return false;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao excluir conta bancária');
        console.error('Error deleting bank account:', error);
        return false;
      }

      toast.success('Conta bancária excluída com sucesso!');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      toast.error('Erro ao excluir conta bancária');
      console.error('Error:', error);
      return false;
    }
  };

  const archiveBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ active: false })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao arquivar conta bancária');
        console.error('Error archiving bank account:', error);
        return false;
      }

      toast.success('Conta bancária arquivada com sucesso!');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      toast.error('Erro ao arquivar conta bancária');
      console.error('Error:', error);
      return false;
    }
  };

  const syncBankAccounts = async () => {
    try {
      // Primeiro, executar sincronização das contas
      const { error: syncError } = await supabase.rpc('sync_bank_accounts_from_transactions');

      if (syncError) {
        toast.error('Erro ao sincronizar contas bancárias');
        console.error('Error syncing bank accounts:', syncError);
        return false;
      }

      // Depois, recalcular todos os saldos com a nova lógica
      const { error: recalcError } = await supabase.rpc('recalculate_all_bank_balances');

      if (recalcError) {
        toast.error('Erro ao recalcular saldos');
        console.error('Error recalculating balances:', recalcError);
        return false;
      }

      toast.success('Contas bancárias sincronizadas e saldos recalculados com sucesso!');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      toast.error('Erro ao sincronizar contas bancárias');
      console.error('Error:', error);
      return false;
    }
  };

  const recalculateAllBalances = async () => {
    try {
      const { error } = await supabase.rpc('recalculate_all_bank_balances');

      if (error) {
        toast.error('Erro ao recalcular saldos');
        console.error('Error recalculating balances:', error);
        return false;
      }

      toast.success('Saldos recalculados com sucesso!');
      await fetchBankAccounts();
      return true;
    } catch (error) {
      toast.error('Erro ao recalcular saldos');
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBankAccounts();
    }
  }, [user]);

  return {
    bankAccounts,
    loading,
    fetchBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    archiveBankAccount,
    syncBankAccounts,
    recalculateAllBalances
  };
};
