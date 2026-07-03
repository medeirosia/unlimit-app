import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectConfig {
  id: string;
  name: string;
  active: boolean;
  key: string;
}

export const useProjectConfig = () => {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar configurações do Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar configurações de projetos:', error);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<ProjectConfig>) => {
    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar projeto:', error);
        return false;
      }

      setProjects(prev => prev.map(project => 
        project.id === projectId ? data : project
      ));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return false;
    }
  };

  const addProject = async (newProject: Omit<ProjectConfig, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar projeto:', error);
        return null;
      }

      setProjects(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
      return null;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('project_configurations')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Erro ao deletar projeto:', error);
        return false;
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      return true;
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      return false;
    }
  };

  const getActiveProjects = useCallback(() => {
    return projects.filter(project => project.active);
  }, [projects]);

  const getProjectByKey = useCallback((key: string) => {
    return projects.find(project => project.key === key);
  }, [projects]);

  const isProjectActive = useCallback((key: string) => {
    const project = getProjectByKey(key);
    return project?.active ?? false;
  }, [getProjectByKey]);

  // Mapear as chaves antigas para os nomes dos projetos
  const getProjectDisplayName = useCallback((key: string) => {
    const project = getProjectByKey(key);
    return project?.name || key;
  }, [getProjectByKey]);

  // Filtrar opções de projeto baseado no status ativo
  const getProjectOptions = useCallback((includeInactive = false) => {
    const projectsToShow = includeInactive ? projects : getActiveProjects();
    return projectsToShow.map(project => ({
      value: project.key,
      label: project.name,
      active: project.active
    }));
  }, [getActiveProjects, projects]);

  // Retorna projetos para exibição baseado no período
  // - Mês atual: apenas projetos ativos
  // - Meses anteriores: ativos + inativos (para mostrar dados históricos)
  const getProjectsForPeriod = useCallback((selectedMonth: number, selectedYear: number) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
    
    if (isCurrentMonth) {
      // Mês atual: apenas projetos ativos
      return projects.filter(p => p.active);
    } else {
      // Meses anteriores: todos os projetos (ativos e inativos)
      // para permitir visualização de dados históricos
      return projects;
    }
  }, [projects]);

  return {
    projects,
    loading,
    updateProject,
    addProject,
    deleteProject,
    getActiveProjects,
    getProjectByKey,
    isProjectActive,
    getProjectDisplayName,
    getProjectOptions,
    getProjectsForPeriod,
    loadProjects,
  };
};