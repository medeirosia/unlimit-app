
export interface Transaction {
  id: string;
  project: string;
  type: 'revenue' | 'investment' | 'low-ticket-revenue';
  amount: number;
  date: string;
  description?: string;
  createdAt?: string;
}

export interface MentorshipPayment {
  id: string;
  amount: number;
  dueDate?: string;
  receivedDate?: string;
  status: 'pendente' | 'recebido';
}

export interface Mentorship {
  id: string;
  project: 'matheus' | 'kenneth';
  clientName: string;
  totalValue: number;
  receivedValue: number;
  pendingValue: number;
  date: string;
  payments: MentorshipPayment[];
  observations?: string;
}

export interface MentorshipHistory {
  id: string;
  mentorshipId: string;
  type: 'venda_inicial' | 'pagamento_agendado';
  amount: number;
  transactionDate: string;
  description?: string;
  createdAt: string;
}

export interface ProjectData {
  id: string;
  name: string;
  revenue: number;
  investment: number;
  roas: number;
  profit: number;
  lowTicketRevenue?: number;
  mentorshipRevenue?: number;
  lowTicketRoas?: number;
  mentorshipRoas?: number;
}
