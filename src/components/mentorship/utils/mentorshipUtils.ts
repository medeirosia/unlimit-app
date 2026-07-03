
export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2 
  });
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const getUnscheduledAmount = (mentorship: any) => {
  const scheduledAmount = mentorship.payments?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
  return mentorship.pendingValue - scheduledAmount;
};
