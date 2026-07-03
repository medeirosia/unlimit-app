import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardOverview } from '@/components/DashboardOverview';
import { ProjectManagement } from '@/components/ProjectManagement';
import { TransactionForm } from '@/components/TransactionForm';
import { MentorshipList } from '@/components/MentorshipList';
import { ProjectSettings } from '@/components/settings/ProjectSettings';
import { TransactionTypesSettings } from '@/components/settings/TransactionTypesSettings';
import { PermissionsPanel } from '@/components/settings/PermissionsPanel';
import { ChangePasswordPanel } from '@/components/settings/ChangePasswordPanel';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { ProjectData, Transaction, Mentorship } from '@/types/dashboard';

interface TabContentProps {
  projectsData: ProjectData[];
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  mentorships: Mentorship[];
  selectedMonth: number;
  selectedYear: number;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUndoTransaction: (transactionId: string) => void;
  onEditPendingTransaction: (transactionId: string, updatedTransaction: Omit<Transaction, 'id'>) => void;
  onDeletePendingTransaction: (transactionId: string) => void;
  onRestorePendingTransaction: (transactionId: string) => void;
  onAddMentorship: (mentorship: Omit<Mentorship, 'id' | 'pendingValue' | 'payments'>) => void;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
  onDeleteMentorship: (mentorshipId: string) => void;
  onAddPayment: (mentorshipId: string, payment: any) => void;
  onReceivePayment: (paymentId: string) => void;
}

export const TabContent = ({
  projectsData, transactions, pendingTransactions, mentorships,
  selectedMonth, selectedYear, onAddTransaction, onUndoTransaction,
  onEditPendingTransaction, onDeletePendingTransaction, onRestorePendingTransaction,
  onAddMentorship, onUpdateMentorship, onDeleteMentorship, onAddPayment, onReceivePayment,
}: TabContentProps) => {
  const { can } = useGlobalPermissions();
  const canManagePerms = can('sistema.gerenciar_permissoes');

  return (
    <>
      {can('inicio.painel_geral') && (
        <TabsContent value="overview">
          <DashboardOverview
            projectsData={projectsData}
            transactions={transactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>
      )}

      {can('inicio.projetos') && (
        <TabsContent value="projects">
          <ProjectManagement
            projectsData={projectsData}
            transactions={transactions}
            mentorships={mentorships}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>
      )}

      {can('inicio.lancamentos') && (
        <TabsContent value="transactions">
          <TransactionForm
            onAddTransaction={onAddTransaction}
            transactions={transactions}
            mentorships={mentorships}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onUndoTransaction={onUndoTransaction}
            onEditPendingTransaction={onEditPendingTransaction}
            onDeletePendingTransaction={onDeletePendingTransaction}
            onRestorePendingTransaction={onRestorePendingTransaction}
            pendingTransactions={pendingTransactions}
            onUpdateMentorship={onUpdateMentorship}
          />
        </TabsContent>
      )}

      {can('inicio.mentorias') && (
        <TabsContent value="mentorships">
          <MentorshipList
            mentorships={mentorships}
            onAddMentorship={onAddMentorship}
            onUpdateMentorship={onUpdateMentorship}
            onDeleteMentorship={onDeleteMentorship}
            onAddPayment={onAddPayment}
            onReceivePayment={onReceivePayment}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </TabsContent>
      )}

      {can('inicio.configuracoes') && (
        <TabsContent value="settings">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurações</h2>
              <p className="text-slate-600 mb-6">Gerencie configurações gerais do sistema</p>
            </div>

            <Tabs defaultValue="account" className="w-full">
              <TabsList className={`grid w-full ${canManagePerms ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="account">🔐 Minha Conta</TabsTrigger>
                {canManagePerms && <TabsTrigger value="permissions">🛡️ Permissões</TabsTrigger>}
                <TabsTrigger value="projects">🎯 Projetos</TabsTrigger>
                <TabsTrigger value="transaction-types">📝 Tipos de Transação</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="account"><ChangePasswordPanel /></TabsContent>
                {canManagePerms && (
                  <TabsContent value="permissions"><PermissionsPanel /></TabsContent>
                )}
                <TabsContent value="projects"><ProjectSettings /></TabsContent>
                <TabsContent value="transaction-types"><TransactionTypesSettings /></TabsContent>
              </div>
            </Tabs>
          </div>
        </TabsContent>
      )}
    </>
  );
};
