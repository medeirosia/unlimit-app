
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Scale, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  bank_account_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  expense_categories?: { name: string };
  bank_accounts?: { name: string };
}

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  bank_account_id: string;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  bank_accounts?: { name: string };
  receivable_categories?: { name: string };
}

interface FinancialSummaryCardsProps {
  bankAccounts: BankAccount[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
}

export const FinancialSummaryCards = ({ 
  bankAccounts, 
  accountsPayable, 
  accountsReceivable 
}: FinancialSummaryCardsProps) => {
  const isMobile = useIsMobile();
  const { can } = useGlobalPermissions();
  const canSeeTotal = can('financeiro.contas.saldo_total');
  const visibleAccounts = bankAccounts.filter(a => can('financeiro.contas.ver_conta', a.id));
  const totalBalance = visibleAccounts.reduce((sum, account) => sum + account.balance, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const inCurrentMonth = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const [y, m] = dateStr.split('-').map(Number);
    return y === currentYear && (m - 1) === currentMonth;
  };

  const receitasMes = accountsReceivable
    .filter(r => inCurrentMonth(r.due_date))
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const despesasMes = accountsPayable
    .filter(p => inCurrentMonth(p.due_date))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const lucroLiquido = receitasMes - despesasMes;

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    {
      title: 'Saldo Total',
      value: canSeeTotal ? fmt(totalBalance) : '— oculto —',
      icon: canSeeTotal ? DollarSign : EyeOff,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    },
    {
      title: 'Receitas do Mês',
      value: fmt(receitasMes),
      icon: TrendingUp,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      title: 'Despesas do Mês',
      value: fmt(despesasMes),
      icon: TrendingDown,
      gradient: 'bg-gradient-to-r from-red-500 to-rose-600',
    },
    {
      title: 'Lucro Líquido',
      value: fmt(lucroLiquido),
      icon: Scale,
      gradient: lucroLiquido >= 0
        ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
        : 'bg-gradient-to-r from-rose-500 to-red-600',
    },
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={`${card.gradient} text-white border-0 shadow-md`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium opacity-90">{card.title}</span>
                  <Icon className="h-3 w-3 opacity-80" />
                </div>
                <div className="text-base font-bold truncate">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop layout - same visual identity as mobile with gradient cards
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`${card.gradient} text-white border-0 shadow-md rounded-lg overflow-hidden`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium opacity-90">{card.title}</span>
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <div className="text-lg font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
