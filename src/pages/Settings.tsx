import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectSettings } from '@/components/settings/ProjectSettings';
import { TransactionTypesSettings } from '@/components/settings/TransactionTypesSettings';
import { PermissionsPanel } from '@/components/settings/PermissionsPanel';
import { ChangePasswordPanel } from '@/components/settings/ChangePasswordPanel';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
const logoEcom = { url: '/logo-unlimit-ecom.png' };

const Settings = () => {
  const { can } = useGlobalPermissions();
  const canManagePerms = can('sistema.gerenciar_permissoes');

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <img src={logoEcom.url} alt="UNLIMIT ECOM" className="h-6 w-auto object-contain" />
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className={`grid w-full ${canManagePerms ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="account">Minha Conta</TabsTrigger>
          {canManagePerms && <TabsTrigger value="permissions">Permissões</TabsTrigger>}
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="transaction-types">Tipos de Transação</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="account"><ChangePasswordPanel /></TabsContent>
          {canManagePerms && <TabsContent value="permissions"><PermissionsPanel /></TabsContent>}
          <TabsContent value="projects"><ProjectSettings /></TabsContent>
          <TabsContent value="transaction-types"><TransactionTypesSettings /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;
