import { useParams, useNavigate } from "react-router-dom";
import { useAdminOrderById, useUpdateOrderStatus } from "@/hooks/use-admin-store";
import { ChevronLeft, Loader2, Package, User, CreditCard, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  paid: { label: "Pago", className: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Cancelado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  shipped: { label: "Enviado", className: "bg-primary/15 text-primary border-primary/30" },
  delivered: { label: "Entregue", className: "bg-success/15 text-success border-success/30" },
};

export default function AdminStoreOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useAdminOrderById(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-muted-foreground">Pedido não encontrado</div>
    );
  }

  const config = statusConfig[order.status] ?? statusConfig.pending;
  const items = (order as any).store_order_items ?? [];

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({ id: order.id, status: newStatus });
  };

  return (
    <div className="space-y-6 max-w-3xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/store/orders")}
          className="p-2 rounded-xl bg-secondary/60 border border-border hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">Pedido #{order.id.slice(0, 8)}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>

      {/* Customer info */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Cliente
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Nome</p>
            <p className="text-foreground font-medium">{(order as any).profiles?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="text-foreground font-medium">{(order as any).profiles?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Telefone</p>
            <p className="text-foreground font-medium">{(order as any).profiles?.phone ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Itens do Pedido
          </h3>
        </div>
        <div className="divide-y divide-border">
          {items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">Nenhum item</p>
          ) : (
            items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name_snapshot}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {formatPrice(item.price_cents_snapshot * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.price_cents_snapshot)} un.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-5 border-t border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">{formatPrice(order.total_cents)}</span>
        </div>
      </div>

      {/* Payment info */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" /> Pagamento
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Provedor</p>
            <p className="text-foreground font-medium">{order.payment_provider ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Referência</p>
            <p className="text-foreground font-medium font-mono text-xs">{order.payment_reference ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Alterar Status</h3>
        <div className="flex flex-wrap gap-2">
          {["pending", "paid", "shipped", "delivered", "cancelled"].map((s) => {
            const c = statusConfig[s] ?? statusConfig.pending;
            return (
              <Button
                key={s}
                variant={order.status === s ? "default" : "outline"}
                size="sm"
                disabled={order.status === s || updateStatus.isPending}
                onClick={() => handleStatusChange(s)}
              >
                {updateStatus.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : c.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
