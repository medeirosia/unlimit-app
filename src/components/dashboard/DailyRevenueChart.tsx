
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '@/types/dashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Project {
  key: string;
  name: string;
}

interface DailyRevenueChartProps {
  transactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  activeProjects?: Project[];
  taxPercentage?: number;
}

interface DailyChartData {
  day: string;
  totalReceita: number;
  totalInvestimento: number;
  roas: number;
  [key: string]: number | string; // Para dados dinâmicos por projeto
}

const formatMonthYear = (month: number, year: number) => {
  const date = new Date(year, month - 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ` de ${year}`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatROAS = (value: number) => {
  return value.toFixed(2) + 'x';
};

// Tooltip customizado para mostrar lucro e ROAS
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Encontrar os dados do dia específico
    const data = payload[0].payload;
    const receita = data.totalReceita || 0;
    const investimento = data.totalInvestimento || 0;
    const lucro = receita - investimento;
    const roas = investimento > 0 ? receita / investimento : 0;

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-48">
        <p className="font-medium text-slate-800 mb-2">{`Dia ${label}`}</p>
        <div className="space-y-1 text-sm">
          <p className="text-emerald-600">
            Total - Receita: <span className="font-medium">{formatCurrency(receita)}</span>
          </p>
          <p className="text-red-500">
            Total - Investimento: <span className="font-medium">{formatCurrency(investimento)}</span>
          </p>
          <div className="border-t border-slate-100 pt-1 mt-2">
            <p className={`${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              Lucro: <span className="font-medium">{formatCurrency(lucro)}</span>
            </p>
            <p className="text-orange-600">
              ROAS: <span className="font-medium">{formatROAS(roas)}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const processChartData = (
  transactions: Transaction[],
  selectedMonth: number,
  selectedYear: number,
  activeProjects: Project[],
  taxPercentage: number = 0
): DailyChartData[] => {
  // Filtrar transações do mês selecionado
  const monthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date + 'T00:00:00.000Z');
    const transactionMonth = transactionDate.getUTCMonth() + 1;
    const transactionYear = transactionDate.getUTCFullYear();
    
    const isCorrectMonth = transactionMonth === selectedMonth && transactionYear === selectedYear;
    
    return isCorrectMonth;
  });

  // Obter o número de dias no mês
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  
  // Criar dados para todos os dias do mês
  const dailyData: { [key: string]: DailyChartData } = {};

  // Inicializar todos os dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = day.toString().padStart(2, '0');
    const dayData: DailyChartData = {
      day: dayKey,
      totalReceita: 0,
      totalInvestimento: 0,
      roas: 0,
    };
    
    // Inicializar dados por projeto
    activeProjects.forEach(project => {
      dayData[`${project.key}Receita`] = 0;
      dayData[`${project.key}Investimento`] = 0;
    });
    
    dailyData[dayKey] = dayData;
  }

  // Processar cada transação
  monthTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date + 'T00:00:00.000Z');
    const day = transactionDate.getUTCDate();
    const dayKey = day.toString().padStart(2, '0');
    
    // Verificar se o projeto da transação está nos projetos ativos
    const isActiveProject = activeProjects.some(p => p.key === transaction.project);
    
    if (isActiveProject) {
      const projectKey = transaction.project;
      
      if (transaction.type === 'revenue' || transaction.type === 'low-ticket-revenue') {
        dailyData[dayKey][`${projectKey}Receita`] = 
          (dailyData[dayKey][`${projectKey}Receita`] as number) + transaction.amount;
        dailyData[dayKey].totalReceita += transaction.amount;
      } else if (transaction.type === 'investment') {
        dailyData[dayKey][`${projectKey}Investimento`] = 
          (dailyData[dayKey][`${projectKey}Investimento`] as number) + transaction.amount;
        dailyData[dayKey].totalInvestimento += transaction.amount;
      }
    }
  });

  // Aplicar imposto ao investimento e calcular ROAS para cada dia
  Object.keys(dailyData).forEach(day => {
    const data = dailyData[day];
    if (taxPercentage > 0 && data.totalInvestimento > 0) {
      const taxAmount = data.totalInvestimento * (taxPercentage / 100);
      data.totalInvestimento += taxAmount;
      // Aplicar imposto por projeto também
      activeProjects.forEach(project => {
        const projInv = data[`${project.key}Investimento`] as number;
        if (projInv > 0) {
          data[`${project.key}Investimento`] = projInv + projInv * (taxPercentage / 100);
        }
      });
    }
    if (data.totalInvestimento > 0) {
      data.roas = data.totalReceita / data.totalInvestimento;
    } else {
      data.roas = 0;
    }
  });

  return Object.values(dailyData).sort((a, b) => 
    parseInt(a.day) - parseInt(b.day)
  );
};

// Cores para os projetos
const PROJECT_COLORS = [
  { revenue: '#10b981', investment: '#ef4444' }, // Verde/Vermelho
  { revenue: '#3b82f6', investment: '#f59e0b' }, // Azul/Laranja
  { revenue: '#8b5cf6', investment: '#ec4899' }, // Roxo/Rosa
  { revenue: '#06b6d4', investment: '#f97316' }, // Cyan/Laranja escuro
  { revenue: '#84cc16', investment: '#dc2626' }, // Lima/Vermelho escuro
];

const DEFAULT_PROJECTS: Project[] = [
  { key: 'low-ticket', name: 'Low-Tickets' },
  { key: 'matheus', name: 'Matheus' },
  { key: 'kenneth', name: 'Kenneth' }
];

export const DailyRevenueChart = ({ 
  transactions, 
  selectedMonth, 
  selectedYear,
  activeProjects = [],
  taxPercentage = 0,
}: DailyRevenueChartProps) => {
  const [viewType, setViewType] = useState<'combined' | 'separated'>('combined');
  const [dataType, setDataType] = useState<string>('all');
  const [showRoas, setShowRoas] = useState(false);

  // Fallback para projetos padrão se não forem fornecidos
  const projects = useMemo(
    () => activeProjects.length > 0 ? activeProjects : DEFAULT_PROJECTS,
    [activeProjects]
  );

  const chartData = useMemo(() => 
    processChartData(transactions, selectedMonth, selectedYear, projects, taxPercentage),
    [transactions, selectedMonth, selectedYear, projects, taxPercentage]
  );

  const renderLines = () => {
    const lines = [];
    
    if (viewType === 'combined') {
      if (dataType === 'all') {
        lines.push(
          <Line 
            key="totalReceita"
            type="monotone" 
            dataKey="totalReceita" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Total - Receita"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            yAxisId="left"
            isAnimationActive={false}
          />,
          <Line 
            key="totalInvestimento"
            type="monotone" 
            dataKey="totalInvestimento" 
            stroke="#ef4444" 
            strokeWidth={3}
            strokeDasharray="5 5"
            name="Total - Investimento"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            yAxisId="left"
            isAnimationActive={false}
          />
        );
      } else {
        const projectIndex = projects.findIndex(p => p.key === dataType);
        const colors = PROJECT_COLORS[projectIndex % PROJECT_COLORS.length];
        const project = projects.find(p => p.key === dataType);
        
        if (project && colors) {
          lines.push(
            <Line 
              key={`${dataType}Receita`}
              type="monotone" 
              dataKey={`${dataType}Receita`} 
              stroke={colors.revenue}
              strokeWidth={3}
              name={`${project.name} - Receita`}
              dot={{ fill: colors.revenue, strokeWidth: 2, r: 4 }}
              yAxisId="left"
              isAnimationActive={false}
            />,
            <Line 
              key={`${dataType}Investimento`}
              type="monotone" 
              dataKey={`${dataType}Investimento`} 
              stroke={colors.investment}
              strokeWidth={3}
              strokeDasharray="5 5"
              name={`${project.name} - Investimento`}
              dot={{ fill: colors.investment, strokeWidth: 2, r: 4 }}
              yAxisId="left"
              isAnimationActive={false}
            />
          );
        }
      }
    } else {
      const projectsToShow = dataType === 'all' ? projects : projects.filter(p => p.key === dataType);
      
      projectsToShow.forEach(project => {
        const colorIndex = projects.findIndex(p => p.key === project.key);
        const colors = PROJECT_COLORS[colorIndex % PROJECT_COLORS.length];
        
        lines.push(
          <Line 
            key={`${project.key}Receita`}
            type="monotone" 
            dataKey={`${project.key}Receita`} 
            stroke={colors.revenue}
            strokeWidth={3}
            name={`${project.name} - Receita`}
            dot={{ fill: colors.revenue, strokeWidth: 2, r: 4 }}
            yAxisId="left"
            isAnimationActive={false}
          />,
          <Line 
            key={`${project.key}Investimento`}
            type="monotone" 
            dataKey={`${project.key}Investimento`} 
            stroke={colors.investment}
            strokeWidth={3}
            strokeDasharray="5 5"
            name={`${project.name} - Investimento`}
            dot={{ fill: colors.investment, strokeWidth: 2, r: 4 }}
            yAxisId="left"
            isAnimationActive={false}
          />
        );
      });
    }

    // Adicionar linha do ROAS APENAS se estiver habilitada
    if (showRoas) {
      lines.push(
        <Line 
          key="roas"
          type="monotone" 
          dataKey="roas" 
          stroke="#f97316" 
          strokeWidth={2}
          name="ROAS Diário"
          dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
          yAxisId="right"
          isAnimationActive={false}
        />
      );
    }
    
    return lines;
  };

  return (
    <div className="space-y-2">
      {/* Filtros */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-2.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <Button
                variant={viewType === 'combined' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('combined')}
                className="flex-1 sm:flex-none text-xs h-8"
              >
                Combinado
              </Button>
              <Button
                variant={viewType === 'separated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('separated')}
                className="flex-1 sm:flex-none text-xs h-8"
              >
                Separado
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={dataType} onValueChange={(value: string) => setDataType(value)}>
                <SelectTrigger className="flex-1 sm:w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Geral</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.key} value={project.key}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showRoas ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRoas(!showRoas)}
                className="text-xs h-8 whitespace-nowrap"
              >
                {showRoas ? 'ROAS ✓' : 'ROAS'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfico */}
      <Card className="bg-white border-0 shadow-md overflow-hidden">
        <CardContent className="p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-2">
            📈 Receitas e Despesas - {formatMonthYear(selectedMonth, selectedYear)}
          </h3>
          {chartData.length > 0 ? (
            <div className="h-52 sm:h-72 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="day" 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    width={40}
                  />
                  {showRoas && (
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      className="text-sm"
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatROAS}
                      width={40}
                    />
                  )}
                  <Tooltip 
                    content={<CustomTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    iconSize={8}
                  />
                  {renderLines()}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum lançamento encontrado para {formatMonthYear(selectedMonth, selectedYear)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
