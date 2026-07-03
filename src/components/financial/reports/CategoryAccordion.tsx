
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatDateString } from '@/utils/dateUtils';
import { Receipt, Calendar, CheckCircle2, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryData {
  category: string;
  total: number;
  count: number;
  transactions: any[];
}

interface CategoryAccordionProps {
  data: CategoryData[];
  type: 'revenue' | 'expense';
  emptyMessage: string;
  totalRevenue?: number;
  totalAmount?: number;
}

export const CategoryAccordion = ({ data, type, emptyMessage, totalRevenue, totalAmount = 0 }: CategoryAccordionProps) => {
  const isMobile = useIsMobile();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <Card className="border border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Receipt className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColorClasses = () => {
    return type === 'revenue' 
      ? { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-100' }
      : { text: 'text-rose-600', bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-100' };
  };

  const colors = getColorClasses();

  return (
    <div className="space-y-2">
      {data.map((categoryData, index) => {
        // Para despesas, usa o faturamento (totalRevenue) como base; para receitas, usa o total de receitas
        const percentageBase = type === 'expense' && totalRevenue && totalRevenue > 0 
          ? totalRevenue 
          : totalAmount;
        const percentage = percentageBase > 0 ? (categoryData.total / percentageBase) * 100 : 0;
        const percentageLabel = type === 'expense' ? 'do faturamento' : 'do total';
        
        // Calcular ROAS para categoria "Tráfego Pago"
        const isTraffic = categoryData.category.toLowerCase().includes('tráfego pago') || 
                          categoryData.category.toLowerCase().includes('trafego pago');
        const roas = isTraffic && categoryData.total > 0 && totalRevenue && totalRevenue > 0
          ? totalRevenue / categoryData.total
          : null;
        
        // Classificar ROAS
        const getRoasClassification = (roasValue: number) => {
          if (roasValue >= 3) return { label: 'Excelente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
          if (roasValue >= 2) return { label: 'Bom', color: 'bg-blue-100 text-blue-700 border-blue-200' };
          if (roasValue >= 1) return { label: 'Regular', color: 'bg-amber-100 text-amber-700 border-amber-200' };
          return { label: 'Baixo', color: 'bg-red-100 text-red-700 border-red-200' };
        };

        return (
          <Card key={index} className={`border ${colors.border} shadow-sm overflow-hidden`}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={`item-${index}`} className="border-0">
                <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-1.5 h-8 rounded-full ${colors.bg} flex-shrink-0`} />
                        <div className="text-left min-w-0">
                          <h3 className={`font-medium text-slate-800 truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                            {categoryData.category}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {categoryData.count} {categoryData.count === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className={`font-bold ${colors.text} ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {formatCurrency(categoryData.total)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {percentage.toFixed(1)}% {percentageLabel}
                        </div>
                      </div>
                    </div>
                    
                    {/* ROAS Indicator para Tráfego Pago */}
                    {isTraffic && roas !== null && (
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
                        <Target className="h-4 w-4 text-violet-600 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-violet-800">
                            ROAS: <span className="font-bold">{roas.toFixed(2)}x</span>
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 ${getRoasClassification(roas).color}`}
                          >
                            {getRoasClassification(roas).label}
                          </Badge>
                          <span className="text-[10px] text-slate-500">
                            (R$ {roas.toFixed(2)} retorno p/ cada R$ 1 investido)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="w-full pr-6">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-2 mt-2">
                    {categoryData.transactions.map((transaction, transIndex) => (
                      <div 
                        key={transIndex} 
                        className={`flex items-center justify-between p-2.5 rounded-lg ${colors.light} border ${colors.border}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-slate-800 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {formatDateString(transaction.due_date)}
                            </span>
                            {type === 'revenue' && transaction.received_date && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                {formatDateString(transaction.received_date)}
                              </span>
                            )}
                            {type === 'expense' && transaction.paid_date && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                {formatDateString(transaction.paid_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`font-bold flex-shrink-0 ml-2 ${colors.text} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        );
      })}
    </div>
  );
};
