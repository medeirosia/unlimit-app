
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProjectData, Transaction, Mentorship } from '@/types/dashboard';
import { TrendingUp, DollarSign, Target, Users, Zap, ChevronDown, ChevronUp, Calendar, Briefcase, Receipt } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProjectManagementProps {
  projectsData: ProjectData[];
  transactions: Transaction[];
  mentorships: Mentorship[];
  selectedMonth: number;
  selectedYear: number;
}

export const ProjectManagement = ({ 
  projectsData, 
  transactions, 
  mentorships, 
  selectedMonth, 
  selectedYear 
}: ProjectManagementProps) => {
  const isMobile = useIsMobile();
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  const [expandedMonthlySales, setExpandedMonthlySales] = useState<Record<string, boolean>>({});

  const toggleTransactions = (projectId: string) => {
    setExpandedTransactions(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const toggleMonthlySales = (projectId: string) => {
    setExpandedMonthlySales(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const getProjectTransactions = (projectId: string) => {
    return transactions.filter(t => 
      t.project === projectId && 
      new Date(t.date).getMonth() + 1 === selectedMonth &&
      new Date(t.date).getFullYear() === selectedYear
    );
  };

  const getMonthlySales = (projectId: string) => {
    return mentorships.filter(m => 
      m.project === projectId && 
      new Date(m.date).getMonth() + 1 === selectedMonth &&
      new Date(m.date).getFullYear() === selectedYear
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getProjectGradient = (projectId: string) => {
    if (projectId === 'matheus') return 'from-emerald-500 to-emerald-600';
    if (projectId === 'kenneth') return 'from-blue-500 to-blue-600';
    return 'from-violet-500 to-violet-600';
  };

  // Sort projects by revenue (descending)
  const sortedProjectsData = [...projectsData].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <Briefcase className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className={`font-semibold text-slate-800 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Gestão de Projetos
        </h2>
      </div>

      {sortedProjectsData.map((project) => {
        const projectTransactions = getProjectTransactions(project.id);
        const monthlySales = getMonthlySales(project.id);
        const isExpertProject = project.id === 'matheus' || project.id === 'kenneth';
        const gradient = getProjectGradient(project.id);
        
        return (
          <Card key={project.id} className="border-0 shadow-lg overflow-hidden">
            {/* Header com gradiente */}
            <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{project.name}</h3>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${project.roas >= 1 ? 'bg-white/20' : 'bg-red-500/40'}`}>
                  <span className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    ROAS {project.roas.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
            
            <CardContent className={`${isMobile ? 'p-3' : 'p-5'} space-y-4`}>
              {/* Métricas Gerais */}
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className={`text-emerald-600 ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`text-emerald-700 font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Receita</span>
                  </div>
                  <div className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {formatCurrency(project.revenue)}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className={`text-blue-600 ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`text-blue-700 font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Investimento</span>
                  </div>
                  <div className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {formatCurrency(project.investment)}
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className={`text-purple-600 ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`text-purple-700 font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>ROAS</span>
                  </div>
                  <div className={`font-bold ${project.roas >= 1 ? 'text-emerald-600' : 'text-red-600'} ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {project.roas.toFixed(2)}x
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${project.profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className={`${project.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} ${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
                    <span className={`font-medium ${project.profit >= 0 ? 'text-emerald-700' : 'text-red-700'} ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Lucro</span>
                  </div>
                  <div className={`font-bold ${project.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {formatCurrency(project.profit)}
                  </div>
                </div>
              </div>

              {/* Análise por Tipo */}
              {isExpertProject && (
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`text-blue-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      <span className={`font-semibold text-blue-800 ${isMobile ? 'text-sm' : 'text-base'}`}>Low-ticket</span>
                    </div>
                    <div className={`flex ${isMobile ? 'justify-between' : 'flex-col gap-1'}`}>
                      <div>
                        <span className={`text-slate-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita: </span>
                        <span className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {formatCurrency(project.lowTicketRevenue || 0)}
                        </span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(project.lowTicketRoas || 0) >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        ROAS {(project.lowTicketRoas || 0).toFixed(2)}x
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className={`text-purple-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      <span className={`font-semibold text-purple-800 ${isMobile ? 'text-sm' : 'text-base'}`}>Mentorias</span>
                    </div>
                    <div className={`flex ${isMobile ? 'justify-between items-center' : 'flex-col gap-1'}`}>
                      <div>
                        <span className={`text-slate-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Receita: </span>
                        <span className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {formatCurrency(project.mentorshipRevenue || 0)}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                        N/A
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentorias Fechadas */}
              {isExpertProject && (
                <Collapsible 
                  open={expandedMonthlySales[project.id]} 
                  onOpenChange={() => toggleMonthlySales(project.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Calendar className={`text-purple-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        <span className={`font-medium text-purple-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          Mentorias do Mês
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 text-xs font-bold">
                          {monthlySales.length}
                        </span>
                      </div>
                      {expandedMonthlySales[project.id] ? (
                        <ChevronUp className="h-4 w-4 text-purple-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    {monthlySales.length > 0 ? (
                      isMobile ? (
                        <div className="space-y-2">
                          {monthlySales.map((mentorship) => (
                            <div key={mentorship.id} className="bg-white rounded-lg border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-800 text-sm">{mentorship.clientName}</span>
                                <Badge 
                                  className={`text-[10px] ${mentorship.pendingValue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                  {mentorship.pendingValue === 0 ? 'Pago' : 'Parcial'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-slate-400">Total</span>
                                  <p className="font-semibold text-slate-700">{formatCurrency(mentorship.totalValue)}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Recebido</span>
                                  <p className="font-semibold text-emerald-600">{formatCurrency(mentorship.receivedValue)}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Pendente</span>
                                  <p className="font-semibold text-amber-600">{formatCurrency(mentorship.pendingValue)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Valor Total</TableHead>
                                <TableHead>Recebido</TableHead>
                                <TableHead>Pendente</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {monthlySales.map((mentorship) => (
                                <TableRow key={mentorship.id}>
                                  <TableCell className="font-medium">{mentorship.clientName}</TableCell>
                                  <TableCell>{formatCurrency(mentorship.totalValue)}</TableCell>
                                  <TableCell className="text-emerald-600">{formatCurrency(mentorship.receivedValue)}</TableCell>
                                  <TableCell className="text-amber-600">{formatCurrency(mentorship.pendingValue)}</TableCell>
                                  <TableCell>
                                    <Badge className={mentorship.pendingValue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                      {mentorship.pendingValue === 0 ? 'Pago Integral' : 'Parcial'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6 text-slate-400 border rounded-lg bg-slate-50 text-sm">
                        Nenhuma mentoria fechada no mês
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Transações */}
              {projectTransactions.length > 0 && (
                <Collapsible 
                  open={expandedTransactions[project.id]} 
                  onOpenChange={() => toggleTransactions(project.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Receipt className={`text-slate-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        <span className={`font-medium text-slate-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          Transações do Mês
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                          {projectTransactions.length}
                        </span>
                      </div>
                      {expandedTransactions[project.id] ? (
                        <ChevronUp className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    {isMobile ? (
                      <div className="space-y-2">
                        {projectTransactions.slice(-5).map((transaction) => (
                          <div key={transaction.id} className="bg-white rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400">
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge className={`text-[10px] ${transaction.type.includes('revenue') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {transaction.type === 'revenue' && 'Receita'}
                                {transaction.type === 'low-ticket-revenue' && 'Low-ticket'}
                                {transaction.type === 'investment' && 'Investimento'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 truncate flex-1 mr-2">
                                {transaction.description || '-'}
                              </span>
                              <span className={`font-bold text-sm ${transaction.type.includes('revenue') ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {projectTransactions.slice(-5).map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-sm">
                                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                  <Badge className={transaction.type.includes('revenue') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                                    {transaction.type === 'revenue' && 'Receita'}
                                    {transaction.type === 'low-ticket-revenue' && 'Low-ticket'}
                                    {transaction.type === 'investment' && 'Investimento'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{transaction.description || '-'}</TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type.includes('revenue') ? 'text-emerald-600' : 'text-blue-600'}`}>
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
