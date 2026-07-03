
import { useMemo } from 'react';
import { usePeriodManagement } from './dashboard/usePeriodManagement';
import { useTransactionManagement } from './dashboard/useTransactionManagement';
import { useMentorshipManagement } from './dashboard/useMentorshipManagement';
import { calculateProjectData } from '@/utils/dashboard/projectCalculations';
import { useProjectConfig } from './useProjectConfig';

export const useDashboardData = () => {
  const { getProjectsForPeriod } = useProjectConfig();
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = usePeriodManagement();

  const {
    transactions,
    pendingTransactions,
    addTransaction,
    undoTransaction,
    editPendingTransaction,
    deletePendingTransaction,
    restorePendingTransaction,
  } = useTransactionManagement();

  const {
    mentorships,
    addMentorship,
    updateMentorship,
    deleteMentorship,
    addPaymentToMentorship,
    receivePayment,
  } = useMentorshipManagement();

  const calculateProjectDataMemo = useMemo(() => {
    // Usa a nova função que considera se é mês atual ou anterior
    const projectsForPeriod = getProjectsForPeriod(selectedMonth, selectedYear)
      .map(p => ({ key: p.key, name: p.name }));
    return () => calculateProjectData(transactions, mentorships, selectedMonth, selectedYear, projectsForPeriod);
  }, [transactions, mentorships, selectedMonth, selectedYear, getProjectsForPeriod]);

  return {
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
    calculateProjectData: calculateProjectDataMemo,
  };
};
