
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountReceivable {
  id: string;
  amount: number;
  is_received: boolean;
  received_date: string | null;
}

interface AccountPayable {
  id: string;
  amount: number;
  is_paid: boolean;
  paid_date: string | null;
}

interface CashBalanceHistoryChartProps {
  allReceivables: AccountReceivable[];
  allPayables: AccountPayable[];
  currentTotalBalance: number;
}

interface MonthlyBalanceData {
  month: string;
  saldo: number;
}

export const CashBalanceHistoryChart = ({
  allReceivables,
  allPayables,
  currentTotalBalance
}: CashBalanceHistoryChartProps) => {
  const isMobile = useIsMobile();

  const getMonthlyBalanceData = (): MonthlyBalanceData[] => {
    const now = new Date();
    
    // Calculate net income for each of the last 6 months
    const monthlyNetIncome: { month: number; year: number; netIncome: number; monthName: string }[] = [];
    
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      const monthName = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthRevenue = allReceivables
        .filter(r => {
          if (!r.is_received || !r.received_date) return false;
          const date = new Date(r.received_date + 'T12:00:00');
          return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0);
      
      const monthExpenses = allPayables
        .filter(p => {
          if (!p.is_paid || !p.paid_date) return false;
          const date = new Date(p.paid_date + 'T12:00:00');
          return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      monthlyNetIncome.push({
        month: targetMonth,
        year: targetYear,
        netIncome: monthRevenue - monthExpenses,
        monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1)
      });
    }
    
    // Calculate balances backward from current balance
    const months: MonthlyBalanceData[] = [];
    let balance = currentTotalBalance;
    
    for (let i = 0; i < monthlyNetIncome.length; i++) {
      const data = monthlyNetIncome[i];
      
      if (i === 0) {
        // Current month: use actual current balance
        months.unshift({ month: data.monthName, saldo: balance });
      } else {
        // Previous months: subtract next month's net income to get this month's ending balance
        balance = balance - monthlyNetIncome[i - 1].netIncome;
        months.unshift({ month: data.monthName, saldo: balance });
      }
    }
    
    return months;
  };

  const monthlyData = getMonthlyBalanceData();

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
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-slate-700 mb-2">{label}</p>
          <p className="text-emerald-600">
            <span className="font-medium">Saldo Acumulado:</span> {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolução do Saldo em Caixa - Últimos 6 Meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: isMobile ? -20 : 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              stroke="#94a3b8"
            />
            <YAxis 
              tickFormatter={(value) => isMobile ? `${(value/1000).toFixed(0)}k` : formatCurrency(value)}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              stroke="#94a3b8"
              width={isMobile ? 40 : 80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="saldo" 
              name="Saldo Acumulado"
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorSaldo)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
