
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { useBalanceRecovery } from '@/hooks/financial/useBalanceRecovery';
import type { BankAccount } from '@/types/financial';

interface EmergencyBalanceRestoreProps {
  bankAccounts: BankAccount[];
  onDataChange: () => void;
}

export const EmergencyBalanceRestore = ({ bankAccounts, onDataChange }: EmergencyBalanceRestoreProps) => {
  const { loading, restoreBalance } = useBalanceRecovery();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.amount) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      return;
    }

    await restoreBalance(
      formData.accountId,
      amount,
      formData.description || 'Restauração manual de saldo',
      onDataChange
    );

    setFormData({ accountId: '', amount: '', description: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Restaurar Saldo (Emergência)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">⚠️ Restauração de Emergência</DialogTitle>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            <strong>ATENÇÃO:</strong> Use apenas se uma transação foi deletada mas o saldo não foi restaurado.
            Esta ação adicionará o valor diretamente à conta selecionada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Conta a Restaurar *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
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
            <Label htmlFor="amount">Valor a Restaurar *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="7700.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Motivo da Restauração</Label>
            <Textarea
              id="description"
              placeholder="Ex: Saque de R$ 7.700,00 deletado mas valor não restaurado"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {formData.amount && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-800">
                <strong>Ação que será executada:</strong>
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Adicionar R$ {parseFloat(formData.amount || '0').toFixed(2)} à conta selecionada
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? 'Restaurando...' : 'Restaurar Saldo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
