import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CreditCard, Calendar, Settings, BarChart3, Wallet } from 'lucide-react';
import { FinancialSummaryCards } from './financial/FinancialSummaryCards';
import { BankAccountsTab } from './financial/BankAccountsTab';
import { TransactionsTab } from './financial/TransactionsTab';
import { AccountsPayableTab } from './financial/AccountsPayableTab';
import { AccountsReceivableTab } from './financial/AccountsReceivableTab';
import { SettingsTab } from './financial/SettingsTab';
import { ReportsTab } from './financial/ReportsTab';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { filterDataByPeriod } from '@/utils/financialUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialModuleProps {
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export const FinancialModule = ({
  selectedMonth,
  selectedYear,
}: FinancialModuleProps) => {
  const { can } = useGlobalPermissions();
  const isMobile = useIsMobile();

  const {
    bankAccounts,
    expenseCategories,
    receivableCategories,
    accountsPayable,
    accountsReceivable,
    allFinancialTransactions,
    fetchData,
    forceRefresh,
  } = useFinancialData();

  const tabs = [
    can('financeiro.contas.acessar') && 'accounts',
    can('financeiro.lancamentos.acessar') && 'transactions',
    can('financeiro.pagar.acessar') && 'payable',
    can('financeiro.receber.acessar') && 'receivable',
    can('financeiro.relatorios.acessar') && 'reports',
    can('financeiro.configuracoes.acessar') && 'settings',
  ].filter(Boolean) as string[];

  const getGridCols = (count: number) => {
    const map: Record<number, string> = {
      1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
      4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
    };
    return map[count] || 'grid-cols-4';
  };

  const filteredPayable = filterDataByPeriod(accountsPayable, 'due_date', selectedMonth, selectedYear);
  const filteredReceivable = filterDataByPeriod(accountsReceivable, 'due_date', selectedMonth, selectedYear);

  const handleDataChange = async () => {
    if (forceRefresh) await forceRefresh();
    await fetchData();
  };

  const defaultTab = tabs[0] || 'accounts';

  return (
    <div className="space-y-4">
      {can('financeiro.metricas_topo') && (
        <FinancialSummaryCards
          bankAccounts={bankAccounts}
          accountsPayable={filteredPayable}
          accountsReceivable={filteredReceivable}
        />
      )}

      <Tabs defaultValue={defaultTab} className="space-y-1">
        <TabsList className={`grid w-full ${getGridCols(tabs.length)} bg-white border shadow-sm`}>
          {can('financeiro.contas.acessar') && (
            <TabsTrigger value="accounts" className="flex items-center justify-center gap-2">
              <Wallet className="h-4 w-4" />{!isMobile && <span>Contas</span>}
            </TabsTrigger>
          )}
          {can('financeiro.lancamentos.acessar') && (
            <TabsTrigger value="transactions" className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />{!isMobile && <span>Extrato</span>}
            </TabsTrigger>
          )}
          {can('financeiro.pagar.acessar') && (
            <TabsTrigger value="payable" className="flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" />{!isMobile && <span>Contas a Pagar</span>}
            </TabsTrigger>
          )}
          {can('financeiro.receber.acessar') && (
            <TabsTrigger value="receivable" className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />{!isMobile && <span>Contas a Receber</span>}
            </TabsTrigger>
          )}
          {can('financeiro.relatorios.acessar') && (
            <TabsTrigger value="reports" className="flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4" />{!isMobile && <span>Relatórios</span>}
            </TabsTrigger>
          )}
          {can('financeiro.configuracoes.acessar') && (
            <TabsTrigger value="settings" className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />{!isMobile && <span>Configurações</span>}
            </TabsTrigger>
          )}
        </TabsList>

        {can('financeiro.contas.acessar') && (
          <TabsContent value="accounts"><BankAccountsTab onDataChange={handleDataChange} /></TabsContent>
        )}
        {can('financeiro.lancamentos.acessar') && (
          <TabsContent value="transactions">
            <TransactionsTab
              financialTransactions={allFinancialTransactions}
              bankAccounts={bankAccounts}
              onDataChange={handleDataChange}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </TabsContent>
        )}
        {can('financeiro.pagar.acessar') && (
          <TabsContent value="payable">
            <AccountsPayableTab
              accountsPayable={filteredPayable}
              bankAccounts={bankAccounts}
              expenseCategories={expenseCategories}
              onDataChange={fetchData}
            />
          </TabsContent>
        )}
        {can('financeiro.receber.acessar') && (
          <TabsContent value="receivable">
            <AccountsReceivableTab
              accountsReceivable={filteredReceivable}
              bankAccounts={bankAccounts}
              receivableCategories={receivableCategories}
              onDataChange={handleDataChange}
            />
          </TabsContent>
        )}
        {can('financeiro.relatorios.acessar') && (
          <TabsContent value="reports">
            <ReportsTab
              accountsPayable={accountsPayable}
              accountsReceivable={accountsReceivable}
              expenseCategories={expenseCategories}
              receivableCategories={receivableCategories}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              allAccountsPayable={accountsPayable}
              allAccountsReceivable={accountsReceivable}
              bankAccounts={bankAccounts}
            />
          </TabsContent>
        )}
        {can('financeiro.configuracoes.acessar') && (
          <TabsContent value="settings">
            <SettingsTab
              expenseCategories={expenseCategories}
              receivableCategories={receivableCategories}
              onDataChange={fetchData}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
