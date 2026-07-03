
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  expense_categories?: { name: string };
  bank_accounts?: { name: string };
}

interface PayableEditDialogProps {
  payable: AccountPayable;
  bankAccounts: BankAccount[];
  expenseCategories: ExpenseCategory[];
  onPayableUpdated: () => void;
}

export const PayableEditDialog = ({
  payable,
  bankAccounts,
  expenseCategories,
  onPayableUpdated
}: PayableEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(payable.description);
  const [amount, setAmount] = useState(payable.amount.toString());
  const [categoryId, setCategoryId] = useState(payable.category_id);
  const [bankAccountId, setBankAccountId] = useState(payable.bank_account_id);
  const [dueDate, setDueDate] = useState(() => {
    // Criar uma data com horário meio-dia para evitar problemas de timezone
    const date = new Date(payable.due_date + 'T12:00:00');
    return date;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateForDatabase = (date: Date): string => {
    // Criar uma nova data com o fuso horário de São Paulo
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Formatar data para o banco usando fuso horário local
      const localDateString = formatDateForDatabase(dueDate);

      const { error } = await supabase
        .from('accounts_payable')
        .update({
          description,
          amount: parseFloat(amount),
          category_id: categoryId,
          bank_account_id: bankAccountId,
          due_date: localDateString,
          updated_at: new Date().toISOString()
        })
        .eq('id', payable.id);

      if (error) {
        toast.error('Erro ao atualizar conta a pagar');
        return;
      }

      toast.success('Conta a pagar atualizada com sucesso');
      setOpen(false);
      onPayableUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar conta a pagar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription(payable.description);
    setAmount(payable.amount.toString());
    setCategoryId(payable.category_id);
    setBankAccountId(payable.bank_account_id);
    setDueDate(new Date(payable.due_date + 'T12:00:00'));
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta a Pagar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account">Conta Bancária</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Data de Vencimento</Label>
            <Input
              id="due-date"
              type="date"
              value={formatDateForInput(dueDate)}
              onChange={(e) => setDueDate(new Date(e.target.value + 'T12:00:00'))}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
