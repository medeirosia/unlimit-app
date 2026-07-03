
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useProjectConfig } from '@/hooks/useProjectConfig';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface TransactionFormFieldsProps {
  formData: {
    project: string;
    type: string;
    amount: number;
    date: string;
    description: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTransaction: any;
  onCancel?: () => void;
}

export const TransactionFormFields = ({
  formData,
  setFormData,
  onSubmit,
  editingTransaction,
  onCancel
}: TransactionFormFieldsProps) => {
  const { getProjectOptions } = useProjectConfig();
  const [transactionTypes, setTransactionTypes] = useState<Array<{ value: string; label: string; }>>([]);
  
  // Usar apenas projetos ativos
  const projects = getProjectOptions().map(p => ({
    value: p.value,
    label: p.label
  }));

  useEffect(() => {
    const fetchTransactionTypes = async () => {
      if (!formData.project) {
        setTransactionTypes([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transaction_types')
          .select('*')
          .eq('project', formData.project)
          .order('name');

        if (error) throw error;

        const types = data?.map(type => ({
          value: type.value,
          label: type.name
        })) || [];

        setTransactionTypes(types);
      } catch (error) {
        console.error('Erro ao buscar tipos de transação:', error);
        setTransactionTypes([]);
      }
    };

    fetchTransactionTypes();
  }, [formData.project]);

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          {editingTransaction ? 'Editar Transação' : 'Novo Lançamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto *</Label>
              <Select 
                value={formData.project} 
                onValueChange={(value) => setFormData({ ...formData, project: value, type: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.value} value={project.value}>
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as 'revenue' | 'investment' | 'low-ticket-revenue' })}
                disabled={!formData.project}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição opcional da transação..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}
            </Button>
            {editingTransaction && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
