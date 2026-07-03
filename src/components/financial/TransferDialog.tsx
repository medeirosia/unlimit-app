
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { BankAccount } from '@/types/financial';

interface TransferDialogProps {
  bankAccounts: BankAccount[];
  onTransferComplete: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export const TransferDialog = ({ bankAccounts, onTransferComplete, open: openProp, onOpenChange, hideTrigger }: TransferDialogProps) => {
  const { user } = useAuth();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setOpenInternal(v); };
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error('A conta de origem deve ser diferente da conta de destino');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('O valor deve ser maior que zero');
      return;
    }

    setLoading(true);

    try {
      // Criar a transação de transferência
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          type: 'transfer',
          from_account_id: formData.fromAccountId,
          to_account_id: formData.toAccountId,
          amount: amount,
          description: formData.description || 'Transferência entre contas',
          transaction_date: formData.date,
          user_id: user.id
        });

      if (error) {
        console.error('Erro ao criar transferência:', error);
        toast.error('Erro ao criar transferência');
        return;
      }

      // Recalcular saldos das contas envolvidas
      const { error: recalcError1 } = await supabase.rpc('recalculate_bank_account_balance', {
        account_id: formData.fromAccountId
      });

      const { error: recalcError2 } = await supabase.rpc('recalculate_bank_account_balance', {
        account_id: formData.toAccountId
      });

      if (recalcError1 || recalcError2) {
        console.error('Erro ao recalcular saldos:', recalcError1 || recalcError2);
        toast.warning('Transferência criada, mas houve erro ao recalcular saldos');
      } else {
        toast.success('Transferência realizada com sucesso!');
      }

      // Resetar formulário e fechar modal
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setOpen(false);
      onTransferComplete();

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao realizar transferência');
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = bankAccounts.find(acc => acc.id === accountId);
    return account ? account.name : '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferência
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">Conta de Origem *</Label>
            <Select
              value={formData.fromAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fromAccountId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (R$ {account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">Conta de Destino *</Label>
            <Select
              value={formData.toAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts
                  .filter(account => account.id !== formData.fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} (R$ {account.balance.toFixed(2)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição da transferência (opcional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {formData.fromAccountId && formData.toAccountId && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Resumo da Transferência:</strong>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {getAccountName(formData.fromAccountId)} → {getAccountName(formData.toAccountId)}
              </div>
              {formData.amount && (
                <div className="text-sm text-blue-600">
                  Valor: R$ {parseFloat(formData.amount || '0').toFixed(2)}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar Transferência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
