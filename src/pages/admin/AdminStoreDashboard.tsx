import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Tags, Package, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/admin/store/categories", icon: Tags, label: "Categorias" },
  { to: "/admin/store/products", icon: Package, label: "Produtos" },
  { to: "/admin/store/orders", icon: ClipboardList, label: "Pedidos" },
];

export default function AdminStoreDashboard() {
  const location = useLocation();
  // If at exact /admin/store, show tabs + intro
  const isIndex = location.pathname === "/admin/store";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Loja</h1>

      {/* Tab nav */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => {
          const active = location.pathname.startsWith(t.to);
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all shrink-0",
                active
                  ? "bg-primary/15 text-primary border-primary/20"
                  : "text-muted-foreground border-border hover:bg-secondary"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </NavLink>
          );
        })}
      </div>

      {isIndex ? (
        <div className="text-sm text-muted-foreground">Selecione uma seção acima para gerenciar a loja.</div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
