import { useAdminOrders } from "@/hooks/use-admin-store";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function AdminStoreOrders() {
  const { data: orders, isLoading } = useAdminOrders();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Pedidos</h2>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/40 text-muted-foreground text-left"><th className="p-3">ID</th><th className="p-3">Cliente</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Data</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : !orders?.length ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum pedido ainda</td></tr>
            ) : orders.map((o: any) => (
              <tr key={o.id} className="border-t border-border hover:bg-secondary/20 cursor-pointer" onClick={() => navigate(`/admin/store/orders/${o.id}`)}>
                <td className="p-3 text-muted-foreground font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="p-3 text-foreground">{o.profiles?.name ?? o.profiles?.email ?? "—"}</td>
                <td className="p-3 text-foreground">{formatPrice(o.total_cents)}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status === "paid" ? "bg-success/20 text-success" :
                    o.status === "pending" ? "bg-warning/20 text-warning" :
                    "bg-destructive/20 text-destructive"
                  }`}>{o.status}</span>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="p-3"><Eye className="w-4 h-4 text-muted-foreground" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
