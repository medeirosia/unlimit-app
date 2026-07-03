
import { supabase } from '@/integrations/supabase/client';
import { BankAccount, FormData } from './types';
import { performRollback } from './rollbackUtils';

export const handleWithdrawal = async (
  formData: FormData, 
  bankAccounts: BankAccount[]
) => {
  const fromAccount = bankAccounts.find(acc => acc.id === formData.fromAccountId);
  
  if (!fromAccount) {
    throw new Error('Conta de origem não encontrada');
  }

  const totalAmount = formData.amount + formData.feeAmount;
  
  console.log('🚀 Iniciando processo de saque...');
  console.log('📋 Dados:', {
    fromAccountId: formData.fromAccountId,
    toAccountId: formData.toAccountId,
    amount: formData.amount,
    feeAmount: formData.feeAmount,
    description: formData.description,
    balanceOriginal: fromAccount.balance,
    totalAmount
  });

  const originalBalance = fromAccount.balance;
  let expenseId: string | undefined;
  let withdrawalId: string | undefined;

  try {
    // PASSO 1: Debitar valor total da conta de origem (permitindo saldo negativo)
    console.log('1️⃣ Debitando conta de origem...');
    const { error: debitError } = await supabase
      .from('bank_accounts')
      .update({ balance: originalBalance - totalAmount })
      .eq('id', formData.fromAccountId);

    if (debitError) {
      console.error('❌ Erro ao debitar conta:', debitError);
      throw new Error(`Erro ao debitar conta: ${debitError.message}`);
    }
    console.log('✅ Conta debitada com sucesso');

    // PASSO 2: Criar saque pendente
    console.log('2️⃣ Criando saque pendente...');
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('pending_withdrawals')
      .insert([{
        user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
        from_account_id: formData.fromAccountId,
        to_account_id: formData.toAccountId,
        amount: formData.amount,
        fee_amount: formData.feeAmount,
        description: formData.description || 'Saque de plataforma',
        is_completed: false
      }])
      .select('id')
      .single();

    if (withdrawalError) {
      console.error('❌ Erro ao criar saque pendente:', withdrawalError);
      await performRollback(formData.fromAccountId, originalBalance);
      throw new Error(`Erro ao criar saque pendente: ${withdrawalError.message}`);
    }
    
    withdrawalId = withdrawalData.id;
    console.log('✅ Saque pendente criado:', withdrawalData.id);

    // PASSO 3: Criar transação pendente no extrato
    console.log('3️⃣ Criando transação pendente no extrato...');
    const { error: transactionError } = await supabase
      .from('financial_transactions')
      .insert([{
        user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
        description: `Saque pendente - ${formData.description || 'Saque de plataforma'}`,
        amount: formData.amount,
        type: 'transfer',
        status: 'pending',
        from_account_id: formData.fromAccountId,
        to_account_id: formData.toAccountId,
        is_platform_withdrawal: true,
        reference_id: withdrawalData.id,
        reference_type: 'withdrawal'
      }]);

    if (transactionError) {
      console.error('❌ Erro ao criar transação pendente:', transactionError);
      await performRollback(formData.fromAccountId, originalBalance, withdrawalId);
      throw new Error(`Erro ao criar transação pendente: ${transactionError.message}`);
    }
    
    console.log('✅ Transação pendente criada no extrato');

    // PASSO 4: Buscar categoria "Tarifa Bancária"
    console.log('4️⃣ Buscando categoria de tarifa...');
    const { data: category } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('name', 'Tarifa Bancária')
      .eq('user_id', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34')
      .single();

    // PASSO 5: Criar despesa da taxa (se houver taxa)
    if (formData.feeAmount > 0) {
      console.log('5️⃣ Criando despesa da taxa...');
      const { data: expenseData, error: expenseError } = await supabase
        .from('accounts_payable')
        .insert([{
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          description: `Taxa de saque - ${formData.description || 'Saque de plataforma'}`,
          amount: formData.feeAmount,
          category_id: category?.id || null,
          bank_account_id: formData.fromAccountId,
          due_date: new Date().toISOString().split('T')[0],
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
        }])
        .select('id')
        .single();

      if (expenseError) {
        console.error('❌ Erro ao criar despesa da taxa:', expenseError);
        await performRollback(formData.fromAccountId, originalBalance, withdrawalId);
        throw new Error(`Erro ao criar despesa da taxa: ${expenseError.message}`);
      }
      
      expenseId = expenseData.id;
      console.log('✅ Despesa da taxa criada:', expenseData.id);

      // PASSO 6: Criar transação da taxa
      console.log('6️⃣ Criando transação da taxa...');
      const { error: feeTransactionError } = await supabase
        .from('financial_transactions')
        .insert([{
          user_id: 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34',
          description: `Taxa de saque - ${formData.description || 'Saque de plataforma'}`,
          amount: formData.feeAmount,
          type: 'payment',
          from_account_id: formData.fromAccountId,
          reference_id: expenseData.id,
          reference_type: 'payable',
        }]);

      if (feeTransactionError) {
        console.error('❌ Erro ao criar transação da taxa:', feeTransactionError);
        await performRollback(formData.fromAccountId, originalBalance, withdrawalId, expenseId);
        throw new Error(`Erro ao criar transação da taxa: ${feeTransactionError.message}`);
      }
      
      console.log('✅ Transação da taxa criada com sucesso');
    }

    console.log('🎉 SAQUE PROCESSADO COM SUCESSO!');
    console.log('ℹ️  NOTA: O valor será creditado na conta de destino apenas quando o saque for confirmado');

  } catch (error) {
    console.error('🚨 ERRO NO PROCESSO DE SAQUE:', error);
    throw error;
  }
};
