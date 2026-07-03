
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Mentorship } from '@/types/dashboard';

interface MentorshipFormProps {
  onAddMentorship: (mentorship: Omit<Mentorship, 'id' | 'pendingValue' | 'payments'>) => void;
}

const projects = [
  { value: 'matheus', label: 'Projeto Matheus' },
  { value: 'kenneth', label: 'Projeto Kenneth' },
];

export const MentorshipForm = ({ onAddMentorship }: MentorshipFormProps) => {
  const [formData, setFormData] = useState({
    project: '' as 'matheus' | 'kenneth' | '',
    clientName: '',
    totalValue: 0,
    receivedValue: 0,
    date: new Date().toISOString().split('T')[0],
    observations: '',
  });

  const [openDialog, setOpenDialog] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project || !formData.clientName || !formData.totalValue) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.receivedValue > formData.totalValue) {
      toast.error('O valor recebido não pode ser maior que o valor total');
      return;
    }

    const mentorship = {
      project: formData.project as 'matheus' | 'kenneth',
      clientName: formData.clientName,
      totalValue: formData.totalValue,
      receivedValue: formData.receivedValue,
      date: formData.date,
      observations: formData.observations,
    };

    onAddMentorship(mentorship);
    toast.success('Mentoria adicionada com sucesso!');
    
    // Reset form
    setFormData({
      project: '' as 'matheus' | 'kenneth' | '',
      clientName: '',
      totalValue: 0,
      receivedValue: 0,
      date: new Date().toISOString().split('T')[0],
      observations: '',
    });
    setOpenDialog(false);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Mentoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Mentoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto *</Label>
              <Select 
                value={formData.project} 
                onValueChange={(value) => setFormData({ ...formData, project: value as 'matheus' | 'kenneth' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.value} value={project.value}>
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                placeholder="Nome do cliente"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalValue">Valor Total (R$) *</Label>
              <CurrencyInput
                value={formData.totalValue}
                onChange={(value) => setFormData({ ...formData, totalValue: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedValue">Valor Recebido (R$)</Label>
              <CurrencyInput
                value={formData.receivedValue}
                onChange={(value) => setFormData({ ...formData, receivedValue: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data da Venda *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Descreva o que foi vendido para o cliente..."
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Mentoria
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
