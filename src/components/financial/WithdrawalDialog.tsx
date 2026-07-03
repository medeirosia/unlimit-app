import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { handleWithdrawal } from './transfer/withdrawalHandler';
import type { BankAccount } from '@/types/financial';

interface WithdrawalDialogProps {
  bankAccounts: BankAccount[];
  onWithdrawalComplete: () => void;
}

export const WithdrawalDialog = ({ bankAccounts, onWithdrawalComplete }: WithdrawalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    feeAmount: 0,
    description: ''
  });

  // Filtrar contas de plataforma baseado na categoria
  const platformAccounts = bankAccounts.filter(account => 
    account.category === 'plataforma'
  );

  // Outras contas bancárias (exceto plataforma)
  const destinationAccounts = bankAccounts.filter(account => 
    account.category !== 'plataforma'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error('A conta de origem deve ser diferente da conta de destino');
      return;
    }

    if (formData.amount <= 0) {
      toast.error('O valor deve ser maior que zero');
      return;
    }

    if (formData.feeAmount < 0) {
      toast.error('A taxa não pode ser negativa');
      return;
    }

    setLoading(true);

    try {
      await handleWithdrawal(formData, bankAccounts);
      
      toast.success('Saque pendente criado com sucesso!');

      // Resetar formulário e fechar modal
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: 0,
        feeAmount: 0,
        description: ''
      });
      setOpen(false);
      onWithdrawalComplete();

    } catch (error) {
      console.error('💥 Erro ao criar saque:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao realizar saque');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformName = (accountId: string) => {
    const account = platformAccounts.find(acc => acc.id === accountId);
    return account ? account.name : '';
  };

  const getDestinationName = (accountId: string) => {
    const account = destinationAccounts.find(acc => acc.id === accountId);
    return account ? account.name : '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Saque de Plataforma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saque de Plataforma</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Select
              value={formData.fromAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fromAccountId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platformAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (R$ {account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Conta de Destino *</Label>
            <Select
              value={formData.toAccountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {destinationAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (R$ {account.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeAmount">Taxa do Saque</Label>
            <Input
              id="feeAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.feeAmount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, feeAmount: parseFloat(e.target.value) || 0 }))}
            />
          </div>


          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição do saque (opcional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {formData.fromAccountId && formData.toAccountId && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Resumo do Saque:</strong>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {getPlatformName(formData.fromAccountId)} → {getDestinationName(formData.toAccountId)}
              </div>
              {formData.amount > 0 && (
                <div className="text-sm text-blue-600">
                  Valor: R$ {formData.amount.toFixed(2)}
                </div>
              )}
              {formData.feeAmount > 0 && (
                <div className="text-sm text-blue-600">
                  Taxa: R$ {formData.feeAmount.toFixed(2)}
                </div>
              )}
              <div className="text-xs text-blue-500 mt-2">
                ⚠️ O valor será debitado da plataforma e o saque ficará pendente até confirmação.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processando...' : 'Criar Saque Pendente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
