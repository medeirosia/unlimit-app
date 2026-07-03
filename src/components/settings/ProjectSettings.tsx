import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Save, X, Trash2, Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProjectConfig } from '@/hooks/useProjectConfig';
import { useTaxConfig } from '@/hooks/useTaxConfig';

export const ProjectSettings = () => {
  const {
    projects,
    loading,
    updateProject,
    addProject,
    deleteProject,
  } = useProjectConfig();
  
  const { taxPercentage, updateTaxPercentage } = useTaxConfig();
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', key: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTax, setEditingTax] = useState(false);
  const [taxValue, setTaxValue] = useState(taxPercentage.toString());

  const handleEditProject = (projectId: string) => {
    setEditingProject(projectId);
  };

  const handleSaveProject = async (projectId: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projeto não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateProject(projectId, { name: newName.trim() });
    if (success) {
      setEditingProject(null);
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto.",
        variant: "destructive",
      });
    }
  };

  const handleToggleProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const success = await updateProject(projectId, { active: !project?.active });

    if (success) {
      toast({
        title: "Sucesso",
        description: `Projeto ${project?.active ? 'desativado' : 'ativado'} com sucesso!`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao atualizar projeto.",
        variant: "destructive",
      });
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim() || !newProject.key.trim()) {
      toast({
        title: "Erro",
        description: "Nome e chave do projeto são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const keyExists = projects.some(p => p.key.toLowerCase() === newProject.key.toLowerCase());
    if (keyExists) {
      toast({
        title: "Erro",
        description: "Já existe um projeto com essa chave.",
        variant: "destructive",
      });
      return;
    }

    const result = await addProject({
      name: newProject.name.trim(),
      key: newProject.key.toLowerCase().trim(),
      active: true,
    });

    if (result) {
      setNewProject({ name: '', key: '' });
      setShowAddForm(false);
      toast({
        title: "Sucesso",
        description: "Projeto adicionado com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao adicionar projeto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      const success = await deleteProject(projectId);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: "Projeto excluído com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir projeto.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveTax = async () => {
    const value = parseFloat(taxValue);
    if (isNaN(value) || value < 0 || value > 100) {
      toast({ title: "Erro", description: "Informe um valor entre 0 e 100.", variant: "destructive" });
      return;
    }
    const success = await updateTaxPercentage(value);
    if (success) {
      setEditingTax(false);
      toast({ title: "Sucesso", description: "Imposto atualizado com sucesso!" });
    } else {
      toast({ title: "Erro", description: "Erro ao salvar imposto.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuração de Imposto sobre Investimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Imposto sobre Investimento (Tráfego Pago)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Percentual de imposto aplicado sobre o valor investido em tráfego pago. Esse valor será somado ao investimento nos cards do painel.
          </p>
          <div className="flex items-center gap-3">
            {editingTax ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxValue}
                    onChange={(e) => setTaxValue(e.target.value)}
                    className="w-24"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTax();
                      if (e.key === 'Escape') { setEditingTax(false); setTaxValue(taxPercentage.toString()); }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Button size="sm" onClick={handleSaveTax}>
                  <Save className="h-3 w-3 mr-1" /> Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingTax(false); setTaxValue(taxPercentage.toString()); }}>
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{taxPercentage}%</div>
                <Button size="sm" variant="outline" onClick={() => { setEditingTax(true); setTaxValue(taxPercentage.toString()); }}>
                  <Edit className="h-3 w-3 mr-1" /> Editar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Configurações de Projetos
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Adicionar Projeto
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Carregando projetos...</div>
            </div>
          ) : (
            <div className="space-y-4">
            {/* Formulário para adicionar novo projeto */}
            {showAddForm && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Nome do Projeto</Label>
                        <Input
                          id="project-name"
                          placeholder="Ex: Projeto Silva"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="project-key">Chave do Projeto</Label>
                        <Input
                          id="project-key"
                          placeholder="Ex: silva"
                          value={newProject.key}
                          onChange={(e) => setNewProject(prev => ({ ...prev, key: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddProject} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAddForm(false);
                          setNewProject({ name: '', key: '' });
                        }}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de projetos existentes */}
            <div className="space-y-3">
              {projects.map((project, index) => (
                <div key={project.id}>
                  <ProjectRow
                    project={project}
                    isEditing={editingProject === project.id}
                    onEdit={() => handleEditProject(project.id)}
                    onSave={(newName) => handleSaveProject(project.id, newName)}
                    onCancel={() => setEditingProject(null)}
                    onToggle={() => handleToggleProject(project.id)}
                    onDelete={() => handleDeleteProject(project.id)}
                  />
                  {index < projects.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface ProjectRowProps {
  project: import('@/hooks/useProjectConfig').ProjectConfig;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (newName: string) => void;
  onCancel: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const ProjectRow = ({
  project,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
}: ProjectRowProps) => {
  const [editName, setEditName] = useState(project.name);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editName);
    } else if (e.key === 'Escape') {
      setEditName(project.name);
      onCancel();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center space-x-2">
          <Switch
            checked={project.active}
            onCheckedChange={onToggle}
            id={`project-${project.id}`}
          />
          <Label 
            htmlFor={`project-${project.id}`}
            className={`text-sm ${!project.active ? 'text-gray-500' : ''}`}
          >
            {project.active ? 'Ativo' : 'Inativo'}
          </Label>
        </div>

        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="max-w-md"
              autoFocus
            />
          ) : (
            <div>
              <h4 className={`font-medium ${!project.active ? 'text-gray-500' : ''}`}>
                {project.name}
              </h4>
              <p className="text-sm text-gray-500">Chave: {project.key}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              size="sm"
              onClick={() => onSave(editName)}
              className="flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditName(project.name);
                onCancel();
              }}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              Excluir
            </Button>
          </>
        )}
      </div>
    </div>
  );
};