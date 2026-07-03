import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type PermissionEntry = { key: string; resourceId: string | null };

interface PermissionsContextType {
  /** Lista crua de permissões efetivas do usuário */
  entries: PermissionEntry[];
  /** Lista apenas das chaves únicas (sem resource_id) — útil para checagens simples */
  keys: string[];
  /** Compatibilidade legada: mapeia chaves antigas (dashboard/financial/...) para as novas */
  permissions: string[];
  /** Nova API: pode/não pode */
  can: (key: string, resourceId?: string | null) => boolean;
  /** API legada: hasPermission('dashboard'|'financial'|'projects'|'mentorship'|'admin'|...) */
  hasPermission: (legacy: string) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Mapa de compatibilidade: chaves antigas → nova chave equivalente
const LEGACY_MAP: Record<string, string> = {
  dashboard: 'inicio.acessar',
  projects: 'inicio.projetos',
  mentorship: 'inicio.mentorias',
  financial: 'financeiro.acessar',
  pancada_joias: '__pancada_removed__',
  admin: 'sistema.gerenciar_permissoes',
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      setLoading(false);
      setLoaded(true);
      return;
    }

    if (!loaded) setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_permissions', { _user_id: user.id });
      if (error) {
        console.error('Erro ao carregar permissões:', error);
        setEntries([]);
      } else {
        setEntries((data || []).map((r: any) => ({ key: r.permission_key, resourceId: r.resource_id })));
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [user?.id, loaded]);

  useEffect(() => {
    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const can = useCallback(
    (key: string, resourceId: string | null = null) => {
      return entries.some(e => e.key === key && (e.resourceId ?? null) === (resourceId ?? null));
    },
    [entries]
  );

  const keys = Array.from(new Set(entries.map(e => e.key)));

  const hasPermission = useCallback(
    (legacy: string) => {
      const mapped = LEGACY_MAP[legacy];
      if (mapped) return can(mapped);
      return can(legacy);
    },
    [can]
  );

  // Lista legada para componentes que iteram `permissions` (ex. SmartRedirect)
  const permissions: string[] = [];
  if (keys.includes('inicio.acessar')) permissions.push('dashboard');
  if (keys.includes('inicio.projetos')) permissions.push('projects');
  if (keys.includes('inicio.mentorias')) permissions.push('mentorship');
  if (keys.includes('financeiro.acessar')) permissions.push('financial');
  if (keys.includes('sistema.gerenciar_permissoes')) permissions.push('admin');

  return (
    <PermissionsContext.Provider
      value={{ entries, keys, permissions, can, hasPermission, loading, refreshPermissions: load }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const useGlobalPermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('useGlobalPermissions must be used within a PermissionsProvider');
  return ctx;
};
