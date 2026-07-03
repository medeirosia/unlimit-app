import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { FinancialModule } from '@/components/FinancialModule';
import { MonthYearFilter } from '@/components/financial/MonthYearFilter';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
const logoEcom = { url: '/logo-unlimit-ecom.png' };

const Financial = () => {
  const { signOut, user } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useUserPermissions();
  const isMobile = useIsMobile();

  // Estado do filtro de período
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return String(now.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return String(now.getFullYear());
  });

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('financial')) {
      console.log('Usuário sem permissão para módulo financeiro');
      toast.error('Você não tem permissão para acessar o módulo financeiro');
    }
  }, [hasPermission, permissionsLoading]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const getFirstName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  const getInitials = () => {
    const name = getFirstName();
    return name.slice(0, 1).toUpperCase();
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  if (!hasPermission('financial')) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <div className="min-h-full p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {isMobile ? (
          <div className="flex items-center justify-between">
            <img src={logoEcom.url} alt="UNLIMIT ECOM" className="h-5 w-auto object-contain" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-slate-900 border-0 text-white font-semibold hover:bg-slate-800"
                >
                  {getInitials()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{getFirstName()}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <img src={logoEcom.url} alt="UNLIMIT ECOM" className="h-6 w-auto object-contain" />

            <div className="flex items-center gap-4">
              <MonthYearFilter
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onYearChange={setSelectedYear}
              />
            </div>
          </div>
        )}

        {/* Filtro de Período - Mobile */}
        {isMobile && (
          <div className="bg-white rounded-xl py-1 px-2 flex items-center justify-center shadow-sm border border-slate-100">
            <MonthYearFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>
        )}

        {/* Módulo Financeiro */}
        <FinancialModule 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </div>
    </div>
  );
};

export default Financial;
