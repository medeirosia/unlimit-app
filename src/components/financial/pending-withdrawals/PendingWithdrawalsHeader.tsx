
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { EmergencyBalanceRestore } from '../EmergencyBalanceRestore';
import { FixPendingWithdrawal } from '../FixPendingWithdrawal';
import type { BankAccount } from '@/types/financial';

interface PendingWithdrawalsHeaderProps {
  pendingCount: number;
  onRefresh: () => void;
  bankAccounts: BankAccount[];
  onDataChange: () => void;
}

export const PendingWithdrawalsHeader = ({ 
  pendingCount, 
  onRefresh, 
  bankAccounts, 
  onDataChange 
}: PendingWithdrawalsHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Saques Pendentes</h2>
        <p className="text-slate-600">
          {pendingCount} saque{pendingCount !== 1 ? 's' : ''} aguardando confirmação
        </p>
      </div>
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <FixPendingWithdrawal />
        <Button
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
        
        <EmergencyBalanceRestore 
          bankAccounts={bankAccounts}
          onDataChange={onDataChange}
        />
      </div>
    </div>
  );
};
