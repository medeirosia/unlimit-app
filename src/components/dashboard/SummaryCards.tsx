
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, Wallet, ArrowUpRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Transaction } from '@/types/dashboard';

interface SummaryCardsProps {
  totalRevenue: number;
  totalInvestment: number;
  overallRoas: number;
  totalProfit: number;
  selectedMonth: number;
  selectedYear: number;
  transactions?: Transaction[];
  taxAmount?: number;
  taxPercentage?: number;
}

export const SummaryCards = ({ 
  totalRevenue, 
  totalInvestment, 
  overallRoas, 
  totalProfit,
  selectedMonth,
  selectedYear,
  transactions = [],
  taxAmount = 0,
  taxPercentage = 0,
}: SummaryCardsProps) => {
  const isMobile = useIsMobile();
  
  const currentDate = new Date();
  const isCurrentMonth = currentDate.getMonth() + 1 === selectedMonth && currentDate.getFullYear() === selectedYear;
  
  let projectedRevenue = 0;
  let projectedProfit = 0;
  if (isCurrentMonth) {
    // Encontrar o dia do último lançamento do mês ao invés de usar o dia atual
    const monthTransactions = transactions.filter(t => {
      let d: Date;
      if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, day] = t.date.split('-').map(Number);
        d = new Date(y, m - 1, day);
      } else {
        d = new Date(t.date);
      }
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    let lastDay = currentDate.getDate();
    if (monthTransactions.length > 0) {
      lastDay = Math.max(...monthTransactions.map(t => {
        if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return parseInt(t.date.split('-')[2]);
        }
        return new Date(t.date).getDate();
      }));
    }

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    if (totalRevenue > 0 && lastDay > 0) {
      const dailyRevenueAverage = totalRevenue / lastDay;
      projectedRevenue = dailyRevenueAverage * daysInMonth;
    }
    if (lastDay > 0) {
      const dailyProfitAverage = totalProfit / lastDay;
      projectedProfit = dailyProfitAverage * daysInMonth;
    }
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const cards = [
    {
      title: 'Receita Total',
      value: `R$ ${formatNumber(totalRevenue)}`,
      subtitle: null,
      icon: DollarSign,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    },
    {
      title: 'Investimento',
      value: `R$ ${formatNumber(totalInvestment)}`,
      subtitle: taxAmount > 0 ? `Impostos: R$${formatNumber(taxAmount)} (${taxPercentage}%)` : null,
      icon: TrendingUp,
      gradient: 'bg-gradient-to-r from-slate-600 to-slate-700',
    },
    {
      title: 'ROAS',
      value: `${overallRoas.toFixed(2)}x`,
      subtitle: null,
      icon: Target,
      gradient: overallRoas >= 1 
        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' 
        : 'bg-gradient-to-r from-rose-500 to-rose-600',
    },
    {
      title: 'Lucro Bruto',
      value: `R$ ${formatNumber(totalProfit)}`,
      subtitle: null,
      icon: Wallet,
      gradient: totalProfit >= 0 
        ? 'bg-gradient-to-r from-teal-500 to-teal-600' 
        : 'bg-gradient-to-r from-amber-500 to-amber-600',
    },
    ...(isCurrentMonth ? [
      {
        title: 'Projeção Receita',
        value: `R$ ${formatNumber(projectedRevenue)}`,
        subtitle: null,
        icon: ArrowUpRight,
        gradient: 'bg-gradient-to-r from-violet-500 to-violet-600',
      },
      {
        title: 'Projeção Lucro',
        value: `R$ ${formatNumber(projectedProfit)}`,
        subtitle: null,
        icon: ArrowUpRight,
        gradient: projectedProfit >= 0 
          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' 
          : 'bg-gradient-to-r from-rose-500 to-rose-600',
      },
    ] : []),
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index} 
              className={`${card.gradient} text-white border-0 shadow-sm`}
            >
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium opacity-90">{card.title}</span>
                  <Icon className="h-3 w-3 opacity-70" />
                </div>
                <div className="text-sm font-semibold truncate">{card.value}</div>
                {card.subtitle && (
                  <div className="text-[9px] opacity-75 whitespace-nowrap">{card.subtitle}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: 4 colunas normais, 6 colunas quando tem projeção
  const gridCols = isCurrentMonth ? 'grid-cols-6' : 'grid-cols-4';

  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`${card.gradient} text-white border-0 shadow-md rounded-lg overflow-hidden`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium opacity-90">{card.title}</span>
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <div className="text-lg font-semibold">{card.value}</div>
              {card.subtitle && (
                <div className="text-[10px] opacity-75 mt-0.5 whitespace-nowrap">{card.subtitle}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
