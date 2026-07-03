import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🔧 Fix Pending Withdrawal function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { withdrawalId } = await req.json()

    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ error: 'withdrawalId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Buscando saque pendente:', withdrawalId)

    // Buscar o saque pendente
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('pending_withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      console.error('❌ Erro ao buscar saque:', withdrawalError)
      return new Response(
        JSON.stringify({ error: 'Saque não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Saque encontrado:', withdrawal)

    // VALIDAÇÃO: Verificar se o saque já foi completado
    if (withdrawal.is_completed) {
      console.log('ℹ️ Saque já foi completado anteriormente')
      return new Response(
        JSON.stringify({ message: 'Saque já foi completado anteriormente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se já existe transação pendente para este saque
    const { data: existingTransaction } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('reference_id', withdrawalId)
      .eq('reference_type', 'withdrawal')
      .eq('type', 'transfer')
      .eq('status', 'pending')
      .single()

    if (existingTransaction) {
      console.log('ℹ️ Transação pendente já existe')
      return new Response(
        JSON.stringify({ message: 'Transação pendente já existe', transactionId: existingTransaction.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 Criando transação pendente no extrato...')

    // Criar transação pendente no extrato
    const { data: transaction, error: transactionError } = await supabase
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
      }])
      .select('id')
      .single()

    if (transactionError) {
      console.error('❌ Erro ao criar transação pendente:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar transação pendente', details: transactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Transação pendente criada:', transaction.id)

    return new Response(
      JSON.stringify({ 
        message: 'Transação pendente criada com sucesso', 
        transactionId: transaction.id,
        withdrawalId: withdrawal.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})