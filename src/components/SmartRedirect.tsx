import { Navigate } from 'react-router-dom';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const SmartRedirect = () => {
  const { can, loading } = useGlobalPermissions();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (can('inicio.acessar')) return <Navigate to="/inicio" replace />;
  if (can('financeiro.acessar')) return <Navigate to="/financeiro" replace />;
  if (can('inicio.configuracoes')) return <Navigate to="/configuracoes" replace />;

  // Authenticated but no module access — avoid redirect loop to /entrar
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border rounded-lg p-6 text-center space-y-4 shadow-sm">
        <h1 className="text-xl font-semibold">Sem acesso</h1>
        <p className="text-sm text-muted-foreground">
          Seu usuário ({user?.email}) não possui permissão para acessar nenhum módulo do sistema.
          Solicite acesso a um administrador.
        </p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>
          Sair
        </Button>
      </div>
    </div>
  );
};

export default SmartRedirect;
