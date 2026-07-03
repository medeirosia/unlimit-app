import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModuleProtectedRoute from "@/components/ModuleProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Financial from "./pages/Financial";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SmartRedirect from "./components/SmartRedirect";

const queryClient = new QueryClient();

const shell = (key: string, node: React.ReactNode) => (
  <ProtectedRoute>
    <ModuleProtectedRoute requiredKey={key}>
      <AppShell>{node}</AppShell>
    </ModuleProtectedRoute>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PermissionsProvider>
            <Routes>
              <Route path="/entrar" element={<Auth />} />
              <Route path="/inicio" element={shell("inicio.acessar", <Index />)} />
              <Route path="/financeiro" element={shell("financeiro.acessar", <Financial />)} />
              <Route path="/configuracoes" element={shell("inicio.configuracoes", <Settings />)} />
              <Route path="/" element={
                <ProtectedRoute>
                  <SmartRedirect />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
