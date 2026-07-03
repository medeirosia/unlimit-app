import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
}

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
}

interface MonthlyFlowChartProps {
  accountsReceivable: AccountReceivable[];
  accountsPayable: AccountPayable[];
  selectedMonth: string;
  selectedYear: string;
}

interface DailyData {
  day: number;
  dayLabel: string;
  entradas: number;
  saidas: number;
  resultado: number;
}

export const MonthlyFlowChart = ({
  accountsReceivable,
  accountsPayable,
  selectedMonth,
  selectedYear
}: MonthlyFlowChartProps) => {
  const isMobile = useIsMobile();

  const dailyData = useMemo(() => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Initialize data for each day
    const data: DailyData[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const monthStr = month.toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      
      // Sum receivables for this day (by due_date, only received ones)
      const dayReceivables = accountsReceivable
        .filter(r => {
          const dueDate = r.due_date?.split('T')[0];
          return dueDate === dateStr && r.is_received;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      // Sum payables for this day (by due_date, only paid ones)
      const dayPayables = accountsPayable
        .filter(p => {
          const dueDate = p.due_date?.split('T')[0];
          return dueDate === dateStr && p.is_paid;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      data.push({
        day,
        dayLabel: `${day}`,
        entradas: dayReceivables,
        saidas: dayPayables,
        resultado: dayReceivables - dayPayables
      });
    }
    
    return data;
  }, [accountsReceivable, accountsPayable, selectedMonth, selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">Dia {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getMonthName = () => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[parseInt(selectedMonth) - 1];
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg font-semibold text-foreground">
          Entradas e Saídas - {getMonthName()} {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "h-[250px]" : "h-[300px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData}
              margin={{
                top: 10,
                right: isMobile ? 10 : 30,
                left: isMobile ? -20 : 0,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResultado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval={isMobile ? 4 : 2}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }}
              />
              <Area
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorEntradas)"
              />
              <Area
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorSaidas)"
              />
              <Area
                type="monotone"
                dataKey="resultado"
                name="Resultado"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorResultado)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
