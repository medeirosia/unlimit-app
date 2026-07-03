
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Target } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AccountPayable {
  id: string;
  amount: number;
  category_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  expense_categories?: { name: string };
}

interface AccountReceivable {
  id: string;
  amount: number;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
}

interface RoasHistoryChartProps {
  allReceivables: AccountReceivable[];
  allPayables: AccountPayable[];
  trafegoCategories: string[];
}

interface MonthlyRoasData {
  month: string;
  monthLabel: string;
  roas: number;
  revenue: number;
  adSpend: number;
}

export const RoasHistoryChart = ({
  allReceivables,
  allPayables,
  trafegoCategories
}: RoasHistoryChartProps) => {
  const isMobile = useIsMobile();

  const getMonthlyData = (): MonthlyRoasData[] => {
    const data: MonthlyRoasData[] = [];
    const now = new Date();

    for (let i = 6; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());

      const monthReceivables = allReceivables.filter(r => {
        if (!r.is_received) return false;
        const dueDate = new Date(r.due_date + 'T12:00:00');
        return String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
               String(dueDate.getFullYear()) === year;
      });

      const monthAdSpend = allPayables.filter(p => {
        if (!p.is_paid || !p.paid_date) return false;
        const dueDate = new Date(p.due_date + 'T12:00:00');
        const matchesPeriod = String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
                              String(dueDate.getFullYear()) === year;
        const isTrafego = trafegoCategories.includes(p.category_id);
        return matchesPeriod && isTrafego;
      });

      const revenue = monthReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
      const adSpend = monthAdSpend.reduce((sum, p) => sum + Number(p.amount), 0);
      const roas = adSpend > 0 ? revenue / adSpend : 0;

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      data.push({
        month: `${year}-${month}`,
        monthLabel: `${monthNames[date.getMonth()]}/${year.slice(2)}`,
        roas: Number(roas.toFixed(2)),
        revenue,
        adSpend
      });
    }

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

  const getRoasColor = (roas: number) => {
    if (roas >= 3) return 'text-emerald-600 dark:text-emerald-400';
    if (roas >= 2) return 'text-blue-600 dark:text-blue-400';
    if (roas >= 1) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRoasLabel = (roas: number) => {
    if (roas >= 3) return 'Excelente';
    if (roas >= 2) return 'Bom';
    if (roas >= 1) return 'Regular';
    return 'Baixo';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlyRoasData;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <p className="text-sm text-orange-500 font-medium">
            ROAS: {data.roas.toFixed(2)}x ({getRoasLabel(data.roas)})
          </p>
          <p className="text-sm text-muted-foreground">
            Faturamento: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-muted-foreground">
            Investimento: {formatCurrency(data.adSpend)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (monthlyData.every(d => d.adSpend === 0)) return null;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader className={`${isMobile ? 'pb-2' : 'pb-4'}`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
            <Target className="h-4 w-4 text-white" />
          </div>
          Evolução do ROAS - Últimos 6 Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monthlyData}
              margin={{
                top: 10,
                right: isMobile ? 10 : 30,
                left: isMobile ? -20 : 0,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) => `${value}x`}
                className="fill-muted-foreground"
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} iconType="circle" />
              <ReferenceLine y={2} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '2x', position: 'right', fontSize: 10, fill: '#3b82f6' }} />
              <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: '3x', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <Line
                type="monotone"
                dataKey="roas"
                name="ROAS"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-500/10">
                <TableHead className="text-left font-semibold">Mês</TableHead>
                <TableHead className="text-right font-semibold">Faturamento</TableHead>
                <TableHead className="text-right font-semibold">Investimento</TableHead>
                <TableHead className="text-right font-semibold">ROAS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((data) => (
                <TableRow key={data.month}>
                  <TableCell className="font-medium">{data.monthLabel}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(data.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(data.adSpend)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${getRoasColor(data.roas)}`}>
                    {data.roas > 0 ? `${data.roas.toFixed(2)}x` : '—'}
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
