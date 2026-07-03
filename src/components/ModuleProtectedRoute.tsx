import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { Navigate } from 'react-router-dom';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  /** Nova API */
  requiredKey?: string;
  /** API legada */
  requiredModule?: string;
}

const ModuleProtectedRoute = ({ children, requiredKey, requiredModule }: ModuleProtectedRouteProps) => {
  const { can, hasPermission, loading } = useGlobalPermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  const allowed = requiredKey ? can(requiredKey) : requiredModule ? hasPermission(requiredModule) : true;
  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default ModuleProtectedRoute;
