
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProjectData } from '@/types/dashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { PieChart, TrendingUp } from 'lucide-react';

interface RevenueRankingTableProps {
  projectsData: ProjectData[];
}

export const RevenueRankingTable = ({ projectsData }: RevenueRankingTableProps) => {
  const isMobile = useIsMobile();
  const totalRevenue = projectsData.reduce((sum, p) => sum + p.revenue, 0);
  
  const rankingData = projectsData
    .map(project => ({
      name: project.name,
      revenue: project.revenue,
      percentage: totalRevenue > 0 ? (project.revenue / totalRevenue) * 100 : 0,
      color: project.name.includes('Low-ticket') ? '#3B82F6' : 
             project.name.includes('Matheus') ? '#10B981' : '#8B5CF6'
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <PieChart className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Distribuição de Receita</h3>
            <p className="text-xs text-slate-500">Total: {formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {rankingData.map((project, index) => (
            <Card key={index} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div 
                    className="w-1.5 flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800 text-sm truncate">{project.name}</span>
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${project.color}20`,
                          color: project.color
                        }}
                      >
                        {project.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">
                        {formatCurrency(project.revenue)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <TrendingUp className="h-3 w-3" />
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.max(project.percentage, 2)}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <PieChart className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Distribuição de Receita</h3>
            <p className="text-xs text-slate-500">Total: {formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-gray-700">Projeto</TableHead>
              <TableHead className="text-right font-medium text-gray-700">Receita</TableHead>
              <TableHead className="text-right font-medium text-gray-700">% Total</TableHead>
              <TableHead className="font-medium text-gray-700">Participação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingData.map((project, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-800">
                  {formatCurrency(project.revenue)}
                </TableCell>
                <TableCell className="text-right font-medium text-gray-600">
                  {project.percentage === 0 ? '0%' : `${project.percentage.toFixed(1)}%`}
                </TableCell>
                <TableCell className="w-32">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${Math.max(project.percentage, 2)}%`,
                          backgroundColor: project.color
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
