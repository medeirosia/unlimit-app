
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mentorship, MentorshipPayment } from '@/types/dashboard';
import { MentorshipTableHeader } from './MentorshipTableHeader';
import { MentorshipTableRow } from './MentorshipTableRow';

interface MentorshipSectionProps {
  title: string;
  mentorships: Mentorship[];
  monthlyPayments?: { mentorship: Mentorship; payment: MentorshipPayment }[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  showUnscheduledColumn?: boolean;
  showDeleteButton?: boolean;
  showDueDateColumn?: boolean;
  emptyMessage: string;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
  onDeleteMentorship: (mentorshipId: string) => void;
  onAddPayment?: (mentorshipId: string, payment: any) => void;
}

export const MentorshipSection = ({
  title,
  mentorships,
  monthlyPayments,
  isOpen,
  onOpenChange,
  showUnscheduledColumn = false,
  showDeleteButton = true,
  showDueDateColumn = false,
  emptyMessage,
  onUpdateMentorship,
  onDeleteMentorship,
  onAddPayment,
  onReceivePayment
}: MentorshipSectionProps & { onReceivePayment?: (paymentId: string) => void }) => {
  const itemsToShow = monthlyPayments || mentorships;
  const itemCount = monthlyPayments ? monthlyPayments.length : mentorships.length;

  return (
    <Card className="bg-white border-0 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50">
            <CardTitle className="text-lg text-slate-800 flex items-center justify-between">
              <span>{title} ({itemCount})</span>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {itemCount > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <MentorshipTableHeader 
                    showUnscheduledColumn={showUnscheduledColumn}
                    showActions={true}
                    showDueDateColumn={showDueDateColumn}
                  />
                  <tbody>
                    {monthlyPayments ? (
                      monthlyPayments.map((item, index) => (
                        <MentorshipTableRow
                          key={`${item.mentorship.id}-${item.payment.id}-${index}`}
                          mentorship={item.mentorship}
                          payment={item.payment}
                          showUnscheduledColumn={showUnscheduledColumn}
                          showActions={true}
                          showDeleteButton={showDeleteButton}
                          showDueDateColumn={showDueDateColumn}
                          onUpdateMentorship={onUpdateMentorship}
                          onDeleteMentorship={onDeleteMentorship}
                          onAddPayment={onAddPayment}
                          onReceivePayment={onReceivePayment}
                        />
                      ))
                    ) : (
                      mentorships.map((mentorship) => (
                        <MentorshipTableRow
                          key={mentorship.id}
                          mentorship={mentorship}
                          showUnscheduledColumn={showUnscheduledColumn}
                          showActions={true}
                          showDeleteButton={showDeleteButton}
                          showDueDateColumn={showDueDateColumn}
                          onUpdateMentorship={onUpdateMentorship}
                          onDeleteMentorship={onDeleteMentorship}
                          onAddPayment={onAddPayment}
                          onReceivePayment={onReceivePayment}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">{emptyMessage}</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
