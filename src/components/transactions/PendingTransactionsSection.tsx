
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Transaction } from '@/types/dashboard';
import { Edit, Trash2, ChevronDown, ChevronUp, Undo, DollarSign, TrendingUp } from 'lucide-react';
import { TransactionFormFields } from './TransactionFormFields';

interface PendingTransactionsSectionProps {
  pendingTransactions: Transaction[];
  onEditPendingTransaction?: (transactionId: string, transaction: Omit<Transaction, 'id'>) => void;
  onDeletePendingTransaction?: (transactionId: string) => void;
  onRestorePendingTransaction?: (transactionId: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  editingTransaction: Transaction | null;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleEditPending: (transaction: Transaction) => void;
  cancelEdit: () => void;
}

export const PendingTransactionsSection = ({
  pendingTransactions,
  onDeletePendingTransaction,
  onRestorePendingTransaction,
  formData,
  setFormData,
  editingTransaction,
  editDialogOpen,
  setEditDialogOpen,
  handleSubmit,
  handleEditPending,
  cancelEdit
}: PendingTransactionsSectionProps) => {
  const [pendingSectionOpen, setPendingSectionOpen] = useState(pendingTransactions.length > 0);

  const projects = [
    { value: 'low-ticket', label: 'Low-ticket BR' },
    { value: 'matheus', label: 'Projeto Matheus' },
    { value: 'kenneth', label: 'Projeto Kenneth' },
  ];

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'revenue':
        return 'Receita';
      case 'low-ticket-revenue':
        return 'Receita Low-ticket';
      case 'investment':
        return 'Investimento';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-orange-50 border-orange-200 shadow-lg">
      <Collapsible open={pendingSectionOpen} onOpenChange={setPendingSectionOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
            <CardTitle className="text-lg text-orange-800 flex items-center justify-between">
              <span>Transações em Aberto ({pendingTransactions.length})</span>
              {pendingSectionOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {pendingTransactions.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {projects.find(p => p.value === transaction.project)?.label}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.type.includes('revenue') ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {transaction.type.includes('revenue') ? (
                              <DollarSign className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.type.includes('revenue') ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPending(transaction)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Transação</DialogTitle>
                                </DialogHeader>
                                <TransactionFormFields
                                  formData={formData}
                                  setFormData={setFormData}
                                  onSubmit={handleSubmit}
                                  editingTransaction={editingTransaction}
                                  onCancel={cancelEdit}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRestorePendingTransaction?.(transaction.id)}
                              className="h-8 w-8 p-0 text-green-600"
                            >
                              <Undo className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeletePendingTransaction?.(transaction.id)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 border rounded-lg bg-slate-50">
                Nenhuma transação em aberto
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
