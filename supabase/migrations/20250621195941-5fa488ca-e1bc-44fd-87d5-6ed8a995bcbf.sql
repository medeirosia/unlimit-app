
-- Habilitar RLS na tabela pending_withdrawals se não estiver habilitado
ALTER TABLE public.pending_withdrawals ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seus próprios saques pendentes
CREATE POLICY "Users can view their own pending withdrawals" 
  ON public.pending_withdrawals 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem seus próprios saques pendentes
CREATE POLICY "Users can create their own pending withdrawals" 
  ON public.pending_withdrawals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios saques pendentes
CREATE POLICY "Users can update their own pending withdrawals" 
  ON public.pending_withdrawals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios saques pendentes
CREATE POLICY "Users can delete their own pending withdrawals" 
  ON public.pending_withdrawals 
  FOR DELETE 
  USING (auth.uid() = user_id);
