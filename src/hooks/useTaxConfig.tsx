import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTaxConfig = () => {
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxConfig();
  }, []);

  const loadTaxConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('project_configurations')
        .select('*')
        .eq('key', 'investment_tax_percentage')
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configuração de imposto:', error);
      } else if (data) {
        setTaxPercentage(parseFloat(data.name) || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de imposto:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaxPercentage = async (percentage: number) => {
    try {
      const { data: existing } = await supabase
        .from('project_configurations')
        .select('id')
        .eq('key', 'investment_tax_percentage')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('project_configurations')
          .update({ name: percentage.toString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_configurations')
          .insert({
            key: 'investment_tax_percentage',
            name: percentage.toString(),
            active: true,
          });
        if (error) throw error;
      }

      setTaxPercentage(percentage);
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração de imposto:', error);
      return false;
    }
  };

  return {
    taxPercentage,
    loading,
    updateTaxPercentage,
    loadTaxConfig,
  };
};
