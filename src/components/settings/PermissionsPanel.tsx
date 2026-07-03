import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trash2, UserPlus, Plus, ShieldCheck, Info } from 'lucide-react';
import { useUserCreation } from '@/hooks/useUserCreation';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';

type PermKey = { key: string; label: string; category: string; description: string | null; is_dynamic: boolean; sort_order: number };
type Group = { id: string; name: string; description: string | null; is_system: boolean };
type GroupItem = { group_id: string; permission_key: string; resource_id: string | null };
type UserProfile = { id: string; email: string; nome: string | null; ativo: boolean };
type UserOverride = { user_id: string; permission_key: string; resource_id: string | null; granted: boolean };
type UserGroupAssignment = { user_id: string; group_id: string };
type BankAccount = { id: string; name: string; active: boolean };

export const PermissionsPanel = () => {
  const { refreshPermissions } = useGlobalPermissions();
  const [keys, setKeys] = useState<PermKey[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroupAssignment[]>([]);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchAll = async (initial = false) => {
    if (initial) setLoading(true);
    const [k, g, gi, p, ug, uo, ba] = await Promise.all([
      supabase.from('permission_keys').select('*').order('sort_order'),
      supabase.from('permission_groups').select('*').order('name'),
      supabase.from('permission_group_items').select('group_id, permission_key, resource_id'),
      supabase.from('profiles').select('id, email, nome, ativo').eq('ativo', true).order('email'),
      supabase.from('user_permission_group').select('user_id, group_id'),
      supabase.from('user_permissions').select('user_id, permission_key, resource_id, granted'),
      supabase.from('bank_accounts').select('id, name, active').eq('active', true).order('name'),
    ]);
    if (k.data) setKeys(k.data as any);
    if (g.data) setGroups(g.data as any);
    if (gi.data) setGroupItems(gi.data as any);
    if (p.data) setUsers(p.data as any);
    if (ug.data) setUserGroups(ug.data as any);
    if (uo.data) setUserOverrides(uo.data as any);
    if (ba.data) setBankAccounts(ba.data as any);
    if (initial) setLoading(false);
  };

  useEffect(() => { fetchAll(true); }, []);


  const { createUser } = useUserCreation(fetchAll, setCreatingUser);

  const staticKeys = useMemo(() => keys.filter(k => !k.is_dynamic), [keys]);
  const categories = useMemo(() => {
    const map = new Map<string, PermKey[]>();
    staticKeys.forEach(k => {
      if (!map.has(k.category)) map.set(k.category, []);
      map.get(k.category)!.push(k);
    });
    return Array.from(map.entries());
  }, [staticKeys]);

  if (loading) return <div className="text-sm text-muted-foreground">Carregando permissões...</div>;

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="groups">Grupos</TabsTrigger>
        <TabsTrigger value="catalog">Catálogo</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-4 mt-4">
        <UsersTab
          users={users}
          groups={groups}
          userGroups={userGroups}
          userOverrides={userOverrides}
          categories={categories}
          bankAccounts={bankAccounts}
          onRefresh={async () => { await fetchAll(); await refreshPermissions(); }}
          onCreateUser={createUser}
          creatingUser={creatingUser}
        />
      </TabsContent>

      <TabsContent value="groups" className="space-y-4 mt-4">
        <GroupsTab
          groups={groups}
          groupItems={groupItems}
          categories={categories}
          bankAccounts={bankAccounts}
          onRefresh={async () => { await fetchAll(); await refreshPermissions(); }}
        />
      </TabsContent>

      <TabsContent value="catalog" className="space-y-4 mt-4">
        <CatalogTab categories={categories} bankAccounts={bankAccounts} />
      </TabsContent>
    </Tabs>
  );
};

// ============================================================
// USERS TAB
// ============================================================
const UsersTab = ({
  users, groups, userGroups, userOverrides, categories, bankAccounts,
  onRefresh, onCreateUser, creatingUser,
}: {
  users: UserProfile[]; groups: Group[]; userGroups: UserGroupAssignment[];
  userOverrides: UserOverride[]; categories: [string, PermKey[]][]; bankAccounts: BankAccount[];
  onRefresh: () => Promise<void>;
  onCreateUser: (email: string, password: string, name: string) => Promise<any>;
  creatingUser: boolean;
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newName, setNewName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const assignGroup = async (userId: string, groupId: string) => {
    const { error } = await supabase
      .from('user_permission_group')
      .upsert({ user_id: userId, group_id: groupId }, { onConflict: 'user_id' });
    if (error) toast.error('Erro ao atribuir grupo');
    else { toast.success('Grupo atribuído'); await onRefresh(); }
  };

  const setOverride = async (userId: string, key: string, resourceId: string | null, granted: boolean | null) => {
    if (granted === null) {
      // remove override
      const q = supabase.from('user_permissions').delete().eq('user_id', userId).eq('permission_key', key);
      const { error } = resourceId === null ? await q.is('resource_id', null) : await q.eq('resource_id', resourceId);
      if (error) { toast.error('Erro ao remover override'); return; }
    } else {
      const { error } = await supabase
        .from('user_permissions')
        .upsert(
          { user_id: userId, permission_key: key, resource_id: resourceId, granted },
          { onConflict: 'user_id,permission_key,resource_id' }
        );
      if (error) { toast.error('Erro ao atualizar permissão'); return; }
    }
    await onRefresh();
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Remover usuário ${email}?`)) return;
    const { error } = await supabase.rpc('delete_user_completo', { uid: userId });
    if (error) toast.error('Erro ao remover usuário');
    else { toast.success('Usuário removido'); await onRefresh(); }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Usuários</span> são as contas que têm acesso ao sistema. Cada usuário pode ser vinculado a um grupo de permissões, herdando todas as permissões desse grupo.
              </p>
              <p>
                Você também pode definir <span className="font-medium text-foreground">exceções individuais</span> por usuário, liberando ou bloqueando permissões específicas além do que o grupo permite.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Usuários ativos</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" />Novo usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><Label>Senha</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                disabled={creatingUser || !newEmail || !newPwd}
                onClick={async () => {
                  await onCreateUser(newEmail, newPwd, newName);
                  setNewEmail(''); setNewPwd(''); setNewName(''); setCreateOpen(false);
                }}
              >Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {users.map(u => {
        const assignedGroup = userGroups.find(ug => ug.user_id === u.id)?.group_id;
        const overrides = userOverrides.filter(o => o.user_id === u.id);
        return (
          <Card key={u.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{u.nome || u.email}</CardTitle>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={assignedGroup || ''} onValueChange={v => assignGroup(u.id, v)}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sem grupo" /></SelectTrigger>
                    <SelectContent>
                      {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id, u.email)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Overrides individuais ({overrides.length})
                </summary>
                <div className="mt-3 space-y-4">
                  {categories.map(([cat, ks]) => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">{cat}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {ks.map(k => {
                          const ov = overrides.find(o => o.permission_key === k.key && o.resource_id === null);
                          const val = ov ? (ov.granted ? 'allow' : 'deny') : 'inherit';
                          return (
                            <div key={k.key} className="flex items-center justify-between gap-2 text-xs">
                              <span title={k.description || ''}>{k.label}</span>
                              <Select value={val} onValueChange={v => {
                                if (v === 'inherit') setOverride(u.id, k.key, null, null);
                                else setOverride(u.id, k.key, null, v === 'allow');
                              }}>
                                <SelectTrigger className="h-7 w-[110px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Herdar</SelectItem>
                                  <SelectItem value="allow">Liberar</SelectItem>
                                  <SelectItem value="deny">Bloquear</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Contas bancárias (visualização individual)</div>
                    <div className="grid grid-cols-2 gap-2">
                      {bankAccounts.map(ba => {
                        const ov = overrides.find(o => o.permission_key === 'financeiro.contas.ver_conta' && o.resource_id === ba.id);
                        const val = ov ? (ov.granted ? 'allow' : 'deny') : 'inherit';
                        return (
                          <div key={ba.id} className="flex items-center justify-between gap-2 text-xs">
                            <span>{ba.name}</span>
                            <Select value={val} onValueChange={v => {
                              if (v === 'inherit') setOverride(u.id, 'financeiro.contas.ver_conta', ba.id, null);
                              else setOverride(u.id, 'financeiro.contas.ver_conta', ba.id, v === 'allow');
                            }}>
                              <SelectTrigger className="h-7 w-[110px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">Herdar</SelectItem>
                                <SelectItem value="allow">Liberar</SelectItem>
                                <SelectItem value="deny">Bloquear</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================
// GROUPS TAB
// ============================================================
const GroupsTab = ({
  groups, groupItems, categories, bankAccounts, onRefresh,
}: {
  groups: Group[]; groupItems: GroupItem[]; categories: [string, PermKey[]][];
  bankAccounts: BankAccount[]; onRefresh: () => Promise<void>;
}) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const createGroup = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from('permission_groups').insert({ name: newName.trim(), description: newDesc.trim() || null });
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Grupo criado'); setNewName(''); setNewDesc(''); await onRefresh(); }
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Excluir grupo "${name}"?`)) return;
    const { error } = await supabase.from('permission_groups').delete().eq('id', id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Grupo excluído'); await onRefresh(); }
  };

  const toggleKey = async (groupId: string, key: string, resourceId: string | null, on: boolean) => {
    if (on) {
      const { error } = await supabase.from('permission_group_items').insert({ group_id: groupId, permission_key: key, resource_id: resourceId });
      if (error) { toast.error('Erro: ' + error.message); return; }
    } else {
      const q = supabase.from('permission_group_items').delete().eq('group_id', groupId).eq('permission_key', key);
      const { error } = resourceId === null ? await q.is('resource_id', null) : await q.eq('resource_id', resourceId);
      if (error) { toast.error('Erro: ' + error.message); return; }
    }
    await onRefresh();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 asesor text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Grupos de permissão</span> funcionam como perfis de acesso. Crie um grupo, defina as permissões que ele terá e atribua usuários a ele.
              </p>
              <p>
                Um usuário recebe automaticamente todas as permissões do grupo ao qual pertence. Você também pode criar <span className="font-medium text-foreground">exceções individuais</span> por usuário na aba "Usuários".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Criar grupo</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          <Button onClick={createGroup} className="gap-2"><Plus className="h-4 w-4" />Criar</Button>
      </CardContent>
    </Card>

    {groups.map(g => {
        const items = groupItems.filter(i => i.group_id === g.id);
        const hasKey = (key: string, resourceId: string | null = null) =>
          items.some(i => i.permission_key === key && (i.resource_id ?? null) === (resourceId ?? null));
        return (
          <Card key={g.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {g.name}
                    {g.is_system && <Badge variant="secondary" className="text-xs"><ShieldCheck className="h-3 w-3 mr-1" />sistema</Badge>}
                  </CardTitle>
                  {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                </div>
                {!g.is_system && (
                  <Button variant="ghost" size="icon" onClick={() => deleteGroup(g.id, g.name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Permissões ({items.length})
                </summary>
                <div className="mt-3 space-y-4">
                  {categories.map(([cat, ks]) => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">{cat}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {ks.map(k => (
                          <label key={k.key} className="flex items-center gap-2 text-xs">
                            <Checkbox
                              checked={hasKey(k.key)}
                              onCheckedChange={c => toggleKey(g.id, k.key, null, !!c)}
                            />
                            <span title={k.description || ''}>{k.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Contas bancárias (visualização)</div>
                    <div className="grid grid-cols-2 gap-2">
                      {bankAccounts.map(ba => (
                        <label key={ba.id} className="flex items-center gap-2 text-xs">
                          <Checkbox
                            checked={hasKey('financeiro.contas.ver_conta', ba.id)}
                            onCheckedChange={c => toggleKey(g.id, 'financeiro.contas.ver_conta', ba.id, !!c)}
                          />
                          <span>{ba.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================
// CATALOG TAB
// ============================================================
const CatalogTab = ({ categories, bankAccounts }: { categories: [string, PermKey[]][]; bankAccounts: BankAccount[] }) => (
  <div className="space-y-4">
    <Card className="bg-muted/40 border-dashed">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Catálogo de permissões</span> é a lista completa de todas as permissões disponíveis no sistema, organizadas por categoria.
            </p>
            <p>
              Use esta visualização para consultar os nomes técnicos das chaves e entender o que cada permissão controla. As permissões são atribuídas aos usuários através de <span className="font-medium text-foreground">grupos</span> ou <span className="font-medium text-foreground">exceções individuais</span> na aba "Usuários".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {categories.map(([cat, ks]) => (
      <Card key={cat}>
        <CardHeader className="pb-3"><CardTitle className="text-sm">{cat}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs">
            {ks.map(k => (
              <div key={k.key} className="flex justify-between border-b py-1">
                <code className="font-mono text-[10px] text-muted-foreground">{k.key}</code>
                <span>{k.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">Chaves dinâmicas — Contas bancárias</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-1 text-xs">
          {bankAccounts.map(ba => (
            <div key={ba.id} className="flex justify-between border-b py-1">
              <code className="font-mono text-[10px] text-muted-foreground">financeiro.contas.ver_conta:{ba.id.slice(0, 8)}…</code>
              <span>{ba.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
