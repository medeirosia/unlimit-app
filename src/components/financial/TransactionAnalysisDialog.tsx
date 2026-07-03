
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TransactionAnalysis {
  duplicates: any[];
  balanceDiscrepancies: {
    accountId: string;
    accountName: string;
    calculatedBalance: number;
    actualBalance: number;
    difference: number;
  }[];
  orphanedTransactions: any[];
}

interface TransactionAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: TransactionAnalysis | null;
  isAnalyzing: boolean;
  onFixBalance: (accountId: string, correctBalance: number) => void;
}

export const TransactionAnalysisDialog = ({
  open,
  onOpenChange,
  analysis,
  isAnalyzing,
  onFixBalance
}: TransactionAnalysisDialogProps) => {
  if (isAnalyzing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analisando Transações...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Verificando inconsistências...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) return null;

  const hasIssues = analysis.duplicates.length > 0 || 
                   analysis.balanceDiscrepancies.length > 0 || 
                   analysis.orphanedTransactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasIssues ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Problemas Encontrados
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Análise Concluída - Tudo OK
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discrepâncias de Saldo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Discrepâncias de Saldo ({analysis.balanceDiscrepancies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.balanceDiscrepancies.length === 0 ? (
                <p className="text-green-600">✅ Todos os saldos estão corretos</p>
              ) : (
                <div className="space-y-3">
                  {analysis.balanceDiscrepancies.map((discrepancy) => (
                    <div key={discrepancy.accountId} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{discrepancy.accountName}</h4>
                          <p className="text-sm text-gray-600">
                            Saldo Atual: R$ {discrepancy.actualBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Saldo Calculado: R$ {discrepancy.calculatedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm font-medium text-red-600">
                            Diferença: R$ {Math.abs(discrepancy.difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onFixBalance(discrepancy.accountId, discrepancy.calculatedBalance)}
                          className="ml-4"
                        >
                          Corrigir Saldo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transações Duplicadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Possíveis Duplicatas ({analysis.duplicates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.duplicates.length === 0 ? (
                <p className="text-green-600">✅ Nenhuma duplicata encontrada</p>
              ) : (
                <div className="space-y-2">
                  {analysis.duplicates.map((transaction) => (
                    <div key={transaction.id} className="border rounded p-2 text-sm">
                      <div className="flex justify-between">
                        <span>{transaction.description}</span>
                        <span>R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(transaction.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transações Órfãs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Transações Órfãs ({analysis.orphanedTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.orphanedTransactions.length === 0 ? (
                <p className="text-green-600">✅ Todas as transações estão vinculadas corretamente</p>
              ) : (
                <div className="space-y-2">
                  {analysis.orphanedTransactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded p-2 text-sm">
                      <Badge variant="destructive" className="mb-1">Órfã</Badge>
                      <div>{transaction.description}</div>
                      <div className="text-gray-500 text-xs">
                        ID: {transaction.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
