
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';

interface MonthYearFilterProps {
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export const MonthYearFilter = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}: MonthYearFilterProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const months = [
    { value: '01', label: 'Jan', fullLabel: 'Janeiro' },
    { value: '02', label: 'Fev', fullLabel: 'Fevereiro' },
    { value: '03', label: 'Mar', fullLabel: 'Março' },
    { value: '04', label: 'Abr', fullLabel: 'Abril' },
    { value: '05', label: 'Mai', fullLabel: 'Maio' },
    { value: '06', label: 'Jun', fullLabel: 'Junho' },
    { value: '07', label: 'Jul', fullLabel: 'Julho' },
    { value: '08', label: 'Ago', fullLabel: 'Agosto' },
    { value: '09', label: 'Set', fullLabel: 'Setembro' },
    { value: '10', label: 'Out', fullLabel: 'Outubro' },
    { value: '11', label: 'Nov', fullLabel: 'Novembro' },
    { value: '12', label: 'Dez', fullLabel: 'Dezembro' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const currentMonthData = months.find(m => m.value === selectedMonth);
  const displayLabel = isMobile 
    ? `${currentMonthData?.label || ''} ${selectedYear}`
    : `${currentMonthData?.fullLabel || ''} ${selectedYear}`;

  const goToPreviousMonth = () => {
    const monthNum = parseInt(selectedMonth);
    const yearNum = parseInt(selectedYear);
    
    if (monthNum === 1) {
      onMonthChange('12');
      onYearChange(String(yearNum - 1));
    } else {
      onMonthChange(String(monthNum - 1).padStart(2, '0'));
    }
  };

  const goToNextMonth = () => {
    const monthNum = parseInt(selectedMonth);
    const yearNum = parseInt(selectedYear);
    
    if (monthNum === 12) {
      onMonthChange('01');
      onYearChange(String(yearNum + 1));
    } else {
      onMonthChange(String(monthNum + 1).padStart(2, '0'));
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(String(now.getMonth() + 1).padStart(2, '0'));
    onYearChange(String(now.getFullYear()));
    setIsOpen(false);
  };

  const selectMonth = (monthValue: string) => {
    onMonthChange(monthValue);
    setIsOpen(false);
  };

  const selectYear = (year: number) => {
    onYearChange(String(year));
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === String(now.getMonth() + 1).padStart(2, '0') && 
           selectedYear === String(now.getFullYear());
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-slate-600 hover:text-slate-900 hover:bg-slate-100`}
      >
        <ChevronLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={`${isMobile ? 'h-8 px-2 text-sm min-w-[100px]' : 'h-10 px-4 min-w-[160px]'} font-medium text-slate-700 hover:bg-slate-100 gap-2`}
          >
            <Calendar className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-slate-500`} />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-white" align="center">
          <div className="p-3 space-y-3">
            {/* Quick action: Go to current month */}
            {!isCurrentMonth() && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="w-full text-sm font-medium"
              >
                Ir para mês atual
              </Button>
            )}

            {/* Year selector */}
            <div className="flex items-center justify-center gap-1 pb-2 border-b border-slate-100">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === String(year) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => selectYear(year)}
                  className={`text-xs px-2 h-7 ${
                    selectedYear === String(year) 
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {year}
                </Button>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {months.map((month) => {
                const isSelected = selectedMonth === month.value;
                const now = new Date();
                const isCurrent = month.value === String(now.getMonth() + 1).padStart(2, '0') && 
                                  selectedYear === String(now.getFullYear());
                
                return (
                  <Button
                    key={month.value}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => selectMonth(month.value)}
                    className={`h-9 text-sm font-medium ${
                      isSelected 
                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                        : isCurrent
                          ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 ring-1 ring-slate-300'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {month.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} text-slate-600 hover:text-slate-900 hover:bg-slate-100`}
      >
        <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
      </Button>
    </div>
  );
};
