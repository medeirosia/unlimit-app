import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Target, Plus } from 'lucide-react';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

export const useTabManagement = () => {
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const { can, loading } = useGlobalPermissions();

  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: 'overview',     key: 'inicio.painel_geral',  icon: BarChart3, label: 'Painel Geral', emoji: '📊' },
      { id: 'projects',     key: 'inicio.projetos',      icon: Target,    label: 'Projetos',     emoji: '🎯' },
      { id: 'transactions', key: 'inicio.lancamentos',   icon: Plus,      label: 'Lançamentos',  emoji: '➕' },
      // Mentorias descontinuado — dados preservados no banco, aba oculta do menu
    ];
    if (loading) return allTabs;
    return allTabs.filter(t => can(t.key));
  }, [can, loading]);

  const firstAvailable = useMemo(() => availableTabs[0]?.id || 'overview', [availableTabs]);

  useEffect(() => {
    if (loading) return;
    if (!availableTabs.find(t => t.id === selectedTab) && availableTabs.length > 0) {
      setSelectedTab(firstAvailable);
    }
  }, [availableTabs, selectedTab, firstAvailable, loading]);

  const getGridCols = (count: number) => {
    const map: Record<number, string> = {
      1:'grid-cols-1',2:'grid-cols-2',3:'grid-cols-3',
      4:'grid-cols-4',5:'grid-cols-5',6:'grid-cols-6',7:'grid-cols-7',
    };
    return map[count] || 'grid-cols-6';
  };

  return { selectedTab, setSelectedTab, availableTabs, getGridCols };
};
