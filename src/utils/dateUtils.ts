
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Fuso horário do Brasil (São Paulo)
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata uma data para o fuso horário brasileiro
 */
export const formatDateBrazil = (date: string | Date, formatString: string = 'dd/MM/yyyy HH:mm'): string => {
  try {
    const dateToFormat = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateToFormat, BRAZIL_TIMEZONE, formatString, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Formata apenas a data (sem horário) para o fuso horário brasileiro
 * 🎯 CORREÇÃO CRÍTICA: Detecta datas UTC de meia-noite (criadas de due_date) e trata como data local
 */
export const formatDateOnlyBrazil = (date: string | Date): string => {
  try {
    // Se é uma string no formato YYYY-MM-DD, criar data local sem timezone
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, 'dd/MM/yyyy', { locale: ptBR });
    }
    
    // 🎯 CORREÇÃO CRÍTICA: Detectar datas UTC de meia-noite (transaction_date criadas de due_date)
    if (typeof date === 'string' && (
      date.includes('T00:00:00') || 
      date.includes(' 00:00:00+00') ||
      date.includes(' 00:00:00.000Z') ||
      date.endsWith('Z') && date.includes('T00:00:00')
    )) {
      console.log('🎯 [formatDateOnlyBrazil] Detectada data UTC de meia-noite:', date);
      
      // Extrair apenas a parte da data (YYYY-MM-DD) e tratar como data local
      const datePart = date.split('T')[0]; // Pega apenas a parte antes do T
      const [year, month, day] = datePart.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      
      console.log('🎯 [formatDateOnlyBrazil] Convertida para data local:', localDate.toISOString());
      return format(localDate, 'dd/MM/yyyy', { locale: ptBR });
    }
    
    // Para outros formatos, usar o método padrão
    return formatDateBrazil(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Formata data e hora para o fuso horário brasileiro
 */
export const formatDateTimeBrazil = (date: string | Date): string => {
  return formatDateBrazil(date, 'dd/MM/yyyy HH:mm:ss');
};

/**
 * Converte uma data para o fuso horário brasileiro
 */
export const toBrazilTime = (date: string | Date): Date => {
  const dateToConvert = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateToConvert, BRAZIL_TIMEZONE);
};

/**
 * Obtém a data atual no fuso horário brasileiro
 */
export const getNowBrazil = (): Date => {
  return toBrazilTime(new Date());
};

/**
 * Formata uma data ISO string para exibição no Brasil
 */
export const formatISODateBrazil = (isoDate: string): string => {
  try {
    return formatDateBrazil(isoDate, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Erro ao formatar data ISO:', error);
    return 'Data inválida';
  }
};

/**
 * Formata uma string de data usando o fuso horário brasileiro
 * Esta função mantém compatibilidade com código existente
 */
export const formatDateString = (dateString: string): string => {
  return formatDateOnlyBrazil(dateString);
};
