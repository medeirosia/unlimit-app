
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useUserCreation = (fetchUsers: () => Promise<void>, setLoading: (loading: boolean) => void) => {
  const { user } = useAuth();

  const createUser = async (email: string, password: string, fullName: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('Creating user with parent_user_id:', user.id);
      
      // Salvar a sessão atual antes de criar o usuário
      const { data: currentSession } = await supabase.auth.getSession();
      
      // Usar o método signUp padrão
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            parent_user_id: user.id
          }
        }
      });

      if (error) {
        // Tratar especificamente o erro de usuário já registrado
        if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
          toast({
            title: "Erro",
            description: "Este email já está registrado no sistema. Use um email diferente.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        console.log('User created with ID:', data.user.id);
        
        // Restaurar IMEDIATAMENTE a sessão do administrador
        if (currentSession?.session) {
          await supabase.auth.setSession({
            access_token: currentSession.session.access_token,
            refresh_token: currentSession.session.refresh_token
          });
        }
        
        // Aguardar um momento para garantir que o usuário foi criado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Inserir/atualizar o perfil com parent_user_id correto
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            user_type: 'user',
            parent_user_id: user.id
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Error creating/updating profile:', profileError);
        } else {
          console.log('Profile created/updated successfully for user:', data.user.id, 'with parent:', user.id);
        }

        // Aguardar um momento antes de recarregar para garantir que o perfil foi atualizado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Recarregar a lista de usuários
        await fetchUsers();
      }

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { createUser };
};
