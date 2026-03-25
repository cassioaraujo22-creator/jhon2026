import { ArrowLeft, Loader2, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyPayments, useMyMembership } from "@/hooks/use-supabase-data";

const statusConfig: Record<string, { icon: any; label: string; class: string }> = {
  paid: { icon: CheckCircle2, label: "Pago", class: "bg-success/15 text-success border-success/20" },
  pending: { icon: Clock, label: "Pendente", class: "bg-warning/15 text-warning border-warning/20" },
  failed: { icon: XCircle, label: "Falhou", class: "bg-destructive/15 text-destructive border-destructive/20" },
  refunded: { icon: XCircle, label: "Estornado", class: "bg-muted text-muted-foreground border-border" },
};

export default function StudentPayments() {
  const navigate = useNavigate();
  const { data: payments, isLoading } = useMyPayments();
  const { data: membership } = useMyMembership();

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Pagamentos</h1>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-2 glow-purple">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{membership?.plans?.name ?? "Sem plano"}</p>
            <p className="text-xs text-muted-foreground">
              {membership?.status === "active" ? "Plano ativo" : "Plano inativo"}
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Histórico</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (payments ?? []).length > 0 ? (
          <div className="space-y-2">
            {(payments ?? []).map((payment: any) => {
              const config = statusConfig[payment.status] ?? statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div key={payment.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.class}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{payment.plans?.name ?? "Pagamento"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">R$ {((payment.amount_cents ?? 0) / 100).toFixed(2)}</p>
                    <p className={`text-xs ${config.class.split(" ")[1]}`}>{config.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
        )}
      </div>
    </div>
  );
}
