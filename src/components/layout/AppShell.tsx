import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export const AppShell = ({ children }: { children: ReactNode }) => (
  <SidebarProvider defaultOpen>
    <div className="min-h-screen flex w-full bg-slate-50">
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);
