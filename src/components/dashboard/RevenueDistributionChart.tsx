
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectData } from '@/types/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RevenueDistributionChartProps {
  projectsData: ProjectData[];
}

export const RevenueDistributionChart = ({ projectsData }: RevenueDistributionChartProps) => {
  const totalRevenue = projectsData.reduce((sum, p) => sum + p.revenue, 0);
  
  const pieData = projectsData.map(project => ({
    name: project.name.replace('Projeto ', '').replace('Low-ticket BR', 'Low-ticket'),
    fullName: project.name,
    value: project.revenue,
    percentage: totalRevenue > 0 ? (project.revenue / totalRevenue) * 100 : 0
  }));

  // Cores padronizadas: azul, verde, laranja
  const COLORS = [
    '#4A90E2', // Azul
    '#50C878', // Verde
    '#FF8C42'  // Laranja
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Só mostrar para fatias de 5% ou mais
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="500"
        style={{ 
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-1">{data.fullName}</p>
          <p className="text-blue-600 font-medium">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-gray-600 text-sm">
            {data.percentage === 0 ? '0%' : `${data.percentage.toFixed(1)}%`} de participação
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="mt-4 lg:mt-0 lg:ml-6 space-y-2 flex-shrink-0">
        {payload.map((entry: any, index: number) => {
          const data = pieData.find(item => item.name === entry.value);
          const hasRevenue = (data?.value || 0) > 0;
          return (
            <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors min-w-[280px]">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: hasRevenue ? entry.color : '#9CA3AF' }}
                />
                <span className={`text-sm font-normal ${hasRevenue ? 'text-gray-700' : 'text-gray-400'}`}>
                  {data?.fullName || entry.value}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${hasRevenue ? 'text-gray-800' : 'text-gray-400'}`}>
                  R$ {(data?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-gray-500">
                  ({data?.percentage === 0 ? '0%' : `${(data?.percentage || 0).toFixed(1)}%`})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Distribuição de Receita</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-center">
          <div className="h-[400px] lg:h-[380px] flex-1 min-w-0">
            <ResponsiveContainer width="70%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={140}
                  innerRadius={25}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => {
                    const hasRevenue = entry.value > 0;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hasRevenue ? COLORS[index % COLORS.length] : '#9CA3AF'}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
