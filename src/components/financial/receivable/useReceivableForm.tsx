
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
}

interface UseReceivableFormProps {
  bankAccounts: BankAccount[];
  onReceivableCreated: () => void;
  onClose: () => void;
}

export const useReceivableForm = ({ bankAccounts, onReceivableCreated, onClose }: UseReceivableFormProps) => {
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: 0,
    category_id: '',
    bank_account_id: '',
  });
  
  const [dollarAmount, setDollarAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  const selectedAccount = bankAccounts.find(acc => acc.id === formData.bank_account_id);
  const isHotmartAccount = selectedAccount?.name.toLowerCase().includes('hotmart');

  const calculateRealAmount = () => {
    if (isHotmartAccount && dollarAmount && exchangeRate) {
      return dollarAmount * exchangeRate;
    }
    return formData.amount;
  };

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validateForm = () => {
    let finalDescription = formData.description.trim();
    let finalAmount = formData.amount;

    if (isHotmartAccount) {
      if (!dollarAmount || dollarAmount <= 0) {
        toast.error('Valor em dólar deve ser maior que zero');
        return null;
      }
      if (!exchangeRate || exchangeRate <= 0) {
        toast.error('Cotação do dólar deve ser maior que zero');
        return null;
      }
      
      finalAmount = calculateRealAmount();
      finalDescription = `${finalDescription} (USD $${dollarAmount.toFixed(2)} - Cotação: R$${exchangeRate.toFixed(4)})`;
    }

    if (!finalDescription) {
      toast.error('Descrição é obrigatória');
      return null;
    }

    if (!finalAmount || finalAmount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return null;
    }

    if (!formData.category_id) {
      toast.error('Categoria é obrigatória');
      return null;
    }

    if (!formData.bank_account_id) {
      toast.error('Conta bancária é obrigatória');
      return null;
    }

    if (!dueDate) {
      toast.error('Data de vencimento é obrigatória');
      return null;
    }

    return { finalDescription, finalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = validateForm();
    if (!validationResult) return;

    const { finalDescription, finalAmount } = validationResult;

    try {
      setLoading(true);
      
      const localDateString = formatDateForDatabase(dueDate!);
      
      const { error } = await supabase
        .from('accounts_receivable')
        .insert([{
          description: finalDescription,
          amount: finalAmount,
          category_id: formData.category_id,
          bank_account_id: formData.bank_account_id,
          due_date: localDateString,
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
        }]);

      if (error) throw error;

      toast.success('Conta a receber criada com sucesso!');
      
      // Reset form
      setFormData({
        description: '',
        amount: 0,
        category_id: '',
        bank_account_id: '',
      });
      setDollarAmount(0);
      setExchangeRate(0);
      setDueDate(undefined);
      onClose();
      onReceivableCreated();
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
      toast.error('Erro ao criar conta a receber');
    } finally {
      setLoading(false);
    }
  };

  const handleDollarChange = (value: number) => {
    setDollarAmount(value);
    if (isHotmartAccount && exchangeRate) {
      setFormData({ ...formData, amount: value * exchangeRate });
    }
  };

  const handleExchangeRateChange = (value: number) => {
    setExchangeRate(value);
    if (isHotmartAccount && dollarAmount) {
      setFormData({ ...formData, amount: dollarAmount * value });
    }
  };

  return {
    loading,
    setLoading,
    dueDate,
    setDueDate,
    formData,
    setFormData,
    dollarAmount,
    setDollarAmount,
    exchangeRate,
    setExchangeRate,
    isHotmartAccount,
    calculateRealAmount,
    handleSubmit,
    handleDollarChange,
    handleExchangeRateChange,
  };
};
