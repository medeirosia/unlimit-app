
import { CategoryAccordion } from './CategoryAccordion';
import { TrendingUp, PieChart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryData {
  category: string;
  total: number;
  count: number;
  transactions: any[];
}

interface RevenueByCategoryProps {
  data: CategoryData[];
}

export const RevenueByCategory = ({ data }: RevenueByCategoryProps) => {
  const isMobile = useIsMobile();
  const totalRevenue = data.reduce((sum, category) => sum + category.total, 0);
  const totalCount = data.reduce((sum, category) => sum + category.count, 0);

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
        <div className="p-2 bg-emerald-100 rounded-xl">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-slate-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Receitas por Categoria
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-bold text-emerald-600">{formatCurrency(totalRevenue)}</span>
            <span>•</span>
            <span>{totalCount} {totalCount === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs text-slate-400">
          <PieChart className="h-3.5 w-3.5" />
          <span>{data.length} {data.length === 1 ? 'categoria' : 'categorias'}</span>
        </div>
      </div>
      
      <CategoryAccordion
        data={data}
        type="revenue"
        emptyMessage="Nenhuma receita encontrada para o período selecionado."
        totalAmount={totalRevenue}
      />
    </div>
  );
};
