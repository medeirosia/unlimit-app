
import React from 'react';

interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  from_account_id: string | null;
  to_account_id: string | null;
  reference_id: string | null;
  reference_type: string | null;
  transaction_date: string;
  created_at: string;
  status?: string;
  is_platform_withdrawal?: boolean;
  from_account?: { name: string };
  to_account?: { name: string };
}

interface TransactionStatusIndicatorProps {
  transaction: FinancialTransaction;
}

export const TransactionStatusIndicator = ({ transaction }: TransactionStatusIndicatorProps) => {
  const getTransactionTypeAndStatus = () => {
    // 🚨 SAQUE DE PLATAFORMA (is_platform_withdrawal = true)
    if (transaction.is_platform_withdrawal) {
      if (transaction.status === 'pending') {
        return {
          label: 'Saque Pendente',
          color: 'bg-yellow-100 text-yellow-800'
        };
      } else if (transaction.status === 'confirmed') {
        return {
          label: 'Saque Confirmado',
          color: 'bg-green-100 text-green-800'
        };
      }
      return {
        label: 'Saque de Plataforma',
        color: 'bg-purple-100 text-purple-800'
      };
    }

    // Transferência que é resultado de saque confirmado
    if (transaction.type === 'transfer' && transaction.reference_type === 'withdrawal') {
      return {
        label: 'Saque Confirmado',
        color: 'bg-green-100 text-green-800'
      };
    }

    // Transferência normal
    if (transaction.type === 'transfer') {
      return {
        label: 'Transferência',
        color: 'bg-blue-100 text-blue-800'
      };
    }

    // Pagamento
    if (transaction.type === 'payment') {
      return {
        label: 'Pagamento',
        color: 'bg-red-100 text-red-800'
      };
    }

    // Recebimento
    if (transaction.type === 'receipt') {
      return {
        label: 'Recebimento',
        color: 'bg-green-100 text-green-800'
      };
    }

    // Ajuste
    if (transaction.type === 'adjustment') {
      return {
        label: 'Ajuste',
        color: 'bg-gray-100 text-gray-800'
      };
    }

    // Tipo desconhecido
    return {
      label: transaction.type || 'Desconhecido',
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const { label, color } = getTransactionTypeAndStatus();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};
