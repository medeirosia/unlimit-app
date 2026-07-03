
-- Criar tabela para categorias de contas a receber
CREATE TABLE public.receivable_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.receivable_categories ENABLE ROW LEVEL SECURITY;

-- Criar política para que usuários vejam apenas suas próprias categorias
CREATE POLICY "Users can view their own receivable categories" 
  ON public.receivable_categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Criar política para que usuários criem suas próprias categorias
CREATE POLICY "Users can create their own receivable categories" 
  ON public.receivable_categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Criar política para que usuários atualizem suas próprias categorias
CREATE POLICY "Users can update their own receivable categories" 
  ON public.receivable_categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar política para que usuários deletem suas próprias categorias
CREATE POLICY "Users can delete their own receivable categories" 
  ON public.receivable_categories 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar coluna category_id na tabela accounts_receivable
ALTER TABLE public.accounts_receivable 
ADD COLUMN category_id uuid REFERENCES public.receivable_categories(id);
