
import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { BankAccount } from '@/types/financial';

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount;
  onSave: (updates: {
    name?: string;
    category?: string;
  }) => Promise<boolean>;
}

const accountCategories = [
  { value: 'bancaria', label: 'Bancária' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'plataforma', label: 'Plataforma' },
  { value: 'geral', label: 'Geral' }
];

export const EditAccountDialog = ({
  open,
  onOpenChange,
  account,
  onSave
}: EditAccountDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'geral'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && account) {
      setFormData({
        name: account.name,
        category: account.category || 'geral'
      });
    }
  }, [open, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da conta é obrigatório');
      return;
    }

    const updates: { name?: string; category?: string } = {};

    if (formData.name.trim() !== account.name) {
      updates.name = formData.name.trim();
    }

    if (formData.category !== (account.category || 'geral')) {
      updates.category = formData.category;
    }

    if (Object.keys(updates).length === 0) {
      toast.info('Nenhuma alteração foi feita');
      return;
    }

    setLoading(true);
    try {
      const success = await onSave(updates);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta Bancária</DialogTitle>
          <DialogDescription>
            Altere o nome e categoria da conta bancária
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
              <Label htmlFor="category">Categoria da Conta</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {accountCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-sm text-slate-600 mb-1">Saldo Atual</div>
              <div className="text-lg font-semibold text-slate-800">
                R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
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
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
