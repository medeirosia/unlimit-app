
import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Formatar valor para exibição
    const formatCurrency = (num: number): string => {
      if (num === 0) return '';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(num);
    };

    // Converter string formatada para número
    const parseCurrency = (str: string): number => {
      if (!str) return 0;
      // Remove todos os caracteres exceto números
      const cleanValue = str.replace(/[^\d]/g, '');
      if (!cleanValue) return 0;
      
      // Converte para número dividindo por 100 (centavos para reais)
      const numValue = parseInt(cleanValue, 10) || 0;
      return numValue / 100;
    };

    // Atualizar displayValue quando value prop mudar
    React.useEffect(() => {
      setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permitir apenas números
      const cleanValue = inputValue.replace(/[^\d]/g, '');
      
      if (cleanValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      // Converter para número
      const numericValue = parseCurrency(cleanValue);
      
      // Atualizar o valor
      onChange(numericValue);
      
      // Formatar para exibição durante a digitação
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(numericValue);
      
      setDisplayValue(formattedValue);
    };

    const handleFocus = () => {
      // Ao focar, mostrar valor numérico limpo se for 0
      if (value === 0) {
        setDisplayValue('');
      }
    };

    const handleBlur = () => {
      // Ao sair do foco, formatar o valor
      setDisplayValue(formatCurrency(value));
    };

    return (
      <input
        type="text"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="R$ 0,00"
        ref={ref}
        {...props}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
