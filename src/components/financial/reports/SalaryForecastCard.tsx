
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingDown, Calculator, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
}

interface SalaryForecastCardProps {
  allAccountsPayable: AccountPayable[];
  salaryCategoryId: string | null;
  currentMonthProfit: number;
  selectedMonth: string;
  selectedYear: string;
  totalRevenue: number;
}

export const SalaryForecastCard = ({
  allAccountsPayable,
  salaryCategoryId,
  currentMonthProfit,
  selectedMonth,
  selectedYear,
  totalRevenue
}: SalaryForecastCardProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Calcular média dos últimos 3 meses de salários e comissões
  const calculateSalaryAverage = () => {
    if (!salaryCategoryId || !allAccountsPayable) return { average: 0, months: [], count: 0 };

    const monthsData: { month: string; total: number }[] = [];
    const currentMonth = parseInt(selectedMonth);
    const currentYear = parseInt(selectedYear);

    // Pegar os últimos 3 meses antes do mês selecionado
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const monthStr = String(month).padStart(2, '0');
      const yearStr = String(year);

      // Filtrar pagamentos de salários/comissões pagos nesse mês
      const monthPayables = allAccountsPayable.filter(p => {
        if (!p.is_paid || !p.paid_date) return false;
        if (p.category_id !== salaryCategoryId) return false;
        
        const dueDate = new Date(p.due_date + 'T12:00:00');
        return String(dueDate.getMonth() + 1).padStart(2, '0') === monthStr &&
               String(dueDate.getFullYear()) === yearStr;
      });

      const total = monthPayables.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      monthsData.push({
        month: `${monthNames[month - 1]}/${yearStr.slice(2)}`,
        total
      });
    }

    // Apenas considerar meses com valores > 0 para a média
    const monthsWithData = monthsData.filter(m => m.total > 0);
    const average = monthsWithData.length > 0
      ? monthsWithData.reduce((sum, m) => sum + m.total, 0) / monthsWithData.length
      : 0;

    return { 
      average, 
      months: monthsData.reverse(), // Ordenar do mais antigo para o mais recente
      count: monthsWithData.length 
    };
  };

  const { average, months, count } = calculateSalaryAverage();
  const projectedProfit = currentMonthProfit - average;
  const hasData = count > 0;
  const profitMargin = totalRevenue > 0 ? (projectedProfit / totalRevenue) * 100 : 0;

  if (!salaryCategoryId) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
      <CardContent className={`${isMobile ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className={`font-semibold text-slate-800 ${isMobile ? 'text-base' : 'text-lg'}`}>
              Previsão de Salários e Comissões
            </h3>
            <p className="text-sm text-slate-500">
              Baseado na média dos últimos {count > 0 ? count : 3} meses
            </p>
          </div>
        </div>

        {!hasData ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Não há dados de salários/comissões nos últimos 3 meses para calcular a previsão.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Histórico dos 3 meses */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">{m.month}</p>
                  <p className={`font-semibold ${m.total > 0 ? 'text-slate-800' : 'text-slate-400'} ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {m.total > 0 ? formatCurrency(m.total) : '-'}
                  </p>
                </div>
              ))}
            </div>

            {/* Média e Projeção */}
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">Média Mensal</span>
                </div>
                <p className={`font-bold text-indigo-800 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(average)}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  Previsão de custo com equipe
                </p>
              </div>

              <div className={`rounded-lg p-4 border ${projectedProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className={`h-4 w-4 ${projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <span className={`text-sm font-medium ${projectedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Lucro Real Projetado
                    </span>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${profitMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                  </span>
                </div>
                <p className={`font-bold ${projectedProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'} ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                  {formatCurrency(projectedProfit)}
                </p>
                <p className={`text-xs mt-1 ${projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Margem de lucro real sobre receita
                </p>
              </div>
            </div>

            {/* Nota explicativa */}
            <p className="text-xs text-slate-500 italic">
              * A previsão considera a média de gastos com "Salários e comissões" dos últimos 3 meses.
              O lucro real projetado desconta essa previsão do lucro após distribuição do período atual.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
