
import { useState, useEffect } from 'react';
import { Transaction } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

export const useTransactionManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  const loadTransactions = async () => {
    try {
      console.log('Carregando lançamentos (paginado)...');

      const pageSize = 1000;
      let from = 0;
      const all: any[] = [];

      // Paginação para contornar o limite padrão de 1000 linhas do Supabase
      // e garantir que TODOS os lançamentos históricos sejam carregados.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase
          .from('lancamentos')
          .select('*')
          .order('criado_em', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error('Erro ao carregar lançamentos:', error);
          break;
        }
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      console.log(`Lançamentos carregados do Supabase: ${all.length}`);

      const formattedTransactions: Transaction[] = all.map(l => ({
        id: l.id,
        project: l.categoria,
        type: l.tipo as 'revenue' | 'investment' | 'low-ticket-revenue',
        amount: Number(l.valor),
        date: l.data_lancamento,
        description: l.descricao || '',
        createdAt: l.criado_em
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      console.log('Adicionando transação:', transaction);
      console.log('Data da transação sendo salva:', transaction.date);
      
      const { data, error } = await supabase
        .from('lancamentos')
        .insert({
          descricao: transaction.description,
          tipo: transaction.type,
          valor: transaction.amount,
          categoria: transaction.project,
          data_lancamento: transaction.date
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar lançamento:', error);
        return;
      }

      console.log('Transação salva no Supabase:', data);
      console.log('Data salva no banco:', data.data_lancamento);

      const newTransaction: Transaction = {
        id: data.id,
        project: data.categoria,
        type: data.tipo as 'revenue' | 'investment' | 'low-ticket-revenue',
        amount: Number(data.valor),
        date: data.data_lancamento,
        description: data.descricao || '',
        createdAt: data.criado_em
      };
      
      console.log('Nova transação formatada:', newTransaction);
      console.log('Data na transação formatada:', newTransaction.date);
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      console.log('Nova transação adicionada ao estado local:', newTransaction);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const undoTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setPendingTransactions(prev => [...prev, transaction]);
    }
  };

  const editPendingTransaction = (transactionId: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setPendingTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...updatedTransaction, id: transactionId } : t)
    );
  };

  const deletePendingTransaction = async (transactionId: string) => {
    try {
      console.log('Deletando transação do Supabase:', transactionId);
      
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', transactionId);

      if (error) {
        console.error('Erro ao deletar lançamento do Supabase:', error);
        return;
      }

      console.log('Transação deletada com sucesso do Supabase');
      
      setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
    }
  };

  const restorePendingTransaction = (transactionId: string) => {
    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (transaction) {
      setPendingTransactions(prev => prev.filter(t => t.id !== transactionId));
      setTransactions(prev => [...prev, transaction]);
    }
  };

  return {
    transactions,
    pendingTransactions,
    addTransaction,
    undoTransaction,
    editPendingTransaction,
    deletePendingTransaction,
    restorePendingTransaction,
  };
};
