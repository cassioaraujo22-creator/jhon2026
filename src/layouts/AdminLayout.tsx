import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Dumbbell, CreditCard, Shield,
  BarChart3, Settings, Zap, ChevronLeft, Menu, DollarSign, LogOut, ShoppingBag, UserCheck, ExternalLink, ListChecks, Apple, Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGymInfo } from "@/hooks/use-home-data";

const sidebarItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/users", icon: Users, label: "Usuários" },
  { to: "/admin/programs", icon: Dumbbell, label: "Programas" },
  { to: "/admin/exercises", icon: ListChecks, label: "Exercícios" },
  { to: "/admin/plans", icon: DollarSign, label: "Planos" },
  { to: "/admin/trainers", icon: UserCheck, label: "Personal Trainers" },
  { to: "/admin/payments", icon: CreditCard, label: "Pagamentos" },
  { to: "/admin/store", icon: ShoppingBag, label: "Loja" },
  { to: "/admin/access", icon: Shield, label: "Controle Acesso" },
  { to: "/admin/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/admin/integrations", icon: Zap, label: "Integrações" },
  { to: "/admin/nutrition", icon: Apple, label: "Nutricionista" },
  { to: "/admin/onboarding", icon: Clapperboard, label: "Onboarding" },
  { to: "/admin/settings", icon: Settings, label: "Configurações" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border space-y-1">
        <NavLink
          to="/app"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          <span>Abrir App</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { data: gymInfo } = useGymInfo();

  const appDisplayName = (gymInfo?.settings as any)?.app_display_name || gymInfo?.name || "FitAdmin";
  const appLogo = (gymInfo?.settings as any)?.app_logo_url || gymInfo?.logo_url || null;

  const currentLabel = sidebarItems.find((i) =>
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
  )?.label || "Admin";

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-4 gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <div className="flex items-center h-16 px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  {appLogo ? <img src={appLogo} alt="Logo" className="w-7 h-7 rounded-md object-cover" /> : null}
                  <span className="text-lg font-bold text-gradient-purple">{appDisplayName}</span>
                </div>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <h2 className="text-base font-semibold text-foreground truncate">{currentLabel}</h2>
        </header>
        <main className="flex-1 p-4 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {collapsed ? (
          <>
            <div className="flex items-center justify-center h-16 border-b border-border">
              <button
                onClick={() => setCollapsed(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-1.5 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center justify-center p-2.5 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                    title={item.label}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                  </NavLink>
                );
              })}
            </nav>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                {appLogo ? <img src={appLogo} alt="Logo" className="w-7 h-7 rounded-md object-cover shrink-0" /> : null}
                <span className="text-lg font-bold text-gradient-purple truncate">{appDisplayName}</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <SidebarNav />
          </>
        )}
      </aside>

      <div className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-6">
          <h2 className="text-lg font-semibold text-foreground">{currentLabel}</h2>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
