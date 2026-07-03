
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Trash2, Wallet } from 'lucide-react';
import { EditAccountDialog } from './EditAccountDialog';
import type { BankAccount } from '@/types/financial';

interface BankAccountCardProps {
  account: BankAccount;
  onUpdate: (id: string, updates: { name?: string; initial_balance?: number }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const BankAccountCard = ({ account, onUpdate, onDelete }: BankAccountCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = async (updates: { name?: string; initial_balance?: number }) => {
    const success = await onUpdate(account.id, updates);
    if (success) {
      setEditDialogOpen(false);
    }
    return success;
  };

  const handleDelete = async () => {
    const success = await onDelete(account.id);
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  const balanceColor = account.balance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <>
      <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors duration-200 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
          <CardTitle className="text-base font-medium text-slate-800 flex items-center gap-2 truncate">
            <Wallet className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{account.name}</span>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="pb-3 px-4">
          <div className="text-left pl-6">
            <div className="text-xs text-slate-500 mb-1">Saldo Atual</div>
            <div className={`text-2xl font-semibold ${balanceColor}`}>
              R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditAccountDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        account={account}
        onSave={handleEdit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta Bancária</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{account.name}"? 
              Esta ação não pode ser desfeita e pode afetar transações vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
