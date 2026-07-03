
interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  expense_categories?: { name: string };
  bank_accounts?: { name: string };
}

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  bank_account_id: string;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  bank_accounts?: { name: string };
  receivable_categories?: { name: string };
}

interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

interface ReceivableCategory {
  id: string;
  name: string;
  created_at: string;
}

export const filterByPeriod = (date: string, selectedMonth: string, selectedYear: string) => {
  const itemDate = new Date(date + 'T00:00:00');
  const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
  const itemYear = String(itemDate.getFullYear());
  return itemMonth === selectedMonth && itemYear === selectedYear;
};

export const calculateTotals = (
  accountsReceivable: AccountReceivable[],
  accountsPayable: AccountPayable[],
  selectedMonth: string,
  selectedYear: string
) => {
  console.log('📊 [calculateTotals] Iniciando cálculo de totais para período:', `${selectedMonth}/${selectedYear}`);
  
  // CORREÇÃO: Receitas filtradas pela DATA DE VENCIMENTO (due_date) apenas as recebidas
  const filteredReceivables = accountsReceivable.filter(
    item => {
      const isReceived = item.is_received;
      const periodMatch = filterByPeriod(item.due_date, selectedMonth, selectedYear);
      
      console.log('🔍 [calculateTotals] Verificando receivable:', {
        description: item.description,
        due_date: item.due_date,
        received_date: item.received_date,
        is_received: isReceived,
        periodMatch,
        period: `${selectedMonth}/${selectedYear}`
      });
      
      return isReceived && periodMatch;
    }
  );

  // CORREÇÃO: Despesas filtradas pela DATA DE VENCIMENTO (due_date) apenas as pagas
  const filteredPayables = accountsPayable.filter(
    item => {
      const isPaid = item.is_paid && item.paid_date;
      const periodMatch = filterByPeriod(item.due_date, selectedMonth, selectedYear);
      
      console.log('🔍 [calculateTotals] Verificando payable:', {
        description: item.description,
        due_date: item.due_date,
        paid_date: item.paid_date,
        is_paid: item.is_paid,
        periodMatch,
        period: `${selectedMonth}/${selectedYear}`
      });
      
      return isPaid && periodMatch;
    }
  );

  const totalReceivables = filteredReceivables.reduce((sum, item) => sum + item.amount, 0);
  const totalPayables = filteredPayables.reduce((sum, item) => sum + item.amount, 0);

  console.log('✅ [calculateTotals] Totais calculados:', {
    filteredReceivablesCount: filteredReceivables.length,
    filteredPayablesCount: filteredPayables.length,
    totalReceivables,
    totalPayables,
    period: `${selectedMonth}/${selectedYear}`
  });

  return {
    filteredReceivables,
    filteredPayables,
    totalReceivables,
    totalPayables
  };
};

export const groupReceivablesByCategory = (
  filteredReceivables: AccountReceivable[],
  receivableCategories: ReceivableCategory[]
) => {
  return receivableCategories.map(category => {
    const categoryReceivables = filteredReceivables.filter(
      item => item.category_id === category.id
    );
    const total = categoryReceivables.reduce((sum, item) => sum + item.amount, 0);
    return {
      category: category.name,
      total,
      count: categoryReceivables.length,
      transactions: categoryReceivables.sort((a, b) => {
        // Ordenar por data de vencimento (due_date)
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        return dateB - dateA; // Mais recente primeiro
      })
    };
  }).filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total); // Ordenar por valor decrescente
};

export const groupPayablesByCategory = (
  filteredPayables: AccountPayable[],
  expenseCategories: ExpenseCategory[]
) => {
  return expenseCategories.map(category => {
    const categoryPayables = filteredPayables.filter(
      item => item.category_id === category.id
    );
    const total = categoryPayables.reduce((sum, item) => sum + item.amount, 0);
    return {
      category: category.name,
      total,
      count: categoryPayables.length,
      transactions: categoryPayables.sort((a, b) => {
        // Ordenar por data de vencimento (due_date)
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        return dateB - dateA; // Mais recente primeiro
      })
    };
  }).filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total); // Ordenar por valor decrescente
};
