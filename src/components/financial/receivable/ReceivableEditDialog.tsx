
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CurrencyInput } from '@/components/ui/currency-input';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface ReceivableCategory {
  id: string;
  name: string;
  created_at: string;
}

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
  created_at: string;
  updated_at: string;
  receivable_categories?: { name: string };
  bank_accounts?: { name: string };
}

interface ReceivableEditDialogProps {
  receivable: AccountReceivable;
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  onReceivableUpdated: () => void;
}

const parseDescriptionForDollarInfo = (description: string) => {
  // Extrair valor em dólar e cotação da descrição
  const dollarMatch = description.match(/USD \$([0-9,.]+)/);
  const rateMatch = description.match(/Cotação: R\$([0-9,.]+)/);
  
  const dollarAmount = dollarMatch ? parseFloat(dollarMatch[1].replace(',', '.')) : 0;
  const exchangeRate = rateMatch ? parseFloat(rateMatch[1].replace(',', '.')) : 0;
  
  // Extrair descrição limpa (sem as informações de dólar)
  const cleanDescription = description.replace(/\s*\(USD.*?\)/, '').trim();
  
  return { dollarAmount, exchangeRate, cleanDescription };
};

export const ReceivableEditDialog = ({
  receivable,
  bankAccounts,
  receivableCategories,
  onReceivableUpdated
}: ReceivableEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Parsear informações de dólar da descrição
  const { dollarAmount: initialDollarAmount, exchangeRate: initialExchangeRate, cleanDescription } = 
    parseDescriptionForDollarInfo(receivable.description);
  
  const [description, setDescription] = useState(cleanDescription);
  const [amount, setAmount] = useState(receivable.amount);
  const [categoryId, setCategoryId] = useState(receivable.category_id);
  const [bankAccountId, setBankAccountId] = useState(receivable.bank_account_id);
  const [dueDate, setDueDate] = useState(() => {
    // Criar uma data com horário meio-dia para evitar problemas de timezone
    const date = new Date(receivable.due_date + 'T12:00:00');
    return date;
  });
  
  // Estados para valores em dólar (para contas Hotmart)
  const [dollarAmount, setDollarAmount] = useState(initialDollarAmount);
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate);

  const selectedAccount = bankAccounts.find(acc => acc.id === bankAccountId);
  const isHotmartAccount = selectedAccount?.name.toLowerCase().includes('hotmart');

  const calculateRealAmount = () => {
    if (isHotmartAccount && dollarAmount && exchangeRate) {
      return dollarAmount * exchangeRate;
    }
    return amount;
  };

  const handleDollarChange = (value: number) => {
    setDollarAmount(value);
    if (isHotmartAccount && exchangeRate) {
      setAmount(value * exchangeRate);
    }
  };

  const handleExchangeRateChange = (value: number) => {
    setExchangeRate(value);
    if (isHotmartAccount && dollarAmount) {
      setAmount(dollarAmount * value);
    }
  };

  const formatDateForDatabase = (date: Date): string => {
    // Criar uma nova data com o fuso horário de São Paulo
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (!categoryId) {
      toast.error('Categoria é obrigatória');
      return;
    }

    if (!bankAccountId) {
      toast.error('Conta bancária é obrigatória');
      return;
    }

    if (!dueDate) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    try {
      setLoading(true);
      
      // Preparar descrição final
      let finalDescription = description.trim();
      let finalAmount = amount;

      if (isHotmartAccount && dollarAmount && exchangeRate) {
        finalAmount = calculateRealAmount();
        finalDescription = `${finalDescription} (USD $${dollarAmount.toFixed(2)} - Cotação: R$${exchangeRate.toFixed(4)})`;
      }
      
      // Formatar data para o banco usando fuso horário local
      const localDateString = formatDateForDatabase(dueDate);
      
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          description: finalDescription,
          amount: finalAmount,
          category_id: categoryId,
          bank_account_id: bankAccountId,
          due_date: localDateString,
          updated_at: new Date().toISOString()
        })
        .eq('id', receivable.id);

      if (error) {
        toast.error('Erro ao atualizar conta a receber');
        return;
      }

      toast.success('Conta a receber atualizada com sucesso');
      setOpen(false);
      onReceivableUpdated();
    } catch (error) {
      toast.error('Erro ao atualizar conta a receber');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const { dollarAmount: resetDollarAmount, exchangeRate: resetExchangeRate, cleanDescription: resetCleanDescription } = 
      parseDescriptionForDollarInfo(receivable.description);
      
    setDescription(resetCleanDescription);
    setAmount(receivable.amount);
    setCategoryId(receivable.category_id);
    setBankAccountId(receivable.bank_account_id);
    setDueDate(new Date(receivable.due_date + 'T12:00:00'));
    setDollarAmount(resetDollarAmount);
    setExchangeRate(resetExchangeRate);
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen) {
        // Reinicializar os valores quando o dialog abrir
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
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

          {isHotmartAccount && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dollar-amount">Valor em Dólar (USD)</Label>
                <CurrencyInput
                  value={dollarAmount}
                  onChange={handleDollarChange}
                  placeholder="$ 0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exchange-rate">Cotação do Dólar (R$)</Label>
                <CurrencyInput
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Calculado em Real</Label>
                <div className="text-lg font-semibold text-green-600">
                  R$ {calculateRealAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </>
          )}

          {!isHotmartAccount && (
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <CurrencyInput
                value={amount}
                onChange={(value) => setAmount(value || 0)}
                placeholder="R$ 0,00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {receivableCategories.map((category) => (
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
