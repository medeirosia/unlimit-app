
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  nome: string;
  tipo: string;
  receita: number;
  investimento: number;
  criado_em: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar projetos:', error);
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'criado_em'>) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .insert(project)
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar projeto:', error);
        return false;
      }

      setProjects(prev => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      return false;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar projeto:', error);
        return false;
      }

      setProjects(prev => prev.map(p => p.id === id ? data : p));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return false;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar projeto:', error);
        return false;
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      return false;
    }
  };

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    loadProjects
  };
};
