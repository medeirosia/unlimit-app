
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BadgeDollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReportsSummaryCardsProps {
  totalReceivables: number;
  totalPayables: number;
  receivablesCount: number;
  payablesCount: number;
  distributionAmount?: number;
}

export const ReportsSummaryCards = ({
  totalReceivables,
  totalPayables,
  receivablesCount,
  payablesCount,
  distributionAmount = 0
}: ReportsSummaryCardsProps) => {
  const isMobile = useIsMobile();
  
  // Lucro após distribuição (saldo atual)
  const saldoPeriodo = totalReceivables - totalPayables;
  
  // Lucro antes da distribuição (despesas sem a distribuição de lucros)
  const lucroAntesDistribuicao = totalReceivables - (totalPayables - distributionAmount);
  
  const margemLucroLiquida = totalReceivables > 0 ? (saldoPeriodo / totalReceivables) * 100 : 0;
  const margemAntesDistribuicao = totalReceivables > 0 ? (lucroAntesDistribuicao / totalReceivables) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Cards principais: Receitas e Despesas */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2'} gap-3`}>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg overflow-hidden">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-emerald-100 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Total de Receitas
              </span>
              <TrendingUp className={`text-emerald-200 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {formatCurrency(totalReceivables)}
            </div>
            <p className={`text-emerald-200 mt-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {receivablesCount} recebimento{receivablesCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 border-0 shadow-lg overflow-hidden">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-rose-100 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Total de Despesas
              </span>
              <TrendingDown className={`text-rose-200 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {formatCurrency(totalPayables)}
            </div>
            <p className={`text-rose-200 mt-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
              {payablesCount} pagamento{payablesCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Lucro: Antes e Após Distribuição */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
        {/* Lucro Antes da Distribuição */}
        <Card className={`${lucroAntesDistribuicao >= 0 ? 'bg-gradient-to-br from-violet-500 to-violet-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'} border-0 shadow-lg overflow-hidden`}>
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${lucroAntesDistribuicao >= 0 ? 'text-violet-100' : 'text-orange-100'} font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Lucro Antes da Distribuição
              </span>
              <PiggyBank className={`${lucroAntesDistribuicao >= 0 ? 'text-violet-200' : 'text-orange-200'} ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div className={`flex ${isMobile ? 'items-center justify-between' : 'flex-col'}`}>
              <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {formatCurrency(lucroAntesDistribuicao)}
              </div>
              <div className={`${isMobile ? '' : 'mt-2'} px-2 py-1 rounded-full ${lucroAntesDistribuicao >= 0 ? 'bg-violet-400/30' : 'bg-orange-400/30'}`}>
                <span className={`text-white font-semibold ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  Margem: {margemAntesDistribuicao.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Lucros */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-lg overflow-hidden">
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-amber-100 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Distribuição de Lucros
              </span>
              <BadgeDollarSign className={`text-amber-200 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div className={`flex ${isMobile ? 'items-center justify-between' : 'flex-col'}`}>
              <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {formatCurrency(distributionAmount)}
              </div>
              <div className={`${isMobile ? '' : 'mt-2'} px-2 py-1 rounded-full bg-amber-400/30`}>
                <span className={`text-white font-semibold ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  {totalReceivables > 0 ? ((distributionAmount / totalReceivables) * 100).toFixed(1) : 0}% da receita
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Após Distribuição (Saldo Final) */}
        <Card className={`${saldoPeriodo >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'} border-0 shadow-lg overflow-hidden`}>
          <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${saldoPeriodo >= 0 ? 'text-blue-100' : 'text-red-100'} font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Lucro Após Distribuição
              </span>
              <Wallet className={`${saldoPeriodo >= 0 ? 'text-blue-200' : 'text-red-200'} ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            <div className={`flex ${isMobile ? 'items-center justify-between' : 'flex-col'}`}>
              <div className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {formatCurrency(saldoPeriodo)}
              </div>
              <div className={`${isMobile ? '' : 'mt-2'} px-2 py-1 rounded-full ${saldoPeriodo >= 0 ? 'bg-blue-400/30' : 'bg-red-400/30'}`}>
                <span className={`text-white font-semibold ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                  Margem: {margemLucroLiquida.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
