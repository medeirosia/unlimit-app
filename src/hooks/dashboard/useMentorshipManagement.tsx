
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mentorship } from '@/types/dashboard';
import { toast } from 'sonner';

export const useMentorshipManagement = () => {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);

  const fetchMentorships = async () => {
    try {
      const { data: mentorshipsData, error: mentorshipsError } = await supabase
        .from('mentorias')
        .select('*')
        .order('data_venda', { ascending: false });

      if (mentorshipsError) throw mentorshipsError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('mentoria_pagamentos')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (paymentsError) throw paymentsError;

      const mentorshipsWithPayments = mentorshipsData?.map(mentorship => {
        const payments = paymentsData?.filter(payment => payment.mentoria_id === mentorship.id) || [];
        
        return {
          id: mentorship.id,
          project: mentorship.projeto as 'matheus' | 'kenneth',
          clientName: mentorship.nome_cliente,
          totalValue: Number(mentorship.valor_total),
          receivedValue: Number(mentorship.valor_recebido),
          pendingValue: Number(mentorship.valor_pendente),
          date: mentorship.data_venda,
          observations: mentorship.observacoes || '',
          payments: payments.map(payment => ({
            id: payment.id,
            amount: Number(payment.valor),
            dueDate: payment.data_vencimento,
            receivedDate: payment.data_recebimento,
            status: payment.status as 'pendente' | 'recebido'
          }))
        };
      }) || [];

      setMentorships(mentorshipsWithPayments);
    } catch (error) {
      console.error('Erro ao buscar mentorias:', error);
      toast.error('Erro ao carregar mentorias');
    }
  };

  useEffect(() => {
    fetchMentorships();
  }, []);

  const addMentorship = async (mentorshipData: Omit<Mentorship, 'id' | 'pendingValue' | 'payments'>) => {
    try {
      const { data, error } = await supabase
        .from('mentorias')
        .insert({
          projeto: mentorshipData.project,
          nome_cliente: mentorshipData.clientName,
          valor_total: mentorshipData.totalValue,
          valor_recebido: mentorshipData.receivedValue,
          data_venda: mentorshipData.date,
          observacoes: mentorshipData.observations
        })
        .select()
        .single();

      if (error) throw error;

      // Se foi recebido algum valor na venda, criar lançamento
      if (mentorshipData.receivedValue > 0) {
        await supabase
          .from('lancamentos')
          .insert({
            descricao: `Mentoria - ${mentorshipData.clientName}`,
            tipo: 'revenue',
            valor: mentorshipData.receivedValue,
            categoria: mentorshipData.project,
            data_lancamento: mentorshipData.date
          });

        // Também criar registro no histórico de mentorias
        await supabase
          .from('mentoria_historico')
          .insert({
            mentoria_id: data.id,
            tipo: 'venda_inicial',
            valor: mentorshipData.receivedValue,
            data_transacao: mentorshipData.date,
            descricao: `Venda inicial - ${mentorshipData.clientName} (${mentorshipData.project})`
          });
      }

      await fetchMentorships();
      toast.success('Mentoria adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar mentoria:', error);
      toast.error('Erro ao adicionar mentoria');
    }
  };

  const updateMentorship = async (mentorshipId: string, updatedMentorship: Mentorship) => {
    try {
      const { error } = await supabase
        .from('mentorias')
        .update({
          projeto: updatedMentorship.project,
          nome_cliente: updatedMentorship.clientName,
          valor_total: updatedMentorship.totalValue,
          valor_recebido: updatedMentorship.receivedValue,
          data_venda: updatedMentorship.date,
          observacoes: updatedMentorship.observations
        })
        .eq('id', mentorshipId);

      if (error) throw error;

      await fetchMentorships();
      toast.success('Mentoria atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar mentoria:', error);
      toast.error('Erro ao atualizar mentoria');
    }
  };

  const deleteMentorship = async (mentorshipId: string) => {
    try {
      // Deletar histórico primeiro
      await supabase
        .from('mentoria_historico')
        .delete()
        .eq('mentoria_id', mentorshipId);

      // Deletar pagamentos
      await supabase
        .from('mentoria_pagamentos')
        .delete()
        .eq('mentoria_id', mentorshipId);

      // Deletar a mentoria
      const { error } = await supabase
        .from('mentorias')
        .delete()
        .eq('id', mentorshipId);

      if (error) throw error;

      await fetchMentorships();
      toast.success('Mentoria deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar mentoria:', error);
      toast.error('Erro ao deletar mentoria');
    }
  };

  const addPaymentToMentorship = async (mentorshipId: string, payment: any) => {
    try {
      const { error } = await supabase
        .from('mentoria_pagamentos')
        .insert({
          mentoria_id: mentorshipId,
          valor: payment.amount,
          data_vencimento: payment.dueDate,
          status: 'pendente'
        });

      if (error) throw error;

      await fetchMentorships();
      toast.success('Pagamento agendado com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar pagamento:', error);
      toast.error('Erro ao agendar pagamento');
    }
  };

  const receivePayment = async (paymentId: string) => {
    try {
      // Buscar dados do pagamento
      const { data: payment, error: paymentError } = await supabase
        .from('mentoria_pagamentos')
        .select('*, mentorias(*)')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      const today = new Date().toISOString().split('T')[0];

      // Atualizar o pagamento
      const { error: updateError } = await supabase
        .from('mentoria_pagamentos')
        .update({
          status: 'recebido',
          data_recebimento: today
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Atualizar valor recebido na mentoria
      const newReceivedValue = Number(payment.mentorias.valor_recebido) + Number(payment.valor);
      
      const { error: mentorshipError } = await supabase
        .from('mentorias')
        .update({
          valor_recebido: newReceivedValue
        })
        .eq('id', payment.mentoria_id);

      if (mentorshipError) throw mentorshipError;

      // Criar lançamento para o pagamento recebido
      await supabase
        .from('lancamentos')
        .insert({
          descricao: `Mentoria - ${payment.mentorias.nome_cliente}`,
          tipo: 'revenue',
          valor: payment.valor,
          categoria: payment.mentorias.projeto,
          data_lancamento: today
        });

      // Também criar registro no histórico de mentorias
      await supabase
        .from('mentoria_historico')
        .insert({
          mentoria_id: payment.mentoria_id,
          tipo: 'pagamento_agendado',
          valor: payment.valor,
          data_transacao: today,
          descricao: `Recebimento Mentoria - ${payment.mentorias.nome_cliente} (${payment.mentorias.projeto})`
        });

      await fetchMentorships();
      toast.success('Pagamento recebido com sucesso!');
    } catch (error) {
      console.error('Erro ao receber pagamento:', error);
      toast.error('Erro ao receber pagamento');
    }
  };

  return {
    mentorships,
    addMentorship,
    updateMentorship,
    deleteMentorship,
    addPaymentToMentorship,
    receivePayment,
  };
};
