
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface MentorshipSummaryCardsProps {
  monthlyPendingBalance: number;
  monthlyUnscheduledBalance: number;
  monthlyReceivedTotal: number;
  monthlySoldTotal: number;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2 
  });
};

export const MentorshipSummaryCards = ({
  monthlyPendingBalance,
  monthlyUnscheduledBalance,
  monthlyReceivedTotal,
  monthlySoldTotal
}: MentorshipSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-orange-50 border-orange-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-800">Saldo Pendente (Mês)</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-800">
            {formatCurrency(monthlyPendingBalance)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-50 border-red-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Não Agendado</CardTitle>
          <Clock className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-800">
            {formatCurrency(monthlyUnscheduledBalance)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Total Recebido (Histórico)</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">
            {formatCurrency(monthlyReceivedTotal)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-purple-50 border-purple-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">📈 Valor Vendido no Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-800">
            {formatCurrency(monthlySoldTotal)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
