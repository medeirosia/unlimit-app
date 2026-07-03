
import { Mentorship, MentorshipPayment } from '@/types/dashboard';
import { MentorshipSection } from './MentorshipSection';

interface MentorshipTableProps {
  unscheduledPendingMentorships: Mentorship[];
  monthlyDuePayments: { mentorship: Mentorship; payment: MentorshipPayment }[];
  monthlySoldMentorships: Mentorship[];
  selectedMonth: number;
  selectedYear: number;
  unscheduledOpen: boolean;
  monthlyDueOpen: boolean;
  monthlySoldOpen: boolean;
  onUnscheduledOpenChange: (open: boolean) => void;
  onMonthlyDueOpenChange: (open: boolean) => void;
  onMonthlySoldOpenChange: (open: boolean) => void;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
  onDeleteMentorship: (mentorshipId: string) => void;
  onAddPayment: (mentorshipId: string, payment: any) => void;
}

export const MentorshipTable = ({
  unscheduledPendingMentorships,
  monthlyDuePayments,
  monthlySoldMentorships,
  unscheduledOpen,
  monthlyDueOpen,
  monthlySoldOpen,
  onUnscheduledOpenChange,
  onMonthlyDueOpenChange,
  onMonthlySoldOpenChange,
  onUpdateMentorship,
  onDeleteMentorship,
  onAddPayment,
  onReceivePayment
}: MentorshipTableProps & { onReceivePayment?: (paymentId: string) => void }) => {
  return (
    <div className="space-y-4">
      <MentorshipSection
        title="🚨 Pendente Não Agendado"
        mentorships={unscheduledPendingMentorships}
        isOpen={unscheduledOpen}
        onOpenChange={onUnscheduledOpenChange}
        showUnscheduledColumn={true}
        showDeleteButton={false}
        emptyMessage="Nenhuma mentoria pendente não agendada"
        onUpdateMentorship={onUpdateMentorship}
        onDeleteMentorship={onDeleteMentorship}
        onAddPayment={onAddPayment}
      />

      <MentorshipSection
        title="📅 Vencimentos do Mês"
        mentorships={[]}
        monthlyPayments={monthlyDuePayments}
        isOpen={monthlyDueOpen}
        onOpenChange={onMonthlyDueOpenChange}
        showUnscheduledColumn={false}
        showDeleteButton={false}
        showDueDateColumn={true}
        emptyMessage="Nenhum vencimento este mês"
        onUpdateMentorship={onUpdateMentorship}
        onDeleteMentorship={onDeleteMentorship}
        onReceivePayment={onReceivePayment}
      />

      <MentorshipSection
        title="💰 Vendidas no Mês"
        mentorships={monthlySoldMentorships}
        isOpen={monthlySoldOpen}
        onOpenChange={onMonthlySoldOpenChange}
        showUnscheduledColumn={false}
        showDeleteButton={true}
        emptyMessage="Nenhuma mentoria vendida este mês"
        onUpdateMentorship={onUpdateMentorship}
        onDeleteMentorship={onDeleteMentorship}
      />
    </div>
  );
};
