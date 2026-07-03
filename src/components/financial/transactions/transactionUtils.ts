
import type { FinancialTransaction } from '@/types/financial';

export const filterTransactionsByPeriod = (
  transactions: FinancialTransaction[],
  selectedMonth: string,
  selectedYear: string,
  searchTerm: string = '',
  selectedAccount: string = 'all',
  selectedType: string = 'all'
): FinancialTransaction[] => {
  console.log('🔍 [filterTransactionsByPeriod] Iniciando filtro de transações:', {
    transactionsLength: transactions.length,
    selectedMonth,
    selectedYear,
    searchTerm,
    selectedAccount,
    selectedType
  });

  return transactions.filter(transaction => {
    // 🎯 CORREÇÃO: Usar transaction_date com tratamento especial para datas UTC de meia-noite
    let transactionDate: Date;
    
    if (transaction.transaction_date) {
      const dateStr = transaction.transaction_date;
      
      // 🎯 CORREÇÃO CRÍTICA: Detectar datas UTC de meia-noite (criadas de due_date)
      if (typeof dateStr === 'string' && (
        dateStr.includes('T00:00:00') || 
        dateStr.includes(' 00:00:00+00') ||
        dateStr.includes(' 00:00:00.000Z') ||
        dateStr.endsWith('Z') && dateStr.includes('T00:00:00')
      )) {
        console.log('🎯 [filterTransactionsByPeriod] Detectada data UTC de meia-noite:', {
          original: dateStr,
          description: transaction.description
        });
        
        // Extrair apenas a parte da data (YYYY-MM-DD) e tratar como data local
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        transactionDate = new Date(year, month - 1, day);
        
        console.log('🎯 [filterTransactionsByPeriod] Convertida para data local:', {
          original: dateStr,
          datePart,
          localDate: transactionDate.toISOString(),
          description: transaction.description
        });
      } else if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se é uma string de data (YYYY-MM-DD), criar data local
        const [year, month, day] = dateStr.split('-').map(Number);
        transactionDate = new Date(year, month - 1, day);
        console.log('📅 [filterTransactionsByPeriod] Data local criada da string:', {
          original: dateStr,
          parsed: transactionDate.toISOString(),
          description: transaction.description
        });
      } else {
        transactionDate = new Date(dateStr);
        console.log('📅 [filterTransactionsByPeriod] Data parseada diretamente:', {
          original: dateStr,
          parsed: transactionDate.toISOString(),
          description: transaction.description
        });
      }
    } else {
      transactionDate = new Date(transaction.created_at);
      console.log('📅 [filterTransactionsByPeriod] Usando created_at:', {
        original: transaction.created_at,
        parsed: transactionDate.toISOString(),
        description: transaction.description
      });
    }
    
    const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const transactionYear = String(transactionDate.getFullYear());
    
    const periodMatch = transactionMonth === selectedMonth && transactionYear === selectedYear;
    
    console.log('🔍 [filterTransactionsByPeriod] Verificação de período:', {
      description: transaction.description,
      transactionPeriod: `${transactionMonth}/${transactionYear}`,
      filterPeriod: `${selectedMonth}/${selectedYear}`,
      periodMatch
    });
    
    // Filtro por termo de busca
    const searchMatch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por conta
    const accountMatch = selectedAccount === 'all' || 
      transaction.from_account_id === selectedAccount || 
      transaction.to_account_id === selectedAccount;
    
    // Filtro por tipo
    const typeMatch = selectedType === 'all' || 
      transaction.type === selectedType;
    
    const finalMatch = periodMatch && searchMatch && accountMatch && typeMatch;
    
    if (periodMatch) {
      console.log('✅ [filterTransactionsByPeriod] Transação incluída no período:', {
        description: transaction.description,
        date: transactionDate.toISOString(),
        finalMatch
      });
    }
    
    return finalMatch;
  });
};

export const sortTransactions = (
  transactions: FinancialTransaction[],
  sortBy: string
): FinancialTransaction[] => {
  const sorted = [...transactions];
  
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.created_at).getTime();
        const dateB = new Date(b.transaction_date || b.created_at).getTime();
        return dateB - dateA;
      });
    case 'date-asc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.created_at).getTime();
        const dateB = new Date(b.transaction_date || b.created_at).getTime();
        return dateA - dateB;
      });
    case 'amount-desc':
      return sorted.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':
      return sorted.sort((a, b) => a.amount - b.amount);
    case 'description':
      return sorted.sort((a, b) => a.description.localeCompare(b.description));
    default:
      return sorted;
  }
};
