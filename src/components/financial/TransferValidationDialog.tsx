
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Calendar, Copy, ArrowRight } from 'lucide-react';
import { useTransferValidation } from '@/hooks/financial/useTransferValidation';
import { useFinancialData } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TransferValidationDialog = () => {
  const [open, setOpen] = useState(false);
  const { bankAccounts, allFinancialTransactions } = useFinancialData();
  const { validating, validationResult, validateTransfers, fixTransferIssues } = useTransferValidation();

  const handleValidate = async () => {
    if (bankAccounts.length === 0 || allFinancialTransactions.length === 0) {
      return;
    }
    
    await validateTransfers(bankAccounts, allFinancialTransactions);
  };

  const handleFix = async () => {
    if (!validationResult || validationResult.issues.length === 0) return;
    
    const success = await fixTransferIssues(validationResult.issues);
    if (success) {
      // Re-validar após correção
      await handleValidate();
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'incomplete': return 'bg-orange-100 text-orange-800';
      case 'orphaned': return 'bg-red-100 text-red-800';
      case 'duplicate': return 'bg-yellow-100 text-yellow-800';
      case 'date_mismatch': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'incomplete': return <AlertTriangle className="h-4 w-4" />;
      case 'orphaned': return <XCircle className="h-4 w-4" />;
      case 'duplicate': return <Copy className="h-4 w-4" />;
      case 'date_mismatch': return <Calendar className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Validar Transferências
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validação de Transferências Internas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="flex items-center gap-2"
            >
              {validating ? 'Validando...' : 'Iniciar Validação'}
            </Button>
            
            {validationResult && validationResult.issues.length > 0 && (
              <Button
                onClick={handleFix}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Corrigir Problemas
              </Button>
            )}
          </div>

          {validationResult && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{validationResult.totalTransfers}</div>
                    <p className="text-xs text-muted-foreground">transferências</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Válidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{validationResult.validTransfers}</div>
                    <p className="text-xs text-muted-foreground">sem problemas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Problemas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{validationResult.issues.length}</div>
                    <p className="text-xs text-muted-foreground">encontrados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Contas Afetadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{validationResult.accountsAffected.length}</div>
                    <p className="text-xs text-muted-foreground">contas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.issues.length === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    Status da Validação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {validationResult.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>

                  {validationResult.accountsAffected.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Contas Afetadas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.accountsAffected.map((account, index) => (
                          <Badge key={index} variant="outline">
                            {account}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de Problemas */}
              {validationResult.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Problemas Identificados</CardTitle>
                    <CardDescription>
                      {validationResult.issues.length} problema(s) encontrado(s) nas transferências
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {validationResult.issues.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getIssueIcon(issue.type)}
                              <Badge className={getIssueColor(issue.type)}>
                                {issue.type}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(issue.transaction.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-1">{issue.description}</h4>
                          <p className="text-sm text-gray-600 mb-2">{issue.suggestion}</p>
                          
                          <div className="bg-gray-50 rounded p-3 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <strong>Transação:</strong> {issue.transaction.description}
                              </div>
                              <div>
                                <strong>Valor:</strong> R$ {Number(issue.transaction.amount).toFixed(2)}
                              </div>
                              <div>
                                <strong>Origem:</strong> {issue.transaction.from_account?.name || 'N/A'}
                              </div>
                              <div>
                                <strong>Destino:</strong> {issue.transaction.to_account?.name || 'N/A'}
                              </div>
                            </div>
                            
                            {issue.relatedTransaction && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <ArrowRight className="h-3 w-3" />
                                  Relacionada: {issue.relatedTransaction.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
