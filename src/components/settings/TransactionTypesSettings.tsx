import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProjectConfig } from '@/hooks/useProjectConfig';

interface TransactionType {
  id: string;
  name: string;
  project: string;
  value: string;
  created_at: string;
}

export const TransactionTypesSettings = () => {
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [newTransactionType, setNewTransactionType] = useState({ name: '', project: '', value: '' });
  const [loading, setLoading] = useState(false);
  const { getProjectOptions } = useProjectConfig();

  const fetchTransactionTypes = async () => {
    console.log('🔄 [TransactionTypesSettings] Carregando tipos de transação...');
    
    const { data, error } = await supabase
      .from('transaction_types')
      .select('*')
      .order('project, name');

    if (error) {
      console.error('❌ [TransactionTypesSettings] Erro ao carregar tipos de transação:', error);
      toast.error('Erro ao carregar tipos de transação');
      return;
    }

    console.log('✅ [TransactionTypesSettings] Tipos de transação carregados:', data?.length);
    setTransactionTypes(data || []);
  };

  const createTransactionType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransactionType.name.trim() || !newTransactionType.project || !newTransactionType.value.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('transaction_types')
        .insert([{ 
          name: newTransactionType.name.trim(),
          project: newTransactionType.project,
          value: newTransactionType.value.trim(),
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
        }]);

      if (error) throw error;

      toast.success('Tipo de transação criado com sucesso!');
      setNewTransactionType({ name: '', project: '', value: '' });
      fetchTransactionTypes();
    } catch (error) {
      console.error('Erro ao criar tipo de transação:', error);
      toast.error('Erro ao criar tipo de transação');
    } finally {
      setLoading(false);
    }
  };

  const deleteTransactionType = async (typeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de transação?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transaction_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      toast.success('Tipo de transação excluído com sucesso!');
      fetchTransactionTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo de transação:', error);
      toast.error('Erro ao excluir tipo de transação');
    }
  };

  const forceRefreshTypes = () => {
    console.log('🔄 [TransactionTypesSettings] Forçando atualização dos tipos...');
    toast.info('Atualizando tipos de transação...');
    fetchTransactionTypes();
  };

  useEffect(() => {
    fetchTransactionTypes();
  }, []);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Tipos de Transação
          <Button onClick={forceRefreshTypes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={createTransactionType} className="space-y-2">
          <Input
            value={newTransactionType.name}
            onChange={(e) => setNewTransactionType({ ...newTransactionType, name: e.target.value })}
            placeholder="Nome do tipo"
            className="w-full"
          />
          <Select 
            value={newTransactionType.project} 
            onValueChange={(value) => setNewTransactionType({ ...newTransactionType, project: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o projeto" />
            </SelectTrigger>
            <SelectContent>
              {getProjectOptions().map((project) => (
                <SelectItem key={project.value} value={project.value}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={newTransactionType.value} 
            onValueChange={(value) => setNewTransactionType({ ...newTransactionType, value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Valor técnico (ex: receita, investimento)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Receita</SelectItem>
              <SelectItem value="investment">Investimento</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </form>
        
        <div className="max-h-80 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getProjectOptions().find(p => p.value === type.project)?.label || type.project}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.value === 'revenue' ? 'default' : 'secondary'}>
                      {type.value === 'revenue' ? 'Receita' : 'Investimento'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTransactionType(type.id)}
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
  );
};