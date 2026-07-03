
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Mentorship } from '@/types/dashboard';

interface MentorshipEditDialogProps {
  mentorship: Mentorship;
  onUpdateMentorship: (mentorshipId: string, updatedMentorship: Mentorship) => void;
}

const projects = [
  { value: 'matheus', label: 'Projeto Matheus' },
  { value: 'kenneth', label: 'Projeto Kenneth' },
];

export const MentorshipEditDialog = ({ mentorship, onUpdateMentorship }: MentorshipEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    project: mentorship.project,
    clientName: mentorship.clientName,
    totalValue: mentorship.totalValue,
    receivedValue: mentorship.receivedValue,
    date: mentorship.date,
    observations: mentorship.observations || '',
  });

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

    const updatedMentorship: Mentorship = {
      ...mentorship,
      project: formData.project,
      clientName: formData.clientName,
      totalValue: formData.totalValue,
      receivedValue: formData.receivedValue,
      pendingValue: formData.totalValue - formData.receivedValue,
      date: formData.date,
      observations: formData.observations,
    };

    onUpdateMentorship(mentorship.id, updatedMentorship);
    toast.success('Mentoria atualizada com sucesso!');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form when opening
      setFormData({
        project: mentorship.project,
        clientName: mentorship.clientName,
        totalValue: mentorship.totalValue,
        receivedValue: mentorship.receivedValue,
        date: mentorship.date,
        observations: mentorship.observations || '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Mentoria</DialogTitle>
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Salvar Alterações
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
