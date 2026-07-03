
import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { MoreHorizontal, Edit, Trash2, Archive, Wallet, CreditCard, Building2, Smartphone } from 'lucide-react';
import { EditAccountDialog } from '../EditAccountDialog';
import type { BankAccount } from '@/types/financial';

interface BankAccountTableRowProps {
  account: BankAccount;
  onUpdate: (id: string, updates: { name?: string; initial_balance?: number; category?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>;
}

export const BankAccountTableRow = ({ account, onUpdate, onDelete, onArchive }: BankAccountTableRowProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const handleEdit = async (updates: { name?: string; category?: string }) => {
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

  const handleArchive = async () => {
    const success = await onArchive(account.id);
    if (success) {
      setArchiveDialogOpen(false);
    }
  };

  // Determinar tipo e ícone da conta baseado na categoria
  const getAccountType = (category?: string) => {
    switch (category) {
      case 'plataforma':
        return { type: 'Plataforma', icon: Smartphone, color: 'bg-purple-100 text-purple-700' };
      case 'cartao':
        return { type: 'Cartão', icon: CreditCard, color: 'bg-orange-100 text-orange-700' };
      case 'bancaria':
        return { type: 'Bancária', icon: Building2, color: 'bg-blue-100 text-blue-700' };
      default:
        return { type: 'Geral', icon: Wallet, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const accountType = getAccountType(account.category);
  const IconComponent = accountType.icon;

  return (
    <>
      <TableRow className="hover:bg-gray-50/80 border-b border-gray-100">
        <TableCell className="py-4 px-6">
          <div className={`w-8 h-8 rounded-lg ${accountType.color} flex items-center justify-center`}>
            <IconComponent className="h-4 w-4" />
          </div>
        </TableCell>
        
        <TableCell className="py-4 px-6">
          <div className="font-semibold text-gray-900 text-sm">
            {account.name}
          </div>
        </TableCell>
        
        <TableCell className="py-4 px-6">
          <Badge variant="outline" className={`${accountType.color} border-0 text-xs font-medium`}>
            {accountType.type}
          </Badge>
        </TableCell>
        
        <TableCell className="py-4 px-6 text-right">
          <div className={`text-base font-medium ${account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </TableCell>
        
        <TableCell className="py-4 px-6 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Conta
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setArchiveDialogOpen(true)}
                className="text-yellow-600 focus:text-yellow-600"
              >
                <Archive className="h-4 w-4 mr-2" />
                Arquivar Conta
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

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

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Conta Bancária</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar a conta "{account.name}"? 
              A conta será removida da listagem principal mas o histórico de transações será preservado.
              Você poderá reativá-la posteriormente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-yellow-600 hover:bg-yellow-700">
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
