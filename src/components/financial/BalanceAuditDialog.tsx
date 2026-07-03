
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Calculator, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useBalanceAudit } from '@/hooks/financial/useBalanceAudit';
import { useFinancialData } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BalanceAuditDialog = () => {
  const [open, setOpen] = useState(false);
  const { bankAccounts, allFinancialTransactions } = useFinancialData();
  const { auditing, auditResults, performFullAudit, fixAllBalances } = useBalanceAudit();

  const handleAudit = async () => {
    if (bankAccounts.length === 0 || allFinancialTransactions.length === 0) {
      return;
    }
    
    await performFullAudit(bankAccounts, allFinancialTransactions);
  };

  const handleFixAll = async () => {
    await fixAllBalances();
    // Re-auditar após correção
    await handleAudit();
  };

  // Análise específica Hotmart → Conta Simples
  const analyzeHotmartContaSimples = () => {
    const hotmart = bankAccounts.find(acc => acc.name.toLowerCase().includes('hotmart'));
    const contaSimples = bankAccounts.find(acc => acc.name.toLowerCase().includes('conta simples'));

    if (!hotmart || !contaSimples) {
      return null;
    }

    const transfersHotmartToContaSimples = allFinancialTransactions.filter(t => 
      t.type === 'transfer' && 
      t.from_account_id === hotmart.id && 
      t.to_account_id === contaSimples.id
    );

    const transfersContaSimplesToHotmart = allFinancialTransactions.filter(t => 
      t.type === 'transfer' && 
      t.from_account_id === contaSimples.id && 
      t.to_account_id === hotmart.id
    );

    const totalHotmartToContaSimples = transfersHotmartToContaSimples.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalContaSimplestoHotmart = transfersContaSimplesToHotmart.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      hotmart,
      contaSimples,
      transfersHotmartToContaSimples,
      transfersContaSimplesToHotmart,
      totalHotmartToContaSimples,
      totalContaSimplestoHotmart,
      netTransfer: totalHotmartToContaSimples - totalContaSimplestoHotmart
    };
  };

  const hotmartAnalysis = analyzeHotmartContaSimples();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Auditoria de Saldos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auditoria Completa de Saldos Bancários</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={handleAudit}
              disabled={auditing}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {auditing ? 'Auditando...' : 'Iniciar Auditoria'}
            </Button>
            
            {auditResults.length > 0 && (
              <Button
                onClick={handleFixAll}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Corrigir Todos os Saldos
              </Button>
            )}
          </div>

          {/* Análise Específica Hotmart ↔ Conta Simples */}
          {hotmartAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                  Análise: Hotmart ↔ Conta Simples
                </CardTitle>
                <CardDescription>
                  Auditoria específica das transferências entre as contas Hotmart e Conta Simples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Hotmart → Conta Simples
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {hotmartAnalysis.transfersHotmartToContaSimples.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        R$ {hotmartAnalysis.totalHotmartToContaSimples.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Conta Simples → Hotmart
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {hotmartAnalysis.transfersContaSimplesToHotmart.length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        R$ {hotmartAnalysis.totalContaSimplestoHotmart.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Transferência Líquida</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${hotmartAnalysis.netTransfer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {hotmartAnalysis.netTransfer.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {hotmartAnalysis.netTransfer >= 0 ? 'Para Conta Simples' : 'Para Hotmart'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Saldos Atuais:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="font-medium">{hotmartAnalysis.hotmart.name}</div>
                      <div className="text-lg font-bold">R$ {hotmartAnalysis.hotmart.balance.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="font-medium">{hotmartAnalysis.contaSimples.name}</div>
                      <div className="text-lg font-bold">R$ {hotmartAnalysis.contaSimples.balance.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados da Auditoria */}
          {auditResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resultados da Auditoria</h3>
              
              {auditResults.map((result) => (
                <Card key={result.accountId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{result.accountName}</span>
                      <Badge variant={Math.abs(result.difference) > 0.01 ? "destructive" : "default"}>
                        {Math.abs(result.difference) > 0.01 ? "Divergência" : "OK"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Saldo Atual</div>
                        <div className="text-lg font-bold">R$ {result.currentBalance.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Saldo Calculado</div>
                        <div className="text-lg font-bold">R$ {result.calculatedBalance.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Diferença</div>
                        <div className={`text-lg font-bold ${result.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {result.difference.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Transações</div>
                        <div className="text-lg font-bold">{result.transactions.length}</div>
                      </div>
                    </div>

                    {result.duplicateTransactions.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-orange-600 mb-2">
                          🔍 {result.duplicateTransactions.length} transação(ões) duplicada(s) encontrada(s)
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-sm font-medium">Recomendações:</div>
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
