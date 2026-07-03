
import { Button } from '@/components/ui/button';
import { Trash2, Check } from 'lucide-react';
import { Mentorship, MentorshipPayment } from '@/types/dashboard';
import { PaymentDialog } from './PaymentDialog';
import { MentorshipEditDialog } from './MentorshipEditDialog';
import { formatCurrency, formatDate, getUnscheduledAmount } from './utils/mentorshipUtils';

interface MentorshipTableRowProps {
  mentorship: Mentorship;
  payment?: MentorshipPayment;
  showUnscheduledColumn?: boolean;
  showActions?: boolean;
  showDeleteButton?: boolean;
  showDueDateColumn?: boolean;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
  onDeleteMentorship: (mentorshipId: string) => void;
  onAddPayment?: (mentorshipId: string, payment: any) => void;
  onReceivePayment?: (paymentId: string) => void;
}

export const MentorshipTableRow = ({
  mentorship,
  payment,
  showUnscheduledColumn = false,
  showActions = true,
  showDeleteButton = true,
  showDueDateColumn = false,
  onUpdateMentorship,
  onDeleteMentorship,
  onAddPayment,
  onReceivePayment
}: MentorshipTableRowProps) => {
  const unscheduledAmount = getUnscheduledAmount(mentorship);
  
  // Se é uma linha de vencimento do mês, usar o valor do pagamento específico
  const pendingValue = payment ? payment.amount : mentorship.pendingValue;

  const handleReceivePayment = () => {
    if (payment && onReceivePayment) {
      onReceivePayment(payment.id);
    }
  };

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm">{mentorship.clientName}</td>
      <td className="px-4 py-3 text-sm">{mentorship.project === 'matheus' ? 'Matheus' : 'Kenneth'}</td>
      <td className="px-4 py-3 text-sm font-medium text-green-600">
        {formatCurrency(mentorship.totalValue)}
      </td>
      <td className="px-4 py-3 text-sm text-green-700">
        {formatCurrency(mentorship.receivedValue)}
      </td>
      <td className="px-4 py-3 text-sm text-orange-600">
        {formatCurrency(pendingValue)}
      </td>
      <td className="px-4 py-3 text-sm">{formatDate(mentorship.date)}</td>
      {showDueDateColumn && payment && (
        <td className="px-4 py-3 text-sm font-medium text-blue-600">
          {payment.dueDate ? formatDate(payment.dueDate) : '-'}
        </td>
      )}
      {showUnscheduledColumn && (
        <td className="px-4 py-3 text-sm font-bold text-red-600">
          {formatCurrency(unscheduledAmount)}
        </td>
      )}
      {showActions && (
        <td className="px-4 py-3 text-sm">
          <div className="flex gap-2 items-center">
            {showUnscheduledColumn && onAddPayment ? (
              <PaymentDialog
                mentorship={mentorship}
                unscheduledAmount={unscheduledAmount}
                onAddPayment={onAddPayment}
                onClose={() => {}}
              />
            ) : (
              <>
                <MentorshipEditDialog
                  mentorship={mentorship}
                  onUpdateMentorship={onUpdateMentorship}
                />
                {payment && payment.status === 'pendente' && onReceivePayment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReceivePayment}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    title="Receber pagamento"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Receber
                  </Button>
                )}
                {payment && payment.status === 'recebido' && (
                  <div className="bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <Check className="h-3 w-3" />
                    Recebido
                  </div>
                )}
              </>
            )}
            {showDeleteButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteMentorship(mentorship.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
};
