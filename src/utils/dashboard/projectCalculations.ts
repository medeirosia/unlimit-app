
import { Transaction, Mentorship, ProjectData } from '@/types/dashboard';

// Hook será usado no componente que chama esta função
export const calculateProjectData = (
  transactions: Transaction[],
  mentorships: Mentorship[],
  selectedMonth: number,
  selectedYear: number,
  activeProjects: Array<{ key: string; name: string }> = []
): ProjectData[] => {
  // Se não foram passados projetos ativos, usar os padrão (para compatibilidade)
  const projects = activeProjects.length > 0 
    ? activeProjects.map(p => p.key)
    : ['low-ticket', 'matheus', 'kenneth'];
  
  const projectsData = projects.map(projectId => {
    const projectTransactions = transactions.filter(t => {
      if (t.project !== projectId) return false;
      
      let transactionDate: Date;
      
      // Se é uma string no formato YYYY-MM-DD, criar data local sem timezone
      if (typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = t.date.split('-').map(Number);
        transactionDate = new Date(year, month - 1, day);
      } else {
        transactionDate = new Date(t.date);
      }
      
      return transactionDate.getMonth() + 1 === selectedMonth &&
             transactionDate.getFullYear() === selectedYear;
    });

    const projectMentorships = mentorships.filter(m => {
      if (m.project !== projectId) return false;
      
      let mentorshipDate: Date;
      
      // Se é uma string no formato YYYY-MM-DD, criar data local sem timezone
      if (typeof m.date === 'string' && m.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = m.date.split('-').map(Number);
        mentorshipDate = new Date(year, month - 1, day);
      } else {
        mentorshipDate = new Date(m.date);
      }
      
      return mentorshipDate.getMonth() + 1 === selectedMonth &&
             mentorshipDate.getFullYear() === selectedYear;
    });

    // Filtra transações que NÃO são de mentorias para evitar duplicidade
    const revenue = projectTransactions
      .filter(t => (t.type === 'revenue' || t.type === 'low-ticket-revenue') && !t.description?.includes('Mentoria'))
      .reduce((sum, t) => sum + t.amount, 0);

    const investment = projectTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    const mentorshipRevenue = projectMentorships
      .reduce((sum, m) => sum + m.receivedValue, 0);

    const lowTicketRevenue = projectTransactions
      .filter(t => t.type === 'low-ticket-revenue' && !t.description?.includes('Mentoria'))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRevenue = revenue + mentorshipRevenue;
    const roas = investment > 0 ? totalRevenue / investment : 0;
    const profit = totalRevenue - investment;

    const lowTicketRoas = investment > 0 ? lowTicketRevenue / investment : 0;

    // Usar nome do projeto ativo ou fallback para os padrão
    const projectName = activeProjects.find(p => p.key === projectId)?.name || 
                       (projectId === 'low-ticket' ? 'Low-ticket BR' :
                        projectId === 'matheus' ? 'Projeto Matheus' : 'Projeto Kenneth');

    return {
      id: projectId,
      name: projectName,
      revenue: totalRevenue,
      investment,
      roas,
      profit,
      lowTicketRevenue,
      lowTicketRoas,
      mentorshipRevenue,
    };
  });

  // Filtrar projetos sem faturamento e sem investimento (não mostrar projetos vazios)
  return projectsData.filter(p => p.revenue > 0 || p.investment > 0);
};
