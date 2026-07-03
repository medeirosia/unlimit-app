
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface AccountPayable {
  id: string;
  amount: number;
  category_id: string;
  due_date: string;
  paid_date: string | null;
  is_paid: boolean;
}

interface AccountReceivable {
  id: string;
  amount: number;
  due_date: string;
  received_date: string | null;
  is_received: boolean;
}

interface ExportPdfButtonProps {
  selectedMonth: string;
  selectedYear: string;
  totalReceivables: number;
  totalPayables: number;
  distributionAmount: number;
  receivablesByCategory: CategoryData[];
  payablesByCategory: CategoryData[];
  previousMonthData?: {
    totalReceivables: number;
    totalPayables: number;
    distributionAmount: number;
  };
  currentBalance: number;
  allAccountsPayable?: AccountPayable[];
  allAccountsReceivable?: AccountReceivable[];
  distributionCategoryId?: string | null;
  salaryCategoryId?: string | null;
}

export const ExportPdfButton = ({
  selectedMonth,
  selectedYear,
  totalReceivables,
  totalPayables,
  distributionAmount,
  receivablesByCategory,
  payablesByCategory,
  previousMonthData,
  currentBalance,
  allAccountsPayable,
  allAccountsReceivable,
  distributionCategoryId,
  salaryCategoryId
}: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getMonthName = (month: string) => months[parseInt(month) - 1];
  
  const getPreviousMonthName = () => {
    const monthNum = parseInt(selectedMonth);
    if (monthNum === 1) {
      return `Dezembro/${parseInt(selectedYear) - 1}`;
    }
    return `${months[monthNum - 2]}/${selectedYear}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Despesas operacionais = Total de despesas - Distribuição de lucros
      const operationalExpenses = totalPayables - distributionAmount;
      // Lucro = Faturamento - Despesas operacionais (sem distribuição)
      const profit = totalReceivables - operationalExpenses;
      // Lucro após distribuição
      const profitAfterDistribution = profit - distributionAmount;

      // Filtrar categorias de despesas para remover distribuição de lucros
      const operationalExpensesByCategory = payablesByCategory.filter(
        cat => !cat.category.toLowerCase().includes('distribuição de lucros') && 
               !cat.category.toLowerCase().includes('distribuicao de lucros')
      );

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Financeiro', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`${getMonthName(selectedMonth)} de ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);

      // Resumo Financeiro
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo do Período', 14, yPos);

      const summaryData = [
        ['Faturamento Total', formatCurrency(totalReceivables)],
        ['Despesas Operacionais', formatCurrency(operationalExpenses)],
        ['Lucro do Período', formatCurrency(profit)],
        ['', ''],
        ['Distribuição de Lucros (Retirada)', formatCurrency(distributionAmount)],
        ['Lucro Após Distribuição', formatCurrency(profitAfterDistribution)],
        ['Saldo em Caixa Atual', formatCurrency(currentBalance)]
      ];

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Indicador', 'Valor']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'right' }
        },
        didParseCell: (data) => {
          // Alinhar header "Valor" à direita
          if (data.section === 'head' && data.column.index === 1) {
            data.cell.styles.halign = 'right';
          }
          // Destacar linha de lucro
          if (data.row.index === 2 && data.section === 'body') {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          }
          // Destacar linha de distribuição (informativo)
          if (data.row.index === 4 && data.section === 'body') {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          }
          // Destacar linha de lucro após distribuição
          if (data.row.index === 5 && data.section === 'body') {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [30, 64, 175];
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Comparação com mês anterior
      if (previousMonthData) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Comparação com ${getPreviousMonthName()}`, 14, yPos);

        // Mês anterior: despesas operacionais sem distribuição
        const prevOperationalExpenses = previousMonthData.totalPayables - previousMonthData.distributionAmount;
        const prevProfit = previousMonthData.totalReceivables - prevOperationalExpenses;
        const prevProfitAfterDist = prevProfit - previousMonthData.distributionAmount;

        const comparisonData = [
          [
            'Faturamento',
            formatCurrency(previousMonthData.totalReceivables),
            formatCurrency(totalReceivables),
            `${calculateVariation(totalReceivables, previousMonthData.totalReceivables).toFixed(1)}%`
          ],
          [
            'Despesas Operacionais',
            formatCurrency(prevOperationalExpenses),
            formatCurrency(operationalExpenses),
            `${calculateVariation(operationalExpenses, prevOperationalExpenses).toFixed(1)}%`
          ],
          [
            'Lucro do Período',
            formatCurrency(prevProfit),
            formatCurrency(profit),
            `${calculateVariation(profit, prevProfit).toFixed(1)}%`
          ],
          [
            'Distribuição (Retirada)',
            formatCurrency(previousMonthData.distributionAmount),
            formatCurrency(distributionAmount),
            `${calculateVariation(distributionAmount, previousMonthData.distributionAmount).toFixed(1)}%`
          ],
          [
            'Lucro Após Distribuição',
            formatCurrency(prevProfitAfterDist),
            formatCurrency(profitAfterDistribution),
            `${calculateVariation(profitAfterDistribution, prevProfitAfterDist).toFixed(1)}%`
          ]
        ];

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Indicador', 'Mês Anterior', 'Mês Atual', 'Variação']],
          body: comparisonData,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          },
          didParseCell: (data) => {
            // Alinhar headers à direita (exceto Indicador)
            if (data.section === 'head' && data.column.index > 0) {
              data.cell.styles.halign = 'right';
            }
            // Destacar linha de lucro
            if (data.row.index === 2 && data.section === 'body') {
              data.cell.styles.fillColor = [220, 252, 231];
            }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Receitas por Categoria
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Receitas por Categoria', 14, yPos);

      if (receivablesByCategory.length > 0) {
        const revenueData = receivablesByCategory.map(cat => [
          cat.category,
          cat.count.toString(),
          formatCurrency(cat.total),
          `${((cat.total / totalReceivables) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Categoria', 'Qtd', 'Valor', '% do Total']],
          body: revenueData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          },
          foot: [['Total', '', formatCurrency(totalReceivables), '100%']],
          footStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
          didParseCell: (data) => {
            if (data.section === 'head' && data.column.index > 0) {
              data.cell.styles.halign = data.column.index === 1 ? 'center' : 'right';
            }
            if (data.section === 'foot' && data.column.index > 1) {
              data.cell.styles.halign = 'right';
            }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Nenhuma receita registrada no período.', 14, yPos);
        yPos += 15;
      }

      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Despesas Operacionais por Categoria (sem distribuição de lucros)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Despesas Operacionais por Categoria', 14, yPos);

      if (operationalExpensesByCategory.length > 0) {
        const expenseData = operationalExpensesByCategory.map(cat => [
          cat.category,
          cat.count.toString(),
          formatCurrency(cat.total),
          `${((cat.total / totalReceivables) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Categoria', 'Qtd', 'Valor', '% do Faturamento']],
          body: expenseData,
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          },
          foot: [['Total Operacional', '', formatCurrency(operationalExpenses), `${((operationalExpenses / totalReceivables) * 100).toFixed(1)}%`]],
          footStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
          didParseCell: (data) => {
            if (data.section === 'head' && data.column.index > 0) {
              data.cell.styles.halign = data.column.index === 1 ? 'center' : 'right';
            }
            if (data.section === 'foot' && data.column.index > 1) {
              data.cell.styles.halign = 'right';
            }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // ROAS para Tráfego Pago
        const trafficCategory = operationalExpensesByCategory.find(
          cat => cat.category.toLowerCase().includes('tráfego pago') || 
                 cat.category.toLowerCase().includes('trafego pago')
        );

        if (trafficCategory && trafficCategory.total > 0 && totalReceivables > 0) {
          const roas = totalReceivables / trafficCategory.total;
          const roasClassification = roas >= 3 ? 'Excelente' : roas >= 2 ? 'Bom' : roas >= 1 ? 'Regular' : 'Baixo';

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('ROAS - Retorno sobre Investimento em Ads', 14, yPos);

          const roasData = [
            ['Investimento em Tráfego Pago', formatCurrency(trafficCategory.total)],
            ['Faturamento Total', formatCurrency(totalReceivables)],
            ['ROAS (Faturamento / Investimento)', `${roas.toFixed(2)}x`],
            ['Classificação', roasClassification],
            ['Interpretação', `R$ ${roas.toFixed(2)} de retorno para cada R$ 1,00 investido`]
          ];

          autoTable(doc, {
            startY: yPos + 5,
            head: [['Indicador', 'Valor']],
            body: roasData,
            theme: 'striped',
            headStyles: { fillColor: [139, 92, 246], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: {
              0: { fontStyle: 'bold', halign: 'left' },
              1: { halign: 'right' }
            },
            didParseCell: (data) => {
              if (data.section === 'head' && data.column.index === 1) {
                data.cell.styles.halign = 'right';
              }
              // Destacar linha do ROAS
              if (data.row.index === 2 && data.section === 'body') {
                data.cell.styles.fillColor = [237, 233, 254];
                data.cell.styles.textColor = [91, 33, 182];
                data.cell.styles.fontStyle = 'bold';
              }
              // Colorir classificação
              if (data.row.index === 3 && data.section === 'body') {
                if (roasClassification === 'Excelente') {
                  data.cell.styles.fillColor = [220, 252, 231];
                  data.cell.styles.textColor = [22, 101, 52];
                } else if (roasClassification === 'Bom') {
                  data.cell.styles.fillColor = [219, 234, 254];
                  data.cell.styles.textColor = [30, 64, 175];
                } else if (roasClassification === 'Regular') {
                  data.cell.styles.fillColor = [254, 243, 199];
                  data.cell.styles.textColor = [146, 64, 14];
                } else {
                  data.cell.styles.fillColor = [254, 226, 226];
                  data.cell.styles.textColor = [153, 27, 27];
                }
              }
            }
          });

          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      } else {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Nenhuma despesa operacional registrada no período.', 14, yPos);
        yPos += 15;
      }

      // Análise de Margem
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise de Margens', 14, yPos);

      const marginProfit = totalReceivables > 0 ? ((profit / totalReceivables) * 100) : 0;
      const marginAfterDist = totalReceivables > 0 ? ((profitAfterDistribution / totalReceivables) * 100) : 0;
      const expenseRatio = totalReceivables > 0 ? ((operationalExpenses / totalReceivables) * 100) : 0;

      const marginData = [
        ['Margem de Lucro', `${marginProfit.toFixed(1)}%`],
        ['Margem Após Distribuição', `${marginAfterDist.toFixed(1)}%`],
        ['Índice de Despesas Operacionais', `${expenseRatio.toFixed(1)}%`]
      ];

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Indicador', 'Percentual']],
        body: marginData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'right' }
        },
        didParseCell: (data) => {
          if (data.section === 'head' && data.column.index === 1) {
            data.cell.styles.halign = 'right';
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Previsão de Salários e Comissões - Apenas para o mês vigente
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentYear = String(now.getFullYear());
      const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

      if (isCurrentMonth && salaryCategoryId && allAccountsPayable) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Previsão de Salários e Comissões', 14, yPos);

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const salaryHistory: { month: string; total: number }[] = [];

        // Pegar os últimos 3 meses antes do mês selecionado
        for (let i = 1; i <= 3; i++) {
          let month = parseInt(selectedMonth) - i;
          let year = parseInt(selectedYear);

          if (month <= 0) {
            month += 12;
            year -= 1;
          }

          const monthStr = String(month).padStart(2, '0');
          const yearStr = String(year);

          const monthPayables = allAccountsPayable.filter(p => {
            if (!p.is_paid || !p.paid_date) return false;
            if (p.category_id !== salaryCategoryId) return false;
            
            const dueDate = new Date(p.due_date + 'T12:00:00');
            return String(dueDate.getMonth() + 1).padStart(2, '0') === monthStr &&
                   String(dueDate.getFullYear()) === yearStr;
          });

          const total = monthPayables.reduce((sum, p) => sum + Number(p.amount), 0);
          
          salaryHistory.push({
            month: `${monthNames[month - 1]}/${yearStr.slice(2)}`,
            total
          });
        }

        // Ordenar do mais antigo para o mais recente
        salaryHistory.reverse();

        // Calcular média (apenas meses com valores > 0)
        const monthsWithData = salaryHistory.filter(m => m.total > 0);
        const average = monthsWithData.length > 0
          ? monthsWithData.reduce((sum, m) => sum + m.total, 0) / monthsWithData.length
          : 0;

        // Lucro real projetado
        const projectedProfit = profitAfterDistribution - average;

        if (average > 0) {
          const salaryData = [
            ...salaryHistory.map(m => [m.month, m.total > 0 ? formatCurrency(m.total) : '-']),
            ['', ''],
            ['Média Mensal (Previsão)', formatCurrency(average)],
            ['Lucro Após Distribuição', formatCurrency(profitAfterDistribution)],
            ['Lucro Real Projetado', formatCurrency(projectedProfit)]
          ];

          autoTable(doc, {
            startY: yPos + 5,
            head: [['Período / Indicador', 'Valor']],
            body: salaryData,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: {
              0: { fontStyle: 'bold', halign: 'left' },
              1: { halign: 'right' }
            },
            didParseCell: (data) => {
              if (data.section === 'head' && data.column.index === 1) {
                data.cell.styles.halign = 'right';
              }
              // Destacar linha de média
              if (data.row.index === 4 && data.section === 'body') {
                data.cell.styles.fillColor = [224, 231, 255];
                data.cell.styles.textColor = [67, 56, 202];
                data.cell.styles.fontStyle = 'bold';
              }
              // Destacar lucro real projetado
              if (data.row.index === 6 && data.section === 'body') {
                if (projectedProfit >= 0) {
                  data.cell.styles.fillColor = [220, 252, 231];
                  data.cell.styles.textColor = [22, 101, 52];
                } else {
                  data.cell.styles.fillColor = [254, 226, 226];
                  data.cell.styles.textColor = [153, 27, 27];
                }
                data.cell.styles.fontStyle = 'bold';
              }
            }
          });

          yPos = (doc as any).lastAutoTable.finalY + 5;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100);
          doc.text('* Previsão baseada na média dos últimos 3 meses. Lucro real = Lucro após distribuição - Previsão salários.', 14, yPos);
          doc.setTextColor(0);
          yPos += 10;
        }
      }

      // Histórico de Lucro - Últimos 6 Meses
      if (allAccountsReceivable && allAccountsPayable) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Histórico de Lucro - Últimos 6 Meses (Antes da Distribuição)', 14, yPos);

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();
        const profitHistoryData: string[][] = [];

        for (let i = 6; i >= 1; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear());

          const monthReceivables = allAccountsReceivable.filter(r => {
            if (!r.is_received) return false;
            const dueDate = new Date(r.due_date + 'T12:00:00');
            return String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
                   String(dueDate.getFullYear()) === year;
          });

          const monthPayables = allAccountsPayable.filter(p => {
            if (!p.is_paid || !p.paid_date) return false;
            const dueDate = new Date(p.due_date + 'T12:00:00');
            return String(dueDate.getMonth() + 1).padStart(2, '0') === month &&
                   String(dueDate.getFullYear()) === year;
          });

          const monthRevenue = monthReceivables.reduce((sum, r) => sum + Number(r.amount), 0);
          const monthExpenses = monthPayables.reduce((sum, p) => sum + Number(p.amount), 0);

          const monthDistribution = distributionCategoryId
            ? monthPayables
                .filter(p => p.category_id === distributionCategoryId)
                .reduce((sum, p) => sum + Number(p.amount), 0)
            : 0;

          const lucroAntes = monthRevenue - (monthExpenses - monthDistribution);

          profitHistoryData.push([
            `${monthNames[date.getMonth()]}/${year.slice(2)}`,
            formatCurrency(monthRevenue),
            formatCurrency(monthExpenses - monthDistribution),
            formatCurrency(lucroAntes)
          ]);
        }

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Mês', 'Faturamento', 'Despesas Op.', 'Lucro Antes Dist.']],
          body: profitHistoryData,
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          },
          didParseCell: (data) => {
            if (data.section === 'head' && data.column.index > 0) {
              data.cell.styles.halign = 'right';
            }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Evolução do Saldo em Caixa - Últimos 6 Meses
      if (allAccountsReceivable && allAccountsPayable) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Evolução do Saldo em Caixa - Últimos 6 Meses', 14, yPos);

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const now = new Date();

        // Calculate net income for each of the last 6 months
        const monthlyNetIncome: { monthName: string; netIncome: number }[] = [];

        for (let i = 0; i < 6; i++) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const targetMonth = targetDate.getMonth();
          const targetYear = targetDate.getFullYear();
          const monthName = `${monthNames[targetMonth]}/${String(targetYear).slice(2)}`;

          const monthRevenue = allAccountsReceivable
            .filter(r => {
              if (!r.is_received || !r.received_date) return false;
              const date = new Date(r.received_date + 'T12:00:00');
              return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
            })
            .reduce((sum, r) => sum + Number(r.amount), 0);

          const monthExpenses = allAccountsPayable
            .filter(p => {
              if (!p.is_paid || !p.paid_date) return false;
              const date = new Date(p.paid_date + 'T12:00:00');
              return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
            })
            .reduce((sum, p) => sum + Number(p.amount), 0);

          monthlyNetIncome.push({
            monthName,
            netIncome: monthRevenue - monthExpenses
          });
        }

        // Calculate balances backward from current balance
        const balanceHistoryData: string[][] = [];
        const balances: number[] = [];
        let balance = currentBalance;

        // First pass: calculate all balances
        for (let i = 0; i < monthlyNetIncome.length; i++) {
          if (i === 0) {
            balances.unshift(balance);
          } else {
            balance = balance - monthlyNetIncome[i - 1].netIncome;
            balances.unshift(balance);
          }
        }

        // Second pass: build table with variation column
        for (let i = 0; i < balances.length; i++) {
          const currentMonthBalance = balances[i];
          const previousMonthBalance = i > 0 ? balances[i - 1] : null;
          const variation = previousMonthBalance !== null ? currentMonthBalance - previousMonthBalance : null;
          
          const variationText = variation !== null 
            ? `${variation >= 0 ? '+' : ''}${formatCurrency(variation)}`
            : '-';

          balanceHistoryData.push([
            monthlyNetIncome[monthlyNetIncome.length - 1 - i].monthName,
            formatCurrency(currentMonthBalance),
            variationText
          ]);
        }

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Mês', 'Saldo Acumulado', 'Variação']],
          body: balanceHistoryData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold', halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' }
          },
          didParseCell: (data) => {
            // Alinhar headers à direita (exceto Mês)
            if (data.section === 'head' && data.column.index > 0) {
              data.cell.styles.halign = 'right';
            }
            // Color variation column based on positive/negative
            if (data.column.index === 2 && data.section === 'body') {
              const text = String(data.cell.raw);
              if (text.startsWith('+')) {
                data.cell.styles.textColor = [22, 101, 52]; // Green for positive
              } else if (text.startsWith('-') && text !== '-') {
                data.cell.styles.textColor = [185, 28, 28]; // Red for negative
              }
            }
          }
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `relatorio-financeiro-${getMonthName(selectedMonth).toLowerCase()}-${selectedYear}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
};
