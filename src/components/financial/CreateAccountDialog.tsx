
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: (accountData: {
    name: string;
    initial_balance: number;
  }) => Promise<any>;
}

export const CreateAccountDialog = ({
  open,
  onOpenChange,
  onCreateAccount
}: CreateAccountDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    initial_balance: '0'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    const initialBalance = parseFloat(formData.initial_balance) || 0;

    setLoading(true);
    try {
      await onCreateAccount({
        name: formData.name.trim(),
        initial_balance: initialBalance
      });
      
      setFormData({ name: '', initial_balance: '0' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setFormData({ name: '', initial_balance: '0' });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Conta Bancária</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta bancária ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conta*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Conta Corrente Banco do Brasil"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="initial_balance">Saldo Inicial (R$)</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: e.target.value }))}
                placeholder="0,00"
                disabled={loading}
              />
              <p className="text-xs text-slate-500">
                Informe o saldo atual da conta para inicialização
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
