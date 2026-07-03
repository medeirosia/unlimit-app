
import { Mentorship } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';

interface MentorshipTransactionHandlerProps {
  mentorships: Mentorship[];
  onUpdateMentorship?: (mentorshipId: string, updatedMentorship: Mentorship) => void;
}

export const useMentorshipTransactionHandler = ({ 
  mentorships, 
  onUpdateMentorship 
}: MentorshipTransactionHandlerProps) => {
  
  const handleUndoMentorshipTransaction = async (transactionId: string) => {
    console.log('Attempting to undo transaction:', transactionId);
    
    try {
      if (transactionId.startsWith('mentorship-payment-')) {
        const paymentId = transactionId.replace('mentorship-payment-', '');
        
        // Find the mentorship with this payment
        const mentorship = mentorships.find(m => 
          m.payments?.some(p => p.id === paymentId)
        );
        
        if (mentorship && onUpdateMentorship) {
          const payment = mentorship.payments?.find(p => p.id === paymentId);
          if (payment) {
            console.log('Undoing payment:', payment);
            
            // Update payment status to pending and remove received date
            await supabase
              .from('mentoria_pagamentos')
              .update({
                status: 'pendente',
                data_recebimento: null
              })
              .eq('id', paymentId);
            
            // Recalculate values in mentorship
            const newReceivedValue = mentorship.receivedValue - payment.amount;
            const newPendingValue = mentorship.pendingValue + payment.amount;
            
            await supabase
              .from('mentorias')
              .update({
                valor_recebido: newReceivedValue
              })
              .eq('id', mentorship.id);
            
            // Remove from mentorship history
            await supabase
              .from('mentoria_historico')
              .delete()
              .eq('mentoria_id', mentorship.id)
              .eq('tipo', 'pagamento_agendado')
              .eq('valor', payment.amount);
            
            const updatedMentorship = {
              ...mentorship,
              receivedValue: newReceivedValue,
              pendingValue: newPendingValue,
              payments: mentorship.payments?.map(p => 
                p.id === paymentId 
                  ? { ...p, status: 'pendente' as const, receivedDate: undefined }
                  : p
              ) || []
            };
            
            console.log('Updated mentorship after undoing payment:', updatedMentorship);
            onUpdateMentorship(mentorship.id, updatedMentorship);
          }
        }
      } else if (transactionId.startsWith('mentorship-sale-')) {
        const mentorshipId = transactionId.replace('mentorship-sale-', '');
        
        // Find the mentorship with this ID
        const mentorship = mentorships.find(m => m.id === mentorshipId);
        
        if (mentorship && onUpdateMentorship) {
          console.log('Undoing sale for mentorship:', mentorship);
          
          // Reset receivedValue to 0 (undoing the initial sale)
          await supabase
            .from('mentorias')
            .update({
              valor_recebido: 0
            })
            .eq('id', mentorshipId);
          
          // Remove from mentorship history
          await supabase
            .from('mentoria_historico')
            .delete()
            .eq('mentoria_id', mentorshipId)
            .eq('tipo', 'venda_inicial');
          
          const updatedMentorship = {
            ...mentorship,
            receivedValue: 0,
            pendingValue: mentorship.totalValue
          };
          
          console.log('Updated mentorship after undoing sale:', updatedMentorship);
          onUpdateMentorship(mentorship.id, updatedMentorship);
        }
      }
    } catch (error) {
      console.error('Erro ao desfazer transação de mentoria:', error);
    }
  };

  return { handleUndoMentorshipTransaction };
};
