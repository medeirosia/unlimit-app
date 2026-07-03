// Compatibilidade: "isAdmin" agora significa "tem permissão de gerenciar permissões".
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

export const useAdminPermissions = () => {
  const { can, loading } = useGlobalPermissions();
  return { isAdmin: can('sistema.gerenciar_permissoes'), loading };
};
