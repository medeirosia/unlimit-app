
import { ExportPdfButton } from './ExportPdfButton';
import { FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface AccountPayable {
  id: string;
  amount: number;
  category_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
}

interface AccountReceivable {
  id: string;
  amount: number;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
}

interface ReportsExportHeaderProps {
  selectedMonth: string;
  selectedYear: string;
  totalReceivables: number;
  totalPayables: number;
  distributionAmount: number;
  receivablesByCategory: CategoryData[];
  payablesByCategory: CategoryData[];
  previousMonthData?: {
    totalReceivables: number;
    totalPayables: number;
    distributionAmount: number;
  };
  currentBalance: number;
  allAccountsPayable?: AccountPayable[];
  allAccountsReceivable?: AccountReceivable[];
  distributionCategoryId?: string | null;
  salaryCategoryId?: string | null;
}

export const ReportsExportHeader = ({
  selectedMonth,
  selectedYear,
  totalReceivables,
  totalPayables,
  distributionAmount,
  receivablesByCategory,
  payablesByCategory,
  previousMonthData,
  currentBalance,
  allAccountsPayable,
  allAccountsReceivable,
  distributionCategoryId,
  salaryCategoryId
}: ReportsExportHeaderProps) => {
  const isMobile = useIsMobile();
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-xl">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className={`font-semibold text-slate-800 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Relatórios Financeiros
          </h2>
          <p className="text-sm text-slate-500">
            {months[parseInt(selectedMonth) - 1]} de {selectedYear}
          </p>
        </div>
      </div>
      
      <ExportPdfButton
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
        distributionCategoryId={distributionCategoryId}
        salaryCategoryId={salaryCategoryId}
      />
    </div>
  );
};
