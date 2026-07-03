# Redesenho de Permissões + Refresh Visual

## 1. Conceito novo de permissões

Abandonamos o modelo "admin vs colaborador" e o array `modulos_permitidos`. No lugar, dois conceitos:

- **Grupos de Permissão** (templates): ex. "Acesso Total", "Financeiro Parcial", "Somente Início". Criados/editados via UI.
- **Permissões Granulares por Usuário**: cada usuário recebe um grupo OU permissões customizadas (override). O grupo é só um atalho — o que vale na prática são as permissões finais do usuário.

Cada permissão é uma **chave granular** (ex. `inicio.painel_geral.metricas_topo`, `financeiro.contas.saldo_total`, `financeiro.contas.ver_conta:<id>`). Tudo binário (pode/não pode).

Não existe mais "admin hardcoded por e-mail". Existe a permissão `sistema.gerenciar_permissoes` — quem tiver, gerencia tudo. O e-mail atual recebe essa permissão na migração inicial.

## 2. Mapa de permissões (proposta inicial)

### Rota `/inicio`
- `inicio.acessar` — entra na rota
- `inicio.metricas_topo` — vê os SummaryCards (faturamento, investimento, ROAS, lucro)
- `inicio.painel_geral` — aba Painel Geral
- `inicio.projetos` — aba Projetos
- `inicio.lancamentos` — aba Lançamentos
- `inicio.mentorias` — aba Mentorias
- `inicio.configuracoes` — aba Configurações

### Rota `/financeiro`
- `financeiro.acessar`
- `financeiro.metricas_topo` — FinancialSummaryCards
- `financeiro.contas.acessar` — aba Contas
- `financeiro.contas.saldo_total` — vê total consolidado
- `financeiro.contas.ver_conta:<account_id>` — uma chave por conta bancária (gerada dinamicamente)
- `financeiro.contas.editar`
- `financeiro.lancamentos.acessar`
- `financeiro.pagar.acessar`
- `financeiro.receber.acessar`
- `financeiro.saques.acessar`
- `financeiro.relatorios.acessar`
- `financeiro.configuracoes.acessar`

### Sistema
- `sistema.gerenciar_permissoes` — cria grupos, atribui permissões, cria/deleta usuários
- `sistema.gerenciar_usuarios` — cria/edita usuários sem mexer em permissões

(Pancada Joias fica fora do menu como hoje; mantemos `pancada_joias.acessar` para a rota direta.)

## 3. Estrutura de banco

```text
permission_groups
├─ id, name, description, is_system (bool), created_at
permission_keys                      ← catálogo de todas as chaves possíveis
├─ key (PK), label, category, is_dynamic
permission_group_items               ← chaves de cada grupo
├─ group_id, permission_key, resource_id (nullable, p/ chaves dinâmicas como conta:<id>)
user_permissions                     ← permissões efetivas por usuário
├─ user_id, permission_key, resource_id (nullable), granted (bool)
user_permission_group                ← grupo atual do usuário (opcional)
├─ user_id, group_id
```

Função SQL `has_perm(_user_id, _key, _resource_id default null) returns boolean` — única fonte de verdade, security definer, usada por RLS e pelo front (via RPC inicial para carregar todas as chaves do usuário).

Hook único `usePermissions()` no front: carrega a lista uma vez, expõe `can(key, resourceId?)`. Substitui `useUserPermissions`, `useFinancialPermissions`, `usePancadaPermissions`, `useAdminPermissions`.

## 4. Migração dos dados atuais

1. Cria tabelas + chaves do catálogo.
2. Cria grupos default: **Acesso Total**, **Somente Início**, **Financeiro Completo**, **Financeiro Restrito (sem relatórios/configurações)**.
3. Para cada usuário em `profiles`:
   - Converte `modulos_permitidos` em chaves equivalentes (`inicio.*`, `financeiro.*` com todos os submódulos liberados).
   - Usuário admin atual recebe grupo "Acesso Total" + `sistema.gerenciar_permissoes`.
4. Mantém tabelas antigas (`user_financial_permissions`, `user_pancada_permissions`, `user_module_access`, `modulos_permitidos`) por 1 ciclo apenas como fallback de leitura. Removemos depois que validarmos.

## 5. UI de gestão (em Configurações → Permissões)

Três abas:

- **Usuários**: lista, criar, atribuir grupo, override granular (árvore de checkboxes agrupada por módulo, com chaves dinâmicas de contas bancárias listadas).
- **Grupos**: CRUD de grupos com a mesma árvore.
- **Catálogo**: somente leitura, mostra todas as chaves disponíveis (útil para auditoria).

## 6. Aplicação no front (sem mexer em regras de negócio)

- `ModuleProtectedRoute` passa a aceitar `requiredKey` em vez de `requiredModule`.
- `TabNavigation` em `/inicio` e `/financeiro` filtra abas pela função `can(...)`.
- `SummaryCards` e `FinancialSummaryCards` renderizam só se `can('*.metricas_topo')`.
- `BankAccountsTab` filtra contas por `can('financeiro.contas.ver_conta', account.id)` e esconde saldo total se faltar `financeiro.contas.saldo_total`.
- Toda a lógica de cálculo de saldo, triggers, RPCs financeiras **permanece intocada**.

## 7. Refresh visual (escopo separado, sem mexer em regras)

Mesma fase, só camada de apresentação:

- Padroniza header/topbar em `/inicio` e `/financeiro` (mesmo componente, breadcrumb, menu do usuário).
- Cards de métricas no padrão "Flat & Corporativa" já definido (memória `dashboard-compact-cards`).
- Tabs com visual unificado, espaçamentos compactos.
- Estados vazios e loadings consistentes.
- Tipografia/cores via tokens do `index.css` (nada hardcoded).
- Filtros de data padronizados (memória `date-filter-navigation`).

Sem alterar fluxos, formulários de lançamento, regras de cálculo, ou comportamento de botões.

## 8. Ordem de execução sugerida

1. Migração SQL (tabelas + função `has_perm` + seeds + conversão dos usuários atuais).
2. Hook `usePermissions` + novo `ModuleProtectedRoute`.
3. UI de gestão (Usuários, Grupos, Catálogo) em Configurações.
4. Plugar `can()` nas telas (`/inicio`, `/financeiro`, contas bancárias com filtro por id).
5. Refresh visual módulo a módulo (`/inicio` primeiro, depois `/financeiro`).
6. Remover código legado de permissões (hooks antigos, `modulos_permitidos`, `is_admin_user`).

## 9. Perguntas antes de começar

1. **Grupos default**: os 4 que propus servem, ou você já tem em mente os grupos reais (com nomes/escopos) que usa no dia a dia?
2. **Chaves dinâmicas de contas bancárias**: confirmar que quer granularidade por conta individual (vs. só "ver todas as contas" / "não ver"). Idem para projetos (ver projeto X sim, Y não)?
3. **Refresh visual**: quer que eu proponha 2-3 direções visuais antes (mockups/protótipos) ou aplico direto o padrão "Flat & Corporativa" que já está nas memórias?
4. **Pancada Joias**: mantém oculto do menu como hoje, ou aproveitamos para trazer de volta como grupo opt-in?
