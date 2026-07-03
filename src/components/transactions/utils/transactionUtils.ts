
import { Transaction, Mentorship } from '@/types/dashboard';

// Função para obter o nome do projeto a partir da chave
export const getProjectDisplayName = (projectKey: string) => {
  // Map hardcoded para compatibilidade com dados antigos
  const legacyProjects: Record<string, string> = {
    'low-ticket': 'Low-ticket BR',
    'matheus': 'Projeto Matheus',
    'kenneth': 'Projeto Kenneth',
    'validde': 'Projeto Validde',
    'adsscanner': 'Projeto AdsScanner'
  };
  
  return legacyProjects[projectKey] || projectKey;
};

export const getTransactionTypeLabel = (type: string) => {
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

export const getFilteredAndSortedTransactions = (
  transactions: Transaction[],
  mentorships: Mentorship[],
  selectedMonth: number,
  selectedYear: number
): Transaction[] => {
  console.log('=== DEBUG: Buscando apenas transações normais (sem mentorias) ===');
  
  // Filtrar apenas transações normais do mês (remover mentorias do histórico)
  const monthlyTransactions = transactions.filter(t => {
    let transactionDate: Date;
    
    // Se é uma string no formato YYYY-MM-DD, criar data local sem timezone
    if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = t.date.split('-').map(Number);
      transactionDate = new Date(year, month - 1, day);
    } else {
      transactionDate = new Date(t.date);
    }
    
    return transactionDate.getMonth() + 1 === selectedMonth &&
           transactionDate.getFullYear() === selectedYear;
  });

  console.log('Transações normais do mês (sem mentorias):', monthlyTransactions.length);
  
  // Ordenar por data de criação (mais recentes primeiro)
  const sortedTransactions = monthlyTransactions.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
    
    return timeB - timeA; // Mais recente primeiro
  });
  
  console.log('Total de transações ordenadas (sem mentorias):', sortedTransactions.length);
  
  return sortedTransactions;
};
