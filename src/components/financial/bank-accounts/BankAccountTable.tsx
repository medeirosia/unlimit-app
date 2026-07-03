
import { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
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
import { MoreVertical, Edit, Trash2, Archive, Wallet, CreditCard, Building2, Smartphone } from 'lucide-react';
import { BankAccountTableRow } from './BankAccountTableRow';
import { EditAccountDialog } from '../EditAccountDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BankAccount } from '@/types/financial';

interface BankAccountTableProps {
  accounts: BankAccount[];
  onUpdate: (id: string, updates: { name?: string; initial_balance?: number; category?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>;
}

export const BankAccountTable = ({ accounts, onUpdate, onDelete, onArchive }: BankAccountTableProps) => {
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const isMobile = useIsMobile();

  const sortedAccounts = [...accounts].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;

    switch (sortBy) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'balance':
        valueA = a.balance;
        valueB = b.balance;
        break;
      case 'created':
        valueA = new Date(a.created_at).getTime();
        valueB = new Date(b.created_at).getTime();
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }

    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: 'name' | 'balance' | 'created') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

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

  const handleEdit = async (updates: { name?: string; category?: string }) => {
    if (!selectedAccount) return false;
    const success = await onUpdate(selectedAccount.id, updates);
    if (success) {
      setEditDialogOpen(false);
      setSelectedAccount(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    const success = await onDelete(selectedAccount.id);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleArchive = async () => {
    if (!selectedAccount) return;
    const success = await onArchive(selectedAccount.id);
    if (success) {
      setArchiveDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {sortedAccounts.map((account) => {
            const accountType = getAccountType(account.category);
            const IconComponent = accountType.icon;
            
            return (
              <Card key={account.id} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl ${accountType.color} flex items-center justify-center shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{account.name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                            <DropdownMenuItem onClick={() => {
                              setSelectedAccount(account);
                              setEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Conta
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedAccount(account);
                                setArchiveDialogOpen(true);
                              }}
                              className="text-yellow-600 focus:text-yellow-600"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar Conta
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedAccount(account);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className={`${accountType.color} border-0 text-[10px] font-medium px-2 py-0`}>
                          {accountType.type}
                        </Badge>
                        <span className={`text-base font-bold ${account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedAccount && (
          <>
            <EditAccountDialog
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) setSelectedAccount(null);
              }}
              account={selectedAccount}
              onSave={handleEdit}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setSelectedAccount(null);
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Conta Bancária</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a conta "{selectedAccount.name}"? 
                    Esta ação não pode ser desfeita.
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

            <AlertDialog open={archiveDialogOpen} onOpenChange={(open) => {
              setArchiveDialogOpen(open);
              if (!open) setSelectedAccount(null);
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar Conta Bancária</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja arquivar a conta "{selectedAccount.name}"?
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
        )}
      </>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Tipo
              </TableHead>
              <TableHead 
                className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Nome da Conta
                  {sortBy === 'name' && (
                    <span className="text-gray-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </TableHead>
              <TableHead 
                className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center justify-end gap-1">
                  Saldo Atual
                  {sortBy === 'balance' && (
                    <span className="text-gray-400">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAccounts.map((account) => (
              <BankAccountTableRow
                key={account.id}
                account={account}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onArchive={onArchive}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
