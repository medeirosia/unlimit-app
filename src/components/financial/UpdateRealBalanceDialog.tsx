import { useEffect, useState } from 'react';
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
import type { BankAccount } from '@/types/financial';

interface UpdateRealBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccount;
  onSave: (realBalance: number | null) => Promise<boolean>;
}

export const UpdateRealBalanceDialog = ({
  open,
  onOpenChange,
  account,
  onSave,
}: UpdateRealBalanceDialogProps) => {
  const [realBalance, setRealBalance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRealBalance(account.real_balance === null || account.real_balance === undefined ? '' : String(account.real_balance));
    }
  }, [open, account.real_balance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedValue = realBalance.trim().replace(/\./g, '').replace(',', '.');
    const parsedValue = normalizedValue === '' ? null : Number(normalizedValue);

    if (parsedValue !== null && Number.isNaN(parsedValue)) {
      toast.error('Informe um saldo real válido');
      return;
    }

    setLoading(true);
    try {
      await onSave(parsedValue);
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
          <DialogTitle>Atualizar Saldo Real</DialogTitle>
          <DialogDescription>
            Registre uma conferência manual para "{account.name}". Este valor não altera lançamentos, entradas, saídas nem o Saldo Atual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <div>
                <div className="text-xs text-slate-500">Saldo Atual</div>
                <div className="font-semibold text-emerald-600">
                  R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Saldo Real anterior</div>
                <div className="font-semibold text-slate-800">
                  {account.real_balance === null || account.real_balance === undefined
                    ? 'Não informado'
                    : `R$ ${account.real_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="real_balance">Novo Saldo Real (R$)</Label>
              <Input
                id="real_balance"
                type="text"
                inputMode="decimal"
                value={realBalance}
                onChange={(e) => setRealBalance(e.target.value)}
                placeholder="Ex: 63262,53"
                disabled={loading}
              />
              <p className="text-xs text-slate-500">
                Deixe em branco para limpar a conferência manual.
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
              {loading ? 'Salvando...' : 'Salvar Saldo Real'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
