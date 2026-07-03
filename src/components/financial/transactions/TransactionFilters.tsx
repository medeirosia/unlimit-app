
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search } from 'lucide-react';

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAccount: string;
  onAccountChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  bankAccounts: BankAccount[];
}

export const TransactionFilters = ({
  searchTerm,
  onSearchChange,
  selectedAccount,
  onAccountChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  bankAccounts
}: TransactionFiltersProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Select value={selectedAccount} onValueChange={onAccountChange}>
            <SelectTrigger className="h-9 text-xs px-2">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todas</SelectItem>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="h-9 text-xs px-2">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="deposit">Depósito</SelectItem>
              <SelectItem value="withdrawal">Saque</SelectItem>
              <SelectItem value="transfer">Transf.</SelectItem>
              <SelectItem value="payment">Pagamento</SelectItem>
              <SelectItem value="receipt">Receb.</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 text-xs px-2">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="date-desc">+ Recente</SelectItem>
              <SelectItem value="date-asc">+ Antiga</SelectItem>
              <SelectItem value="amount-desc">+ Valor</SelectItem>
              <SelectItem value="amount-asc">- Valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-64">
        <Input
          placeholder="Buscar transações..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Select value={selectedAccount} onValueChange={onAccountChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por conta" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">Todas as contas</SelectItem>
          {bankAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="deposit">Depósito</SelectItem>
          <SelectItem value="withdrawal">Saque</SelectItem>
          <SelectItem value="transfer">Transferência</SelectItem>
          <SelectItem value="payment">Pagamento</SelectItem>
          <SelectItem value="receipt">Recebimento</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="date-desc">Mais recente primeiro</SelectItem>
          <SelectItem value="date-asc">Mais antiga primeiro</SelectItem>
          <SelectItem value="amount-desc">Maior valor primeiro</SelectItem>
          <SelectItem value="amount-asc">Menor valor primeiro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
