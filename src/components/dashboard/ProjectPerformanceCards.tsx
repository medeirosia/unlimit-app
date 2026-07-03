
import { Card, CardContent } from '@/components/ui/card';
import { ProjectData } from '@/types/dashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Target, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface ProjectPerformanceCardsProps {
  projectsData: ProjectData[];
}

export const ProjectPerformanceCards = ({ projectsData }: ProjectPerformanceCardsProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getProjectColor = (name: string) => {
    if (name.includes('Low-ticket')) return { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-100', text: 'text-blue-600' };
    if (name.includes('Matheus')) return { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-100', text: 'text-emerald-600' };
    return { bg: 'from-violet-500 to-violet-600', light: 'bg-violet-100', text: 'text-violet-600' };
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="p-2 bg-purple-100 rounded-xl">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Performance por Projeto</h3>
        </div>
        
        <div className="space-y-3">
          {projectsData.map(project => {
            const colors = getProjectColor(project.name);
            return (
              <Card key={project.id} className={`bg-gradient-to-br ${colors.bg} text-white border-0 shadow-lg overflow-hidden`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${project.roas >= 1 ? 'bg-white/20' : 'bg-red-500/30'}`}>
                      <Target className="h-3 w-3" />
                      <span className="text-xs font-bold">{project.roas.toFixed(2)}x</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 opacity-80" />
                        <span className="text-[10px] opacity-80">Receita</span>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(project.revenue)}</span>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3 opacity-80" />
                        <span className="text-[10px] opacity-80">Invest.</span>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(project.investment)}</span>
                    </div>
                    
                    <div className={`rounded-lg p-2 ${project.profit >= 0 ? 'bg-white/10' : 'bg-red-500/30'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        {project.profit >= 0 ? (
                          <TrendingUp className="h-3 w-3 opacity-80" />
                        ) : (
                          <TrendingDown className="h-3 w-3 opacity-80" />
                        )}
                        <span className="text-[10px] opacity-80">Lucro</span>
                      </div>
                      <span className="text-xs font-bold">{formatCurrency(project.profit)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-purple-100 rounded-lg">
          <BarChart3 className="h-4 w-4 text-purple-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Performance por Projeto</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {projectsData.map(project => {
          const colors = getProjectColor(project.name);
          return (
            <Card key={project.id} className={`bg-gradient-to-br ${colors.bg} text-white border-0 shadow-md`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{project.name}</h4>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${project.roas >= 1 ? 'bg-white/20' : 'bg-red-500/30'}`}>
                    <Target className="h-3 w-3" />
                    <span className="font-semibold">{project.roas.toFixed(2)}x</span>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-xs">Receita</span>
                    <span className="font-semibold">{formatCurrency(project.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-xs">Investimento</span>
                    <span className="font-semibold">{formatCurrency(project.investment)}</span>
                  </div>
                  <div className="h-px bg-white/20" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-xs">Lucro</span>
                    <span className={`font-semibold ${project.profit < 0 ? 'text-red-200' : ''}`}>
                      {formatCurrency(project.profit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
