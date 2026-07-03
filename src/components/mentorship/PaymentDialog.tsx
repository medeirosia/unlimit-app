
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Mentorship } from '@/types/dashboard';

interface PaymentDialogProps {
  mentorship: Mentorship;
  unscheduledAmount: number;
  onAddPayment: (mentorshipId: string, payment: any) => void;
  onClose: () => void;
}

interface PaymentInstallment {
  amount: number;
  dueDate?: Date;
}

export const PaymentDialog = ({ 
  mentorship, 
  unscheduledAmount, 
  onAddPayment, 
  onClose 
}: PaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([
    { amount: 0, dueDate: undefined }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all installments
    const validInstallments = installments.filter(inst => 
      inst.amount > 0 && inst.dueDate
    );

    if (validInstallments.length === 0) {
      toast.error('Adicione pelo menos uma parcela válida');
      return;
    }

    // Check if total amount doesn't exceed unscheduled amount
    const totalAmount = validInstallments.reduce((sum, inst) => 
      sum + inst.amount, 0
    );

    if (totalAmount > unscheduledAmount) {
      toast.error('Valor total das parcelas não pode ser maior que o valor não agendado');
      return;
    }

    // Create all payments
    validInstallments.forEach(installment => {
      const payment = {
        amount: installment.amount,
        dueDate: format(installment.dueDate!, 'yyyy-MM-dd'),
        status: 'pendente' as const
      };
      onAddPayment(mentorship.id, payment);
    });
    
    // Reset form
    setInstallments([{ amount: 0, dueDate: undefined }]);
    setOpen(false);
    onClose();
  };

  const handleAmountChange = (index: number, value: number) => {
    const newInstallments = [...installments];
    newInstallments[index].amount = value;
    setInstallments(newInstallments);
  };

  const handleDateChange = (index: number, date: Date | undefined) => {
    const newInstallments = [...installments];
    newInstallments[index].dueDate = date;
    setInstallments(newInstallments);
  };

  const addInstallment = () => {
    setInstallments([...installments, { amount: 0, dueDate: undefined }]);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      const newInstallments = installments.filter((_, i) => i !== index);
      setInstallments(newInstallments);
    }
  };

  const divideEqually = () => {
    const numberOfInstallments = installments.length;
    const equalAmount = Math.round((unscheduledAmount / numberOfInstallments) * 100) / 100;
    
    const newInstallments = installments.map(inst => ({
      ...inst,
      amount: equalAmount
    }));
    
    setInstallments(newInstallments);
  };

  const getTotalScheduled = () => {
    return installments.reduce((sum, inst) => {
      return sum + (inst.amount || 0);
    }, 0);
  };

  const getRemainingAmount = () => {
    return unscheduledAmount - getTotalScheduled();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Agendar Pagamentos</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Valor não agendado:</span>
                <span className="font-medium">R$ {unscheduledAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total agendado:</span>
                <span className="font-medium">R$ {getTotalScheduled().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                <span>Restante:</span>
                <span className={`font-medium ${getRemainingAmount() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  R$ {getRemainingAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Parcelas</Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={divideEqually}
                  >
                    Dividir Igualmente
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addInstallment}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Parcela
                  </Button>
                </div>
              </div>

              <div className="max-h-[40vh] overflow-y-auto space-y-3">
                {installments.map((installment, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Parcela {index + 1}</Label>
                      {installments.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstallment(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`amount-${index}`}>Valor</Label>
                        <CurrencyInput
                          id={`amount-${index}`}
                          value={installment.amount}
                          onChange={(value) => handleAmountChange(index, value)}
                        />
                      </div>

                      <div>
                        <Label>Data de Vencimento</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {installment.dueDate ? 
                                format(installment.dueDate, "dd/MM/yyyy", { locale: ptBR }) : 
                                "Selecione uma data"
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={installment.dueDate}
                              onSelect={(date) => handleDateChange(index, date)}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" className="flex-1">
                Agendar Pagamentos
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
