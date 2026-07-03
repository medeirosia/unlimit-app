
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mentorship } from '@/types/dashboard';
import { Plus, Undo, Filter } from 'lucide-react';
import { MentorshipForm } from './mentorship/MentorshipForm';
import { MentorshipSummaryCards } from './mentorship/MentorshipSummaryCards';
import { MentorshipTable } from './mentorship/MentorshipTable';
import { useMentorshipTransactionHandler } from './transactions/MentorshipTransactionHandler';
import { useProjectConfig } from '@/hooks/useProjectConfig';

interface MentorshipListProps {
  mentorships: Mentorship[];
  onAddMentorship: (mentorship: Omit<Mentorship, 'id' | 'pendingValue' | 'payments'>) => void;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
  onDeleteMentorship: (mentorshipId: string) => void;
  onAddPayment: (mentorshipId: string, payment: any) => void;
  onReceivePayment?: (paymentId: string) => void;
  selectedMonth: number;
  selectedYear: number;
}

export const MentorshipList = ({ 
  mentorships, 
  onAddMentorship, 
  onUpdateMentorship,
  onDeleteMentorship,
  onAddPayment,
  onReceivePayment,
  selectedMonth,
  selectedYear 
}: MentorshipListProps & { onReceivePayment?: (paymentId: string) => void }) => {
  const { getActiveProjects, getProjectDisplayName } = useProjectConfig();
  
  // Filtrar apenas projetos ativos que suportam mentorias (matheus e kenneth)
  const mentorshipProjects = getActiveProjects().filter(p => 
    p.key === 'matheus' || p.key === 'kenneth'
  );

  // State for collapsible sections - colocar useState antes dos useMemo
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);
  const [monthlyDueOpen, setMonthlyDueOpen] = useState(false);
  const [monthlySoldOpen, setMonthlySoldOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Filtrar mentorias por projeto
  const filteredMentorships = useMemo(() => {
    if (selectedProject === 'all') return mentorships;
    return mentorships.filter(m => m.project === selectedProject);
  }, [mentorships, selectedProject]);

  // Calculate data for collapsible sections
  const unscheduledPendingMentorships = useMemo(() => 
    filteredMentorships.filter(m => {
      const hasUnscheduledAmount = m.pendingValue > 0;
      const hasNoPayments = !m.payments || m.payments.length === 0;
      const hasUnscheduledPending = hasUnscheduledAmount && (
        hasNoPayments || 
        m.payments.reduce((sum, p) => sum + p.amount, 0) < m.pendingValue
      );
      return hasUnscheduledPending;
    }), [filteredMentorships]
  );

  const monthlyDuePayments = useMemo(() => {
    const payments: { mentorship: Mentorship; payment: any }[] = [];
    
    filteredMentorships.forEach(mentorship => {
      if (mentorship.payments) {
        mentorship.payments.forEach(payment => {
          if (payment.dueDate) {
            const dueDate = new Date(payment.dueDate);
            // Mostrar todos os pagamentos com vencimento no mês selecionado, independente do status
            if (dueDate.getMonth() + 1 === selectedMonth && 
                dueDate.getFullYear() === selectedYear) {
              payments.push({ mentorship, payment });
            }
          }
        });
      }
    });
    
    // Ordenar por data de vencimento, mais recente primeiro
    return payments.sort((a, b) => 
      new Date(b.payment.dueDate).getTime() - new Date(a.payment.dueDate).getTime()
    );
  }, [filteredMentorships, selectedMonth, selectedYear]);

  const monthlySoldMentorships = useMemo(() => 
    filteredMentorships
      .filter(m => {
        const mentorshipDate = new Date(m.date);
        return mentorshipDate.getMonth() + 1 === selectedMonth && 
               mentorshipDate.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Ordenar por data de venda, mais recente primeiro
    [filteredMentorships, selectedMonth, selectedYear]
  );

  // Calculate summary data for the month
  const summaryData = useMemo(() => {
    // CORREÇÃO: Saldo pendente do mês deve ser apenas dos vencimentos pendentes do mês
    const monthlyPendingBalance = monthlyDuePayments
      .filter(p => p.payment.status === 'pendente')
      .reduce((sum, p) => sum + p.payment.amount, 0);

    const monthlyUnscheduledBalance = unscheduledPendingMentorships
      .reduce((sum, m) => {
        const scheduledAmount = m.payments?.reduce((total, p) => total + p.amount, 0) || 0;
        return sum + (m.pendingValue - scheduledAmount);
      }, 0);

    // CORREÇÃO: Usar a mesma lógica do painel geral - apenas m.receivedValue das mentorias do mês
    const monthlyReceivedTotal = filteredMentorships
      .filter(m => {
        const mentorshipDate = new Date(m.date);
        return mentorshipDate.getMonth() + 1 === selectedMonth && 
               mentorshipDate.getFullYear() === selectedYear;
      })
      .reduce((sum, m) => sum + m.receivedValue, 0);

    // NOVO: Calcular valor total vendido no mês (soma de valor_total das mentorias vendidas no mês)
    const monthlySoldTotal = filteredMentorships
      .filter(m => {
        const mentorshipDate = new Date(m.date);
        return mentorshipDate.getMonth() + 1 === selectedMonth && 
               mentorshipDate.getFullYear() === selectedYear;
      })
      .reduce((sum, m) => sum + m.totalValue, 0);

    return {
      monthlyPendingBalance,
      monthlyUnscheduledBalance,
      monthlyReceivedTotal,
      monthlySoldTotal
    };
  }, [filteredMentorships, selectedMonth, selectedYear, unscheduledPendingMentorships, monthlyDuePayments]);


  // Get undo handler
  const { handleUndoMentorshipTransaction } = useMentorshipTransactionHandler({ 
    mentorships, 
    onUpdateMentorship 
  });

  // Calculate mentorship receipts history for the selected month only - FIXED LOGIC
  const mentorshipReceipts = useMemo(() => {
    const receipts: { 
      mentorshipName: string; 
      amount: number; 
      receivedDate: string;
      dueDate?: string;
      project: string;
      type: 'sale' | 'payment';
      mentorshipId: string;
      paymentId?: string;
    }[] = [];
    
    filteredMentorships.forEach(mentorship => {
      // CORREÇÃO: Só adicionar venda inicial se não há pagamentos agendados recebidos no mesmo mês
      // ou se a venda foi realmente no mês selecionado E não há pagamentos recebidos ainda
      const saleDate = new Date(mentorship.date);
      const isSaleInSelectedMonth = saleDate.getMonth() + 1 === selectedMonth && saleDate.getFullYear() === selectedYear;
      
      // Verificar se há pagamentos recebidos no mês selecionado
      const hasReceivedPaymentsInSelectedMonth = mentorship.payments?.some(payment => {
        if (payment.status === 'recebido' && payment.receivedDate) {
          const receivedDate = new Date(payment.receivedDate);
          return receivedDate.getMonth() + 1 === selectedMonth && receivedDate.getFullYear() === selectedYear;
        }
        return false;
      });

      // Só mostrar a venda inicial se:
      // 1. Foi vendida no mês selecionado E tem receivedValue > 0 E não há pagamentos recebidos no mesmo mês
      // OU
      // 2. Foi vendida em outro mês mas tem receivedValue > 0 E não há pagamentos agendados (venda à vista)
      const shouldShowInitialSale = mentorship.receivedValue > 0 && (
        (isSaleInSelectedMonth && !hasReceivedPaymentsInSelectedMonth) ||
        (!mentorship.payments || mentorship.payments.length === 0)
      );

      if (shouldShowInitialSale && isSaleInSelectedMonth) {
        receipts.push({
          mentorshipName: mentorship.clientName,
          amount: mentorship.receivedValue,
          receivedDate: mentorship.date,
          dueDate: mentorship.date, // Para venda inicial, data de vencimento é a própria data da venda
          project: mentorship.project,
          type: 'sale',
          mentorshipId: mentorship.id
        });
      }
      
      // Adicionar pagamentos agendados recebidos no mês selecionado
      if (mentorship.payments) {
        mentorship.payments.forEach(payment => {
          if (payment.status === 'recebido' && payment.receivedDate) {
            const receivedDate = new Date(payment.receivedDate);
            if (receivedDate.getMonth() + 1 === selectedMonth && receivedDate.getFullYear() === selectedYear) {
              receipts.push({
                mentorshipName: mentorship.clientName,
                amount: payment.amount,
                receivedDate: payment.receivedDate,
                dueDate: payment.dueDate,
                project: mentorship.project,
                type: 'payment',
                mentorshipId: mentorship.id,
                paymentId: payment.id
              });
            }
          }
        });
      }
    });
    
    return receipts.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
  }, [filteredMentorships, selectedMonth, selectedYear]);

  const handleUndoReceipt = (receipt: any) => {
    if (receipt.type === 'payment' && receipt.paymentId) {
      // Undo payment receipt
      handleUndoMentorshipTransaction(`mentorship-payment-${receipt.paymentId}`);
    } else if (receipt.type === 'sale') {
      // Undo sale receipt
      handleUndoMentorshipTransaction(`mentorship-sale-${receipt.mentorshipId}`);
    }
  };

  // Update collapsible states when data changes
  useEffect(() => {
    setUnscheduledOpen(unscheduledPendingMentorships.length > 0);
    setMonthlyDueOpen(monthlyDuePayments.length > 0);
    setMonthlySoldOpen(monthlySoldMentorships.length > 0);
  }, [unscheduledPendingMentorships.length, monthlyDuePayments.length, monthlySoldMentorships.length]);

  // Format month name with first letter capitalized
  const formatMonthYear = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ` de ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Project Filter */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtrar por Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {mentorshipProjects.map(project => (
                <SelectItem key={project.key} value={project.key}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <MentorshipSummaryCards {...summaryData} />

      {/* Add Mentorship Form */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Nova Mentoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MentorshipForm onAddMentorship={onAddMentorship} />
        </CardContent>
      </Card>

      {/* Mentorship Tables */}
      <MentorshipTable
        unscheduledPendingMentorships={unscheduledPendingMentorships}
        monthlyDuePayments={monthlyDuePayments}
        monthlySoldMentorships={monthlySoldMentorships}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        unscheduledOpen={unscheduledOpen}
        monthlyDueOpen={monthlyDueOpen}
        monthlySoldOpen={monthlySoldOpen}
        onUnscheduledOpenChange={setUnscheduledOpen}
        onMonthlyDueOpenChange={setMonthlyDueOpen}
        onMonthlySoldOpenChange={setMonthlySoldOpen}
        onUpdateMentorship={onUpdateMentorship}
        onDeleteMentorship={onDeleteMentorship}
        onAddPayment={onAddPayment}
        onReceivePayment={onReceivePayment}
      />

      {/* Mentorship Receipts History for Selected Month */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
            📊 Histórico de Recebimentos de Mentorias - {formatMonthYear(selectedMonth, selectedYear)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mentorshipReceipts.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 pb-3 border-b">Recebimentos do Mês</h3>
                <div className="space-y-3">
                  {mentorshipReceipts.map((receipt, index) => {
                    const receivedDate = new Date(receipt.receivedDate);
                    const dueDate = receipt.dueDate ? new Date(receipt.dueDate) : null;
                    const isEarly = dueDate && receivedDate < dueDate && receipt.type !== 'sale';
                    
                    return (
                      <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800">{receipt.mentorshipName}</span>
                            {isEarly && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Adiantado</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Projeto:</span> {getProjectDisplayName(receipt.project)}
                            </div>
                            <div>
                              <span className="text-gray-500">Tipo:</span> {receipt.type === 'sale' ? 'Venda inicial' : 'Pagamento agendado'}
                            </div>
                            <div>
                              <span className="text-gray-500">Recebido em:</span> {receivedDate.toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <span className="text-gray-500">Vencimento:</span> {dueDate ? dueDate.toLocaleDateString('pt-BR') : '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              R$ {receipt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoReceipt(receipt)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            title="Desfazer recebimento"
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum recebimento de mentoria encontrado para {formatMonthYear(selectedMonth, selectedYear)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
