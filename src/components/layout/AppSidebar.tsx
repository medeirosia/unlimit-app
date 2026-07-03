import { NavLink, useLocation } from 'react-router-dom';
import { Home, DollarSign, Settings, LogOut, PanelLeft } from 'lucide-react';
const logoAsset = { url: '/logo-unlimit.png' };
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const items = [
  { title: 'Início',        url: '/inicio',        icon: Home,       key: 'inicio.acessar' },
  { title: 'Financeiro',    url: '/financeiro',    icon: DollarSign, key: 'financeiro.acessar' },
  { title: 'Configurações', url: '/configuracoes', icon: Settings,   key: 'inicio.configuracoes' },
];

export const AppSidebar = () => {
  const { state, toggleSidebar } = useSidebar();
  const { can } = useGlobalPermissions();
  const { signOut, user } = useAuth();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const visible = items.filter(i => can(i.key));

  const getName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };
  const initials = getName().slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    try { await signOut(); toast.success('Logout realizado'); }
    catch { toast.error('Erro ao sair'); }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarRail />
      <SidebarHeader className="border-b border-slate-100 bg-white">
        <div className={`flex items-center py-3 ${collapsed ? 'justify-center px-0' : 'gap-2 px-2 justify-between'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={logoAsset.url}
              alt="Unlimit"
              className={`shrink-0 object-contain ${collapsed ? 'h-7 w-7' : 'h-8 w-8'}`}
            />
            {!collapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">UNLIMIT</span>
                <span className="text-[11px] text-slate-500 truncate">Painel operacional</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              aria-label="Recolher menu"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>


      <SidebarContent className="bg-white">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-slate-400">Navegação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map(item => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-900 data-[active=true]:text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 bg-white">
        <div className={`flex items-center py-2 ${collapsed ? 'justify-center px-0' : 'gap-2 px-2'}`}>
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{getName()}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
