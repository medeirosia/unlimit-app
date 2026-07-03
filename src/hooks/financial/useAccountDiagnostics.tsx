
import { useEffect } from 'react';
import { useBalanceAnalysis } from './useBalanceAnalysis';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

export const useAccountDiagnostics = () => {
  const { analyzeAccountBalance, fixBalanceIssues } = useBalanceAnalysis();

  const runDiagnostics = async (
    bankAccounts: BankAccount[],
    allTransactions: FinancialTransaction[]
  ) => {
    console.log('🏥 Iniciando diagnóstico completo das contas...');

    // Focar na análise da Conta Simples
    const contaSimples = await analyzeAccountBalance('Conta Simples', bankAccounts, allTransactions);
    
    if (contaSimples) {
      console.log('\n=== DIAGNÓSTICO DA CONTA SIMPLES ===');
      console.log(`Saldo Atual: R$ ${contaSimples.currentBalance}`);
      console.log(`Saldo Calculado: R$ ${contaSimples.calculatedBalance}`);
      console.log(`Diferença: R$ ${contaSimples.difference}`);
      console.log(`Problemas encontrados: ${contaSimples.issues.length}`);
      
      if (contaSimples.issues.length > 0) {
        console.log('\n--- PROBLEMAS IDENTIFICADOS ---');
        contaSimples.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   Tipo: ${issue.type}`);
          console.log(`   Transação: ${issue.transaction.description}`);
          console.log(`   Valor: R$ ${issue.transaction.amount}`);
          console.log(`   Data: ${issue.transaction.transaction_date}`);
          console.log(`   ID: ${issue.transaction.id}`);
          console.log('');
        });
      }

      console.log('\n--- RECOMENDAÇÕES ---');
      contaSimples.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });

      // Verificar especificamente transferências da pagar.me
      const pagarMeAccount = bankAccounts.find(acc => acc.name.toLowerCase().includes('pagar.me'));
      const contaSimplesAccount = bankAccounts.find(acc => acc.name === 'Conta Simples');
      
      if (pagarMeAccount && contaSimplesAccount) {
        console.log('\n=== ANÁLISE DE TRANSFERÊNCIAS PAGAR.ME ===');
        
        const transfersFromPagarMe = allTransactions.filter(t => 
          t.from_account_id === pagarMeAccount.id && 
          (t.to_account_id === contaSimplesAccount.id || t.description.toLowerCase().includes('simples'))
        );

        const transfersToContaSimples = allTransactions.filter(t => 
          t.to_account_id === contaSimplesAccount.id &&
          t.from_account_id === pagarMeAccount.id
        );

        console.log(`Transferências da pagar.me para Conta Simples: ${transfersToContaSimples.length}`);
        
        transfersToContaSimples.forEach((transfer, index) => {
          console.log(`${index + 1}. ${transfer.description} - R$ ${transfer.amount} - ${transfer.transaction_date}`);
        });

        // Verificar saques pendentes relacionados
        const withdrawalTransactions = allTransactions.filter(t => 
          t.reference_type === 'withdrawal' && 
          (t.from_account_id === pagarMeAccount.id || t.to_account_id === contaSimplesAccount.id)
        );

        console.log(`Transações de saque relacionadas: ${withdrawalTransactions.length}`);
        withdrawalTransactions.forEach((withdrawal, index) => {
          console.log(`${index + 1}. ${withdrawal.description} - R$ ${withdrawal.amount} - ${withdrawal.transaction_date}`);
        });
      }

      return contaSimples;
    }

    return null;
  };

  return { runDiagnostics, fixBalanceIssues };
};
