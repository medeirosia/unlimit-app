
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

export const useUserPermissions = () => {
  return useGlobalPermissions();
};
