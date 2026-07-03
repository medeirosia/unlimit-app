
-- Create enum for Pancada Joias submodules
CREATE TYPE public.pancada_submodule AS ENUM ('pricing', 'inventory', 'dropshipping');

-- Create permissions table
CREATE TABLE public.user_pancada_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submodule pancada_submodule NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, submodule)
);

-- Enable RLS
ALTER TABLE public.user_pancada_permissions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admin can manage pancada permissions"
ON public.user_pancada_permissions
FOR ALL
USING (is_admin_user());

-- Users can view their own
CREATE POLICY "Users can view their own pancada permissions"
ON public.user_pancada_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pancada_permissions_updated_at
BEFORE UPDATE ON public.user_pancada_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_financial_permissions_updated_at();

-- Security definer function to check access
CREATE OR REPLACE FUNCTION public.has_pancada_submodule_access(_user_id uuid, _submodule pancada_submodule)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT has_access 
     FROM user_pancada_permissions 
     WHERE user_id = _user_id AND submodule = _submodule),
    -- Se não há registro específico, verificar se tem acesso ao módulo pancada geral
    (SELECT 'pancada_joias' = ANY(modulos_permitidos) 
     FROM profiles 
     WHERE id = _user_id)
  );
$$;
