
export const filterDataByPeriod = (data: any[], dateField: string, selectedMonth: string, selectedYear: string) => {
  console.log('🔍 [filterDataByPeriod] Iniciando filtro:', {
    dataLength: data.length,
    dateField,
    selectedMonth,
    selectedYear
  });

  const filtered = data.filter(item => {
    let itemDate: Date;
    
    console.log('🔍 [filterDataByPeriod] Processando item:', {
      id: item.id,
      description: item.description,
      dateField,
      rawDateValue: item[dateField],
      is_received: item.is_received,
      received_date: item.received_date,
      created_at: item.created_at
    });
    
    // CORREÇÃO: Simplificar lógica de filtro para ser mais consistente
    // Usar sempre o campo de data especificado para filtro de período
    if (typeof item[dateField] === 'string' && item[dateField].includes('-') && !item[dateField].includes('T')) {
      // Se é uma data no formato YYYY-MM-DD, criar data sem adicionar timezone
      const dateParts = item[dateField].split('-');
      itemDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      console.log('📅 [filterDataByPeriod] Data parseada localmente:', {
        original: item[dateField],
        parsed: itemDate.toISOString()
      });
    } else {
      itemDate = new Date(item[dateField]);
      console.log('📅 [filterDataByPeriod] Data parseada diretamente:', {
        original: item[dateField],
        parsed: itemDate.toISOString()
      });
    }
    
    const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
    const itemYear = String(itemDate.getFullYear());
    
    const matches = itemMonth === selectedMonth && itemYear === selectedYear;
    
    console.log('🔍 [filterDataByPeriod] Resultado do filtro:', {
      description: item.description,
      dataUsada: itemDate.toISOString(),
      periodoItem: `${itemMonth}/${itemYear}`,
      filtro: `${selectedMonth}/${selectedYear}`,
      match: matches
    });
    
    return matches;
  });

  console.log('✅ [filterDataByPeriod] Filtro concluído:', {
    originalLength: data.length,
    filteredLength: filtered.length,
    period: `${selectedMonth}/${selectedYear}`
  });

  return filtered;
};
