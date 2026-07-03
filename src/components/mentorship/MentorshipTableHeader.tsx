
interface MentorshipTableHeaderProps {
  showUnscheduledColumn?: boolean;
  showActions?: boolean;
  showDueDateColumn?: boolean;
}

export const MentorshipTableHeader = ({ 
  showUnscheduledColumn = false, 
  showActions = true,
  showDueDateColumn = false 
}: MentorshipTableHeaderProps) => {
  return (
    <thead>
      <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
        <th className="px-4 py-3">Cliente</th>
        <th className="px-4 py-3">Projeto</th>
        <th className="px-4 py-3">Valor Total</th>
        <th className="px-4 py-3">Recebido</th>
        <th className="px-4 py-3">Pendente</th>
        <th className="px-4 py-3">Data Venda</th>
        {showDueDateColumn && <th className="px-4 py-3">Vencimento</th>}
        {showUnscheduledColumn && <th className="px-4 py-3">Não Agendado</th>}
        {showActions && <th className="px-4 py-3">Ações</th>}
      </tr>
    </thead>
  );
};
