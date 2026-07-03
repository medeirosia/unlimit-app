
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export const PendingWithdrawalsEmpty = () => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Nenhum saque pendente
        </h3>
        <p className="text-slate-500 text-center">
          Todos os saques foram processados
        </p>
      </CardContent>
    </Card>
  );
};
