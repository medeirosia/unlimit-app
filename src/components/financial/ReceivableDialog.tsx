
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

import { ReceivableFormFields } from './receivable/ReceivableFormFields';
import { useReceivableForm } from './receivable/useReceivableForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ReceivableDialogProps {
  bankAccounts: BankAccount[];
  receivableCategories: ReceivableCategory[];
  onReceivableCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ReceivableDialog = ({ 
  bankAccounts, 
  receivableCategories, 
  onReceivableCreated,
  open: openProp,
  onOpenChange
}: ReceivableDialogProps) => {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setOpenInternal(v); };

  const {
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
    handleDollarChange,
    handleExchangeRateChange,
  } = useReceivableForm({
    bankAccounts,
    onReceivableCreated: () => {
      onReceivableCreated();
    },
    onClose: () => setOpen(false),
  });

  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent, shouldReceive: boolean = false) => {
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

    if (shouldReceive && !formData.bank_account_id) {
      toast.error('Selecione uma conta bancária para realizar o recebimento');
      return;
    }

    try {
      setLoading(true);
      
      const localDateString = formatDateForDatabase(dueDate);
      
      console.log('🔄 [ReceivableDialog] Formatando data:', {
        originalDate: dueDate,
        formattedDate: localDateString,
        shouldReceive
      });
      // Preparar descrição final com informações de dólar se for Hotmart
      let finalDescription = formData.description.trim();
      if (isHotmartAccount && dollarAmount && exchangeRate) {
        finalDescription = `${finalDescription} (USD $${dollarAmount.toFixed(2)} - Cotação: R$${exchangeRate.toFixed(4)})`;
      }

      // Criar a conta a receber
      const { data: receivableData, error: receivableError } = await supabase
        .from('accounts_receivable')
        .insert([{
          description: finalDescription,
          amount: formData.amount,
          category_id: formData.category_id,
          bank_account_id: formData.bank_account_id,
          due_date: localDateString,
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          is_received: shouldReceive,
          received_date: shouldReceive ? localDateString : null,
        }])
        .select()
        .single();

      if (receivableError) {
        throw receivableError;
      }

      console.log('✅ [ReceivableDialog] Conta a receber criada:', {
        id: receivableData.id,
        due_date: receivableData.due_date,
        shouldReceive
      });

      // Se deve receber imediatamente, processar o recebimento
      if (shouldReceive && formData.bank_account_id) {
        const bankAccount = bankAccounts.find(acc => acc.id === formData.bank_account_id);
        if (bankAccount) {
          // Atualizar saldo da conta bancária
          const { error: balanceError } = await supabase
            .from('bank_accounts')
            .update({ balance: bankAccount.balance + formData.amount })
            .eq('id', formData.bank_account_id);

          if (balanceError) {
            toast.error('Erro ao atualizar saldo da conta');
            return;
          }

          // 🎯 CORREÇÃO CRÍTICA: Usar diretamente a string da data de vencimento
          console.log('🔄 [ReceivableDialog] Criando transação com data de vencimento:', {
            description: `Recebimento: ${formData.description.trim()}`,
            amount: formData.amount,
            due_date: localDateString,
            transaction_date: localDateString // USAR DIRETAMENTE A STRING DA DUE_DATE
          });

          // Criar transação financeira usando diretamente a data de vencimento
          const { data: transactionData, error: transactionError } = await supabase
            .from('financial_transactions')
            .insert([{
              user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
              description: `Recebimento: ${finalDescription}`,
              amount: formData.amount,
              type: 'receipt',
              to_account_id: formData.bank_account_id,
              reference_id: receivableData.id,
              reference_type: 'receivable',
              transaction_date: localDateString // USAR DIRETAMENTE A STRING DA DUE_DATE
            }])
            .select()
            .single();

          if (transactionError) {
            console.error('❌ [ReceivableDialog] Erro ao criar transação:', transactionError);
            toast.error('Erro ao registrar transação');
            return;
          }

          console.log('✅ [ReceivableDialog] Transação criada com sucesso:', {
            transaction_id: transactionData?.id,
            transaction_date: transactionData?.transaction_date,
            due_date_original: localDateString
          });
        }
      }

      toast.success(shouldReceive ? 'Conta a receber criada e recebida com sucesso!' : 'Conta a receber criada com sucesso!');
      
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
      setOpen(false);
      
      // Chamar o callback para refresh completo
      onReceivableCreated();
      
    } catch (error) {
      console.error('❌ [ReceivableDialog] Erro ao criar conta a receber:', error);
      toast.error('Erro ao criar conta a receber');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
            <DialogDescription>
              Adicione uma nova conta a receber ao sistema
            </DialogDescription>
          </DialogHeader>
          
          <ReceivableFormFields
            formData={formData}
            setFormData={setFormData}
            dueDate={dueDate}
            setDueDate={setDueDate}
            bankAccounts={bankAccounts}
            receivableCategories={receivableCategories}
            isHotmartAccount={isHotmartAccount}
            dollarAmount={dollarAmount}
            exchangeRate={exchangeRate}
            onDollarChange={handleDollarChange}
            onExchangeRateChange={handleExchangeRateChange}
            calculateRealAmount={calculateRealAmount}
          />
          
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
              {loading ? 'Criando...' : 'Criar e Receber'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
