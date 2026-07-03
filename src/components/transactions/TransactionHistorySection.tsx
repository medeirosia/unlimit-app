
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, Mentorship } from '@/types/dashboard';
import { DollarSign, TrendingUp, Filter } from 'lucide-react';
import { TransactionTable } from './TransactionTable';
import { useMentorshipTransactionHandler } from './MentorshipTransactionHandler';
import { getFilteredAndSortedTransactions } from './utils/transactionUtils';
import { useProjectConfig } from '@/hooks/useProjectConfig';

interface TransactionHistorySectionProps {
  transactions: Transaction[];
  mentorships: Mentorship[];
  selectedMonth: number;
  selectedYear: number;
  onUndoTransaction?: (transactionId: string) => void;
  onUpdateMentorship?: (mentorshipId: string, updatedMentorship: Mentorship) => void;
}

export const TransactionHistorySection = ({
  transactions,
  mentorships,
  selectedMonth,
  selectedYear,
  onUndoTransaction,
  onUpdateMentorship
}: TransactionHistorySectionProps) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { getProjectOptions, getProjectDisplayName } = useProjectConfig();
  
  const { handleUndoMentorshipTransaction } = useMentorshipTransactionHandler({
    mentorships,
    onUpdateMentorship
  });

  const allTransactions = getFilteredAndSortedTransactions(
    transactions,
    mentorships,
    selectedMonth,
    selectedYear
  );

  // Filtrar por projeto se selecionado
  const filteredTransactions = selectedProject === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => t.project === selectedProject);

  // Obter projetos que têm transações no período atual (incluindo inativos)
  const projectsWithTransactions = useMemo(() => {
    const projectsInTransactions = new Set(allTransactions.map(t => t.project));
    const availableProjects = getProjectOptions(true); // incluir inativos
    
    return availableProjects.filter(project => 
      project.active || projectsInTransactions.has(project.value)
    );
  }, [allTransactions, getProjectOptions]);

  const revenueTransactions = filteredTransactions.filter(t => 
    t.type === 'revenue' || t.type === 'low-ticket-revenue'
  );

  const expenseTransactions = filteredTransactions.filter(t => 
    t.type === 'investment'
  );

  const handleUndo = (transactionId: string) => {
    if (transactionId.startsWith('mentorship-')) {
      handleUndoMentorshipTransaction(transactionId);
    } else {
      onUndoTransaction?.(transactionId);
    }
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">
          Histórico de Transações do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtro por Projeto */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <Filter className="h-5 w-5 text-blue-600" />
          <label className="text-sm font-medium text-slate-700">Filtrar por Projeto:</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projectsWithTransactions.map(project => (
                <SelectItem key={project.value} value={project.value}>
                  {project.label} {!project.active && '(Inativo)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs defaultValue="revenues" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenues" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receitas ({revenueTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Despesas ({expenseTransactions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenues" className="mt-4">
            {revenueTransactions.length > 0 ? (
              <TransactionTable
                transactions={revenueTransactions}
                showUndoButton={true}
                onUndoTransaction={handleUndo}
              />
            ) : (
              <div className="text-center py-6 text-slate-500 border rounded-lg bg-slate-50">
                Nenhuma receita lançada no mês selecionado
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            {expenseTransactions.length > 0 ? (
              <TransactionTable
                transactions={expenseTransactions}
                showUndoButton={true}
                onUndoTransaction={handleUndo}
              />
            ) : (
              <div className="text-center py-6 text-slate-500 border rounded-lg bg-slate-50">
                Nenhuma despesa lançada no mês selecionado
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
