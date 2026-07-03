
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectData } from '@/types/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceChartProps {
  projectsData: ProjectData[];
}

export const PerformanceChart = ({ projectsData }: PerformanceChartProps) => {
  const roasData = projectsData.map(project => ({
    name: project.name.replace('Projeto ', ''),
    roas: Number(project.roas.toFixed(2)),
    receita: project.revenue,
    investimento: project.investment,
    lucro: project.profit,
  }));

  const getBarColor = (roas: number) => {
    if (roas === 0) return '#9CA3AF'; // Cinza
    if (roas >= 1) return '#10B981'; // Verde
    return '#EF4444'; // Vermelho
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Receita:</span> R$ {Number(data.receita).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Investimento:</span> R$ {Number(data.investimento).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">ROAS:</span> {data.roas.toFixed(2)}x
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Lucro:</span> R$ {Number(data.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="500"
      >
        {value.toFixed(2)}x
      </text>
    );
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Performance por Projeto</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={roasData} 
            margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              label={{ value: 'ROAS', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `${value}x`} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="roas" label={<CustomLabel />}>
              {roasData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.roas)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
