
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface FormData {
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
}

interface ReceivableFormFieldsProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  isHotmartAccount: boolean;
  dollarAmount: number;
  exchangeRate: number;
  onDollarChange: (value: number) => void;
  onExchangeRateChange: (value: number) => void;
  calculateRealAmount: () => number;
}

export const ReceivableFormFields = ({
  formData,
  setFormData,
  dueDate,
  setDueDate,
  bankAccounts,
  receivableCategories,
  isHotmartAccount,
  dollarAmount,
  exchangeRate,
  onDollarChange,
  onExchangeRateChange,
  calculateRealAmount
}: ReceivableFormFieldsProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Venda produto X"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank_account">Conta Bancária *</Label>
        <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })} required>
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

      {isHotmartAccount ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="dollarAmount">Valor em Dólar (USD)</Label>
            <CurrencyInput
              value={dollarAmount}
              onChange={onDollarChange}
              placeholder="$ 0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exchangeRate">Cotação do Dólar</Label>
            <CurrencyInput
              value={exchangeRate}
              onChange={onExchangeRateChange}
              placeholder="R$ 0,00"
            />
          </div>
          
          <div className="col-span-2 space-y-2">
            <Label>Valor em Reais (Calculado)</Label>
            <Input
              value={`R$ ${calculateRealAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <CurrencyInput
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value || 0 })}
            placeholder="R$ 0,00"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
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
                {dueDate ? format(dueDate, 'dd/MM/yyyy') : 'Selecione'}
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
          <Label htmlFor="category">Categoria *</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
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
      </div>
    </div>
  );
};
