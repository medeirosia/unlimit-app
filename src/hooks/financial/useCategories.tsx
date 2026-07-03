
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { ExpenseCategory, ReceivableCategory } from '@/types/financial';

export const useCategories = () => {
  const { user } = useAuth();
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [receivableCategories, setReceivableCategories] = useState<ReceivableCategory[]>([]);

  const fetchExpenseCategories = async () => {
    console.log('🔄 [useCategories] Carregando categorias de despesas...');
    
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ [useCategories] Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
      return;
    }

    console.log('✅ [useCategories] Categorias de despesas carregadas:', data?.length);
    console.log('🔍 [useCategories] Categorias encontradas:', data?.map(c => ({ id: c.id, name: c.name, created_at: c.created_at })));
    
    // Verificar especificamente categorias "Tarifa Bancária"
    const tarifaBancariaCategorias = data?.filter(c => 
      c.name.toLowerCase().includes('tarifa') && c.name.toLowerCase().includes('bancár')
    ) || [];
    
    if (tarifaBancariaCategorias.length > 0) {
      console.log('🚨 [useCategories] CATEGORIAS TARIFA BANCÁRIA ENCONTRADAS:', tarifaBancariaCategorias.map(c => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
        user_id: c.user_id
      })));
    }
    
    setExpenseCategories(data || []);
  };

  const fetchReceivableCategories = async () => {
    console.log('🔄 [useCategories] Carregando categorias de recebimento...');
    
    const { data, error } = await supabase
      .from('receivable_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ [useCategories] Erro ao carregar categorias de recebimento:', error);
      toast.error('Erro ao carregar categorias de recebimento');
      return;
    }

    console.log('✅ [useCategories] Categorias de recebimento carregadas:', data?.length);
    setReceivableCategories(data || []);
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchExpenseCategories(),
        fetchReceivableCategories()
      ]);
    }
  }, [user]);

  return {
    expenseCategories,
    receivableCategories,
    fetchExpenseCategories,
    fetchReceivableCategories
  };
};
