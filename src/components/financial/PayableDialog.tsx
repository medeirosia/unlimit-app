
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

interface PayableDialogProps {
  bankAccounts: BankAccount[];
  expenseCategories: ExpenseCategory[];
  onPayableCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PayableDialog = ({ 
  bankAccounts, 
  expenseCategories, 
  onPayableCreated,
  open: openProp,
  onOpenChange
}: PayableDialogProps) => {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setOpenInternal(v); };
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category_id: '',
    bank_account_id: '',
  });

  const formatDateForDatabase = (date: Date): string => {
    // Criar uma nova data com o fuso horário de São Paulo
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent, shouldPay: boolean = false) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (!dueDate) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    if (!formData.category_id) {
      toast.error('Categoria é obrigatória');
      return;
    }

    if (!formData.bank_account_id) {
      toast.error('Conta de débito é obrigatória');
      return;
    }

    try {
      setLoading(true);
      
      // Formatar data para o banco usando fuso horário local
      const localDateString = formatDateForDatabase(dueDate);
      
      // Criar a conta a pagar
      const { data: payableData, error: payableError } = await supabase
        .from('accounts_payable')
        .insert([{
          description: formData.description.trim(),
          amount: formData.amount,
          category_id: formData.category_id || null,
          bank_account_id: formData.bank_account_id || null,
          due_date: localDateString,
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          is_paid: shouldPay,
          paid_date: shouldPay ? localDateString : null,
        }])
        .select()
        .single();

      if (payableError) throw payableError;

      // Se deve pagar imediatamente, processar o pagamento
      if (shouldPay && formData.bank_account_id) {
        const bankAccount = bankAccounts.find(acc => acc.id === formData.bank_account_id);
        if (bankAccount) {
          // Atualizar saldo da conta bancária
          const { error: balanceError } = await supabase
            .from('bank_accounts')
            .update({ balance: bankAccount.balance - formData.amount })
            .eq('id', formData.bank_account_id);

          if (balanceError) {
            toast.error('Erro ao atualizar saldo');
            return;
          }

          // Criar transação financeira usando a data de vencimento
          const { error: transactionError } = await supabase
            .from('financial_transactions')
            .insert([{
              user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
              description: `Pagamento: ${formData.description.trim()}`,
              amount: formData.amount,
              type: 'payment',
              from_account_id: formData.bank_account_id,
              reference_id: payableData.id,
              reference_type: 'payable',
              transaction_date: localDateString // Usar a data de vencimento como data da transação
            }]);

          if (transactionError) {
            toast.error('Erro ao registrar transação');
            return;
          }
        }
      }

      toast.success(shouldPay ? 'Conta a pagar criada e paga com sucesso!' : 'Conta a pagar criada com sucesso!');
      setFormData({
        description: '',
        amount: 0,
        category_id: '',
        bank_account_id: '',
      });
      setDueDate(undefined);
      setOpen(false);
      onPayableCreated();
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
      toast.error('Erro ao criar conta a pagar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
            <DialogDescription>
              Adicione uma nova conta a pagar ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Aluguel da loja"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value || 0 })}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
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
              <Label htmlFor="bank_account">Conta de Débito</Label>
              <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
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
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
            <Button 
              type="button" 
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Criando...' : 'Criar e Pagar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
