
import { ReportsSummaryCards } from './reports/ReportsSummaryCards';
import { RevenueByCategory } from './reports/RevenueByCategory';
import { ExpensesByCategory } from './reports/ExpensesByCategory';
import { ProfitHistoryChart } from './reports/ProfitHistoryChart';
import { CashBalanceHistoryChart } from './reports/CashBalanceHistoryChart';
import { MonthlyFlowChart } from './reports/MonthlyFlowChart';
import { ReportsExportHeader } from './reports/ReportsExportHeader';
import { SalaryForecastCard } from './reports/SalaryForecastCard';
import { RoasHistoryChart } from './reports/RoasHistoryChart';
import { calculateTotals, groupReceivablesByCategory, groupPayablesByCategory } from './reports/utils/reportsUtils';
import { useMemo } from 'react';

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

interface BankAccount {
  id: string;
  balance: number;
  active?: boolean;
}

interface ReportsTabProps {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  expenseCategories: ExpenseCategory[];
  receivableCategories: ReceivableCategory[];
  selectedMonth: string;
  selectedYear: string;
  allAccountsPayable?: AccountPayable[];
  allAccountsReceivable?: AccountReceivable[];
  bankAccounts: BankAccount[];
}

export const ReportsTab = ({
  accountsPayable,
  accountsReceivable,
  expenseCategories,
  receivableCategories,
  selectedMonth,
  selectedYear,
  allAccountsPayable,
  allAccountsReceivable,
  bankAccounts
}: ReportsTabProps) => {
  // Calculate totals and filtered data for current month
  const {
    filteredReceivables,
    filteredPayables,
    totalReceivables,
    totalPayables
  } = calculateTotals(accountsReceivable, accountsPayable, selectedMonth, selectedYear);

  // Calculate previous month data for comparison
  const previousMonthData = useMemo(() => {
    if (!allAccountsReceivable || !allAccountsPayable) return undefined;

    const monthNum = parseInt(selectedMonth);
    const yearNum = parseInt(selectedYear);
    
    let prevMonth: string;
    let prevYear: string;
    
    if (monthNum === 1) {
      prevMonth = '12';
      prevYear = String(yearNum - 1);
    } else {
      prevMonth = String(monthNum - 1).padStart(2, '0');
      prevYear = selectedYear;
    }

    const prevTotals = calculateTotals(
      allAccountsReceivable,
      allAccountsPayable,
      prevMonth,
      prevYear
    );

    // Find distribution category for previous month
    const distributionCategory = expenseCategories.find(
      cat => cat.name.toLowerCase().includes('distribuição de lucros') || 
             cat.name.toLowerCase().includes('distribuicao de lucros')
    );
    
    const prevDistributionAmount = distributionCategory 
      ? prevTotals.filteredPayables
          .filter(p => p.category_id === distributionCategory.id)
          .reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;

    return {
      totalReceivables: prevTotals.totalReceivables,
      totalPayables: prevTotals.totalPayables,
      distributionAmount: prevDistributionAmount
    };
  }, [allAccountsReceivable, allAccountsPayable, selectedMonth, selectedYear, expenseCategories]);

  // Find distribution category
  const distributionCategory = expenseCategories.find(
    cat => cat.name.toLowerCase().includes('distribuição de lucros') || 
           cat.name.toLowerCase().includes('distribuicao de lucros')
  );
  
  const distributionAmount = distributionCategory 
    ? filteredPayables
        .filter(p => p.category_id === distributionCategory.id)
        .reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;

  // Find tráfego pago categories
  const trafegoCategoryIds = expenseCategories
    .filter(cat => cat.name.toLowerCase().includes('tráfego pago') || 
                   cat.name.toLowerCase().includes('trafego pago'))
    .map(cat => cat.id);

  // Find salary category
  const salaryCategory = expenseCategories.find(
    cat => cat.name.toLowerCase().includes('salários e comissões') || 
           cat.name.toLowerCase().includes('salarios e comissoes') ||
           cat.name.toLowerCase().includes('salário') ||
           cat.name.toLowerCase().includes('salario')
  );

  // Group by categories
  const receivablesByCategory = groupReceivablesByCategory(filteredReceivables, receivableCategories);
  const payablesByCategory = groupPayablesByCategory(filteredPayables, expenseCategories);

  // Calculate current balance
  const currentBalance = bankAccounts
    .filter(acc => acc.active !== false)
    .reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

  // Calculate profit after distribution for salary forecast
  const profitAfterDistribution = totalReceivables - totalPayables;

  return (
    <div className="space-y-6">
      <ReportsExportHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        totalReceivables={totalReceivables}
        totalPayables={totalPayables}
        distributionAmount={distributionAmount}
        receivablesByCategory={receivablesByCategory}
        payablesByCategory={payablesByCategory}
        previousMonthData={previousMonthData}
        currentBalance={currentBalance}
        allAccountsPayable={allAccountsPayable}
        allAccountsReceivable={allAccountsReceivable}
        distributionCategoryId={distributionCategory?.id || null}
        salaryCategoryId={salaryCategory?.id || null}
      />

      <ReportsSummaryCards
        totalReceivables={totalReceivables}
        totalPayables={totalPayables}
        receivablesCount={filteredReceivables.length}
        payablesCount={filteredPayables.length}
        distributionAmount={distributionAmount}
      />

      <RevenueByCategory data={receivablesByCategory} />

      <ExpensesByCategory data={payablesByCategory} totalRevenue={totalReceivables} />

      {/* Salary Forecast Card - Only for current month */}
      {allAccountsPayable && (() => {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = String(now.getFullYear());
        const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
        
        return isCurrentMonth && salaryCategory ? (
          <SalaryForecastCard
            allAccountsPayable={allAccountsPayable}
            salaryCategoryId={salaryCategory.id}
            currentMonthProfit={profitAfterDistribution}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            totalRevenue={totalReceivables}
          />
        ) : null;
      })()}

      <MonthlyFlowChart
        accountsReceivable={accountsReceivable}
        accountsPayable={accountsPayable}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* Profit History Chart */}
      {allAccountsReceivable && allAccountsPayable && (
        <ProfitHistoryChart
          allReceivables={allAccountsReceivable}
          allPayables={allAccountsPayable}
          distributionCategoryId={distributionCategory?.id || null}
        />
      )}

      {/* Cash Balance History Chart */}
      {allAccountsReceivable && allAccountsPayable && (
        <CashBalanceHistoryChart
          allReceivables={allAccountsReceivable}
          allPayables={allAccountsPayable}
          currentTotalBalance={currentBalance}
        />
      )}

      {/* ROAS History Chart */}
      {allAccountsReceivable && allAccountsPayable && trafegoCategoryIds.length > 0 && (
        <RoasHistoryChart
          allReceivables={allAccountsReceivable}
          allPayables={allAccountsPayable}
          trafegoCategories={trafegoCategoryIds}
        />
      )}
    </div>
  );
};
