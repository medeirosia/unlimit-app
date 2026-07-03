
import { useState } from 'react';
import type { BankAccount, FinancialTransaction } from '@/types/financial';

export const useHistoricalBalances = () => {
  const [bankAccountsWithHistoricalBalance, setBankAccountsWithHistoricalBalance] = useState<BankAccount[]>([]);

  const calculateHistoricalBalances = (
    selectedMonth: string,
    selectedYear: string,
    bankAccounts: BankAccount[],
    allFinancialTransactions: FinancialTransaction[]
  ) => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    
    // Se estamos no mês atual ou futuro, usar saldo atual
    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth >= currentMonth)) {
      setBankAccountsWithHistoricalBalance(bankAccounts);
      return;
    }

    // Calcular último dia do mês selecionado às 23:59:59
    const endOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59, 999);
    
    console.log(`Calculando saldos históricos para ${selectedMonth}/${selectedYear}`);
    console.log('Data limite:', endOfMonth);

    const accountsWithHistoricalBalance = bankAccounts.map(account => {
      // Filtrar transações POSTERIORES ao mês selecionado
      const futureTransactions = allFinancialTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        return transactionDate > endOfMonth;
      });

      console.log(`Conta ${account.name}:`, {
        saldoAtual: account.balance,
        totalTransactions: allFinancialTransactions.length,
        futureTransactions: futureTransactions.length,
        endOfMonth: endOfMonth.toISOString()
      });

      // Calcular saldo histórico: saldo atual - transações futuras
      let historicalBalance = account.balance;
      
      futureTransactions.forEach(transaction => {
        if (transaction.to_account_id === account.id) {
          // Remover entradas futuras
          historicalBalance -= Number(transaction.amount);
          console.log(`Removendo entrada futura: -${transaction.amount} = ${historicalBalance}`);
        } else if (transaction.from_account_id === account.id) {
          // Adicionar saídas futuras (cancelar a saída)
          historicalBalance += Number(transaction.amount);
          console.log(`Cancelando saída futura: +${transaction.amount} = ${historicalBalance}`);
        }
      });

      console.log(`Saldo histórico final para ${account.name}: ${historicalBalance}`);

      return {
        ...account,
        balance: historicalBalance
      };
    });

    setBankAccountsWithHistoricalBalance(accountsWithHistoricalBalance);
  };

  return {
    bankAccountsWithHistoricalBalance,
    setBankAccountsWithHistoricalBalance,
    calculateHistoricalBalances
  };
};
