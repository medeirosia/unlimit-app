
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PendingWithdrawal } from '@/hooks/financial/usePendingWithdrawals';

interface WithdrawalCardProps {
  withdrawal: PendingWithdrawal;
  loading: boolean;
  onConfirm: (withdrawal: PendingWithdrawal) => void;
  onDelete: (withdrawal: PendingWithdrawal) => void;
}

export const WithdrawalCard = ({ withdrawal, loading, onConfirm, onDelete }: WithdrawalCardProps) => {
  return (
    <Card key={withdrawal.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">
            {withdrawal.description}
          </CardTitle>
          <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
            Pendente
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Fluxo de Transferência */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">De</span>
            <span className="font-medium text-slate-800">{withdrawal.from_account?.name || 'N/A'}</span>
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-400" />
          
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">Para</span>
            <span className="font-medium text-slate-800">{withdrawal.to_account?.name || 'N/A'}</span>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valor Sacado - Destaque Principal */}
          <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Valor Sacado</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              R$ {withdrawal.amount.toFixed(2)}
            </div>
          </div>

          {/* Informações Secundárias */}
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Data</span>
              </div>
              <span className="text-sm text-blue-800">
                {format(new Date(withdrawal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Taxa</span>
              </div>
              <span className="text-sm font-medium text-red-800">
                R$ {withdrawal.fee_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button 
            onClick={() => onDelete(withdrawal)}
            disabled={loading}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'Processando...' : 'Apagar'}
          </Button>
          <Button 
            onClick={() => onConfirm(withdrawal)}
            disabled={loading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Processando...' : 'Confirmar Saque'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
