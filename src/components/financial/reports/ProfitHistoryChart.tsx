
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface ProfitHistoryChartProps {
  allReceivables: AccountReceivable[];
  allPayables: AccountPayable[];
  distributionCategoryId: string | null;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  lucroAntes: number;
  lucroApos: number;
  distribuicao: number;
}

export const ProfitHistoryChart = ({
  allReceivables,
  allPayables,
  distributionCategoryId
}: ProfitHistoryChartProps) => {
  const isMobile = useIsMobile();

  // Calculate data for the last 6 completed months (excluding current month)
  const getMonthlyData = (): MonthlyData[] => {
    const data: MonthlyData[] = [];
    const now = new Date();
    
    // Start from 6 months ago, end at last month (excluding current month)
    for (let i = 6; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      
      // Filter receivables for this month (by due_date, must be received)
      const monthReceivables = allReceivables.filter(r => {
        if (!r.is_received) return false;
        const dueDate = new Date(r.due_date + 'T12:00:00');
        return String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
               String(dueDate.getFullYear()) === year;
      });
      
      // Filter payables for this month (by due_date, must be paid)
      const monthPayables = allPayables.filter(p => {
        if (!p.is_paid || !p.paid_date) return false;
        const dueDate = new Date(p.due_date + 'T12:00:00');
        return String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
               String(dueDate.getFullYear()) === year;
      });
      
      const totalReceivables = monthReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalPayables = monthPayables.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Calculate distribution amount
      const distributionAmount = distributionCategoryId
        ? monthPayables
            .filter(p => p.category_id === distributionCategoryId)
            .reduce((sum, p) => sum + Number(p.amount), 0)
        : 0;
      
      const lucroApos = totalReceivables - totalPayables;
      const lucroAntes = totalReceivables - (totalPayables - distributionAmount);
      
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      data.push({
        month: `${year}-${month}`,
        monthLabel: `${monthNames[date.getMonth()]}/${year.slice(2)}`,
        lucroAntes,
        lucroApos,
        distribuicao: distributionAmount
      });
    }
    
    // Excluir setembro/2025 (mês inicial)
    return data.filter(d => d.month !== '2025-09');
  };

  const monthlyData = getMonthlyData();

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
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
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

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardHeader className={`${isMobile ? 'pb-2' : 'pb-4'}`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Evolução do Lucro - Últimos 6 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData}
              margin={{
                top: 10,
                right: isMobile ? 10 : 30,
                left: isMobile ? -20 : 0,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient id="colorLucroAntes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLucroApos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDistribuicao" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                className="fill-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                className="fill-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="lucroAntes"
                name="Lucro Antes Dist."
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLucroAntes)"
              />
              <Area
                type="monotone"
                dataKey="lucroApos"
                name="Lucro Após Dist."
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLucroApos)"
              />
              <Area
                type="monotone"
                dataKey="distribuicao"
                name="Distribuição"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDistribuicao)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela com dados detalhados */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-violet-500/10">
                <TableHead className="text-left font-semibold">Mês</TableHead>
                <TableHead className="text-right font-semibold">Lucro Antes Dist.</TableHead>
                <TableHead className="text-right font-semibold">Distribuição</TableHead>
                <TableHead className="text-right font-semibold">Lucro Após Dist.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((data) => (
                <TableRow key={data.month}>
                  <TableCell className="font-medium">{data.monthLabel}</TableCell>
                  <TableCell className="text-right text-violet-600 dark:text-violet-400">
                    {formatCurrency(data.lucroAntes)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600 dark:text-amber-400">
                    {formatCurrency(data.distribuicao)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${data.lucroApos >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.lucroApos)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
