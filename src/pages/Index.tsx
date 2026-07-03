import { Tabs } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { TabNavigation } from '@/components/dashboard/TabNavigation';
import { TabContent } from '@/components/dashboard/TabContent';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { useTabManagement } from '@/hooks/useTabManagement';
import { useTaxConfig } from '@/hooks/useTaxConfig';
import { Navigate } from 'react-router-dom';

import { useMemo } from 'react';

const Index = () => {
  const { can, loading: permissionsLoading } = useGlobalPermissions();
  const { taxPercentage } = useTaxConfig();

  // Load dashboard data
  const {
    selectedMonth,
    selectedYear,
    transactions,
    pendingTransactions,
    mentorships,
    setSelectedMonth,
    setSelectedYear,
    addTransaction,
    undoTransaction,
    editPendingTransaction,
    deletePendingTransaction,
    restorePendingTransaction,
    addMentorship,
    updateMentorship,
    deleteMentorship,
    addPaymentToMentorship,
    receivePayment,
    calculateProjectData,
  } = useDashboardData();

  // Load tab management
  const {
    selectedTab,
    setSelectedTab,
    availableTabs,
    getGridCols,
  } = useTabManagement();

  // Calculate all data that might be needed
  const projectsData = useMemo(() => calculateProjectData(), [calculateProjectData]);
  const totalRevenue = useMemo(() => projectsData.reduce((sum, p) => sum + p.revenue, 0), [projectsData]);
  const rawTotalInvestment = useMemo(() => projectsData.reduce((sum, p) => sum + p.investment, 0), [projectsData]);
  const taxAmount = useMemo(() => rawTotalInvestment * (taxPercentage / 100), [rawTotalInvestment, taxPercentage]);
  const totalInvestment = useMemo(() => rawTotalInvestment + taxAmount, [rawTotalInvestment, taxAmount]);
  const totalProfit = useMemo(() => totalRevenue - totalInvestment, [totalRevenue, totalInvestment]);
  const overallRoas = useMemo(() => totalInvestment > 0 ? totalRevenue / totalInvestment : 0, [totalRevenue, totalInvestment]);
  const canViewMetrics = useMemo(() => can('inicio.metricas_topo'), [can]);
  const canAccessHome = useMemo(() => can('inicio.acessar'), [can]);

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Carregando permissões...</div>
      </div>
    );
  }

  if (!canAccessHome) {
    if (can('financeiro.acessar')) return <Navigate to="/financeiro" replace />;
    return <Navigate to="/entrar" replace />;
  }

  return (
    <div className="min-h-full p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        <DashboardHeader
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {canViewMetrics && (
          <SummaryCards
            totalRevenue={totalRevenue}
            totalInvestment={totalInvestment}
            overallRoas={overallRoas}
            totalProfit={totalProfit}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            transactions={transactions}
            taxAmount={taxAmount}
            taxPercentage={taxPercentage}
          />
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabNavigation 
            availableTabs={availableTabs}
            getGridCols={getGridCols}
          />

          <TabContent
            projectsData={projectsData}
            transactions={transactions}
            pendingTransactions={pendingTransactions}
            mentorships={mentorships}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onAddTransaction={addTransaction}
            onUndoTransaction={undoTransaction}
            onEditPendingTransaction={editPendingTransaction}
            onDeletePendingTransaction={deletePendingTransaction}
            onRestorePendingTransaction={restorePendingTransaction}
            onAddMentorship={addMentorship}
            onUpdateMentorship={updateMentorship}
            onDeleteMentorship={deleteMentorship}
            onAddPayment={addPaymentToMentorship}
            onReceivePayment={receivePayment}
          />
        </Tabs>

      </div>
    </div>
  );
};

export default Index;
