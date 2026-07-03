
import { CategoryAccordion } from './CategoryAccordion';
import { TrendingDown, PieChart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryData {
  category: string;
  total: number;
  count: number;
  transactions: any[];
}

interface ExpensesByCategoryProps {
  data: CategoryData[];
  totalRevenue: number;
}

export const ExpensesByCategory = ({ data, totalRevenue }: ExpensesByCategoryProps) => {
  const isMobile = useIsMobile();
  const totalExpenses = data.reduce((sum, category) => sum + category.total, 0);
  const totalCount = data.reduce((sum, category) => sum + category.count, 0);
  const expensePercentage = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 bg-rose-100 rounded-xl">
          <TrendingDown className="h-5 w-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-slate-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Despesas por Categoria
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            <span className="font-bold text-rose-600">{formatCurrency(totalExpenses)}</span>
            <span>•</span>
            <span>{totalCount} {totalCount === 1 ? 'item' : 'itens'}</span>
            {totalRevenue > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${expensePercentage > 80 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {expensePercentage.toFixed(0)}% da receita
                </span>
              </>
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
          <PieChart className="h-3.5 w-3.5" />
          <span>{data.length} {data.length === 1 ? 'categoria' : 'categorias'}</span>
        </div>
      </div>
      
      <CategoryAccordion
        data={data}
        type="expense"
        emptyMessage="Nenhuma despesa encontrada para o período selecionado."
        totalRevenue={totalRevenue}
        totalAmount={totalExpenses}
      />
    </div>
  );
};
