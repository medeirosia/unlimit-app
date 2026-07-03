
import { ProjectData, Transaction } from '@/types/dashboard';
import { RevenueRankingTable } from './dashboard/RevenueRankingTable';
import { ProjectPerformanceCards } from './dashboard/ProjectPerformanceCards';
import { DailyRevenueChart } from './dashboard/DailyRevenueChart';
import { useProjectConfig } from '@/hooks/useProjectConfig';
import { useTaxConfig } from '@/hooks/useTaxConfig';
import { useMemo } from 'react';

interface DashboardOverviewProps {
  projectsData: ProjectData[];
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
}

export const DashboardOverview = ({ 
  projectsData, 
  transactions, 
  selectedMonth, 
  selectedYear,
}: DashboardOverviewProps) => {
  const { getProjectsForPeriod } = useProjectConfig();
  const { taxPercentage } = useTaxConfig();
  
  // Sort projects by revenue (descending)
  const sortedProjectsData = [...projectsData].sort((a, b) => b.revenue - a.revenue);
  
  // Obter projetos para o período selecionado (ativos no mês atual, todos em meses anteriores)
  const projectsForPeriod = useMemo(() => (
    getProjectsForPeriod(selectedMonth, selectedYear)
      .map(p => ({ key: p.key, name: p.name }))
  ), [getProjectsForPeriod, selectedMonth, selectedYear]);
  
  return (
    <div className="space-y-4">
      {/* Distribuição de Receita ocupando toda a largura */}
      <RevenueRankingTable projectsData={sortedProjectsData} />

      {/* Cards por Projeto */}
      <ProjectPerformanceCards projectsData={sortedProjectsData} />

      {/* Gráfico de Receitas e Despesas Diárias */}
      <DailyRevenueChart 
        transactions={transactions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        activeProjects={projectsForPeriod}
        taxPercentage={taxPercentage}
      />
    </div>
  );
};
