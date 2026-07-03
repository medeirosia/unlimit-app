
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

interface ReceivableCategory {
  id: string;
  name: string;
  created_at: string;
}

interface SettingsTabProps {
  expenseCategories: ExpenseCategory[];
  receivableCategories: ReceivableCategory[];
  onDataChange: () => void;
}

export const SettingsTab = ({ 
  expenseCategories, 
  receivableCategories, 
  onDataChange 
}: SettingsTabProps) => {
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newReceivableCategory, setNewReceivableCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const createExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExpenseCategory.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      // Usar um user_id fixo para manter compatibilidade com o schema
      // mas com dados compartilhados através das políticas RLS
      const { error } = await supabase
        .from('expense_categories')
        .insert([{ 
          name: newExpenseCategory.trim(),
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34', // ID do admin para compatibilidade
        }]);

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      setNewExpenseCategory('');
      onDataChange();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const createReceivableCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReceivableCategory.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      // Usar um user_id fixo para manter compatibilidade com o schema
      // mas com dados compartilhados através das políticas RLS
      const { error } = await supabase
        .from('receivable_categories')
        .insert([{ 
          name: newReceivableCategory.trim(),
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34', // ID do admin para compatibilidade
        }]);

      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      setNewReceivableCategory('');
      onDataChange();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpenseCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      onDataChange();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const deleteReceivableCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('receivable_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      onDataChange();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const forceRefreshCategories = () => {
    console.log('🔄 [SettingsTab] Forçando atualização das categorias...');
    toast.info('Atualizando categorias...');
    onDataChange();
  };

  const cleanupDuplicatedCategories = async () => {
    if (!confirm('Tem certeza que deseja limpar as categorias duplicadas? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      console.log('🧹 [SettingsTab] Iniciando limpeza de categorias duplicadas...');
      
      // Buscar todas as categorias "Tarifa Bancária"
      const { data: tarifaCategories, error: fetchError } = await supabase
        .from('expense_categories')
        .select('*')
        .ilike('name', '%tarifa%bancár%');

      if (fetchError) {
        console.error('Erro ao buscar categorias:', fetchError);
        throw fetchError;
      }

      console.log('🔍 [SettingsTab] Categorias Tarifa Bancária encontradas:', tarifaCategories);

      if (tarifaCategories && tarifaCategories.length > 1) {
        // Manter a mais antiga
        const categoryToKeep = tarifaCategories.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];

        const categoriesToDelete = tarifaCategories.filter(c => c.id !== categoryToKeep.id);

        console.log('🗂️ [SettingsTab] Categoria a manter:', categoryToKeep);
        console.log('🗑️ [SettingsTab] Categorias a excluir:', categoriesToDelete);

        // Atualizar contas a pagar que usam as categorias duplicadas
        for (const category of categoriesToDelete) {
          const { error: updateError } = await supabase
            .from('accounts_payable')
            .update({ category_id: categoryToKeep.id })
            .eq('category_id', category.id);

          if (updateError) {
            console.error('Erro ao atualizar contas a pagar:', updateError);
            throw updateError;
          }
        }

        // Excluir categorias duplicadas
        for (const category of categoriesToDelete) {
          const { error: deleteError } = await supabase
            .from('expense_categories')
            .delete()
            .eq('id', category.id);

          if (deleteError) {
            console.error('Erro ao excluir categoria:', deleteError);
            throw deleteError;
          }
        }

        toast.success(`Limpeza concluída! Removidas ${categoriesToDelete.length} categorias duplicadas.`);
      } else {
        toast.info('Nenhuma categoria duplicada encontrada.');
      }

      onDataChange();
    } catch (error) {
      console.error('Erro na limpeza:', error);
      toast.error('Erro ao limpar categorias duplicadas');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se há categorias "Tarifa Bancária" duplicadas
  const tarifaBancariaCategories = expenseCategories.filter(c => 
    c.name.toLowerCase().includes('tarifa') && c.name.toLowerCase().includes('bancár')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <div className="flex gap-2">
          <Button onClick={forceRefreshCategories} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {tarifaBancariaCategories.length > 1 && (
            <Button 
              onClick={cleanupDuplicatedCategories} 
              variant="destructive" 
              size="sm"
              disabled={loading}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Limpar Duplicadas
            </Button>
          )}
        </div>
      </div>
      
      {tarifaBancariaCategories.length > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <strong>Categorias duplicadas detectadas!</strong>
          </div>
          <p className="text-yellow-700 mt-1">
            Foram encontradas {tarifaBancariaCategories.length} categorias "Tarifa Bancária". 
            Clique em "Limpar Duplicadas" para manter apenas uma.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorias de Despesas */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Categorias de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={createExpenseCategory} className="flex gap-2">
              <Input
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        {category.name}
                        {tarifaBancariaCategories.length > 1 && 
                         tarifaBancariaCategories.some(c => c.id === category.id) && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Duplicada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteExpenseCategory(category.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Categorias de Recebimentos */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Categorias de Recebimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={createReceivableCategory} className="flex gap-2">
              <Input
                value={newReceivableCategory}
                onChange={(e) => setNewReceivableCategory(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivableCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteReceivableCategory(category.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
