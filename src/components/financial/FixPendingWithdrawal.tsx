import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';

export const FixPendingWithdrawal = () => {
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    
    try {
      console.log('🔧 Corrigindo saque pendente...');

      // ID do saque que precisa ser corrigido
      const withdrawalId = '3dead188-564b-4d37-bf83-021c83ede439';

      // Buscar o saque pendente
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('pending_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        toast.error('Saque não encontrado');
        return;
      }

      // VALIDAÇÃO: Verificar se o saque já foi completado
      if (withdrawal.is_completed) {
        toast.warning('Este saque já foi completado anteriormente');
        return;
      }

      // Verificar se já existe transação pendente
      const { data: existingTransaction } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('reference_id', withdrawalId)
        .eq('reference_type', 'withdrawal')
        .eq('type', 'transfer')
        .eq('status', 'pending')
        .maybeSingle();

      if (existingTransaction) {
        toast.info('Transação pendente já existe');
        return;
      }

      // Criar transação pendente no extrato
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert([{
          user_id: withdrawal.user_id,
          description: `Saque pendente - ${withdrawal.description}`,
          amount: withdrawal.amount,
          type: 'transfer',
          status: 'pending',
          from_account_id: withdrawal.from_account_id,
          to_account_id: withdrawal.to_account_id,
          is_platform_withdrawal: true,
          reference_id: withdrawal.id,
          reference_type: 'withdrawal',
          transaction_date: withdrawal.created_at
        }]);

      if (transactionError) {
        console.error('❌ Erro ao criar transação pendente:', transactionError);
        toast.error('Erro ao criar transação pendente');
        return;
      }

      console.log('✅ Transação pendente criada com sucesso');
      toast.success('Saque corrigido! A transação pendente foi criada no extrato.');

    } catch (error) {
      console.error('💥 Erro:', error);
      toast.error('Erro ao corrigir saque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleFix}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Wrench className="h-4 w-4" />
      {loading ? 'Corrigindo...' : 'Corrigir Saque'}
    </Button>
  );
};