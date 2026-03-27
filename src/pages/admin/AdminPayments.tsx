import { Download, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useGymPayments, useGymMemberships, useGymPlans } from "@/hooks/use-supabase-data";
import { useCreatePayment, useUpdatePayment } from "@/hooks/use-admin-mutations";

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-success/15 text-success" },
  pending: { label: "Pendente", className: "bg-warning/15 text-warning" },
  failed: { label: "Falhou", className: "bg-destructive/15 text-destructive" },
  refunded: { label: "Estornado", className: "bg-muted text-muted-foreground" },
};

export default function AdminPayments() {
  const [filter, setFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("paid");
  const { data: payments, isLoading } = useGymPayments();
  const { data: memberships } = useGymMemberships();
  const { data: plans } = useGymPlans();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  const filtered = (payments ?? []).filter((p: any) => {
    if (filter === "Pagos") return p.status === "paid";
    if (filter === "Pendentes") return p.status === "pending";
    if (filter === "Falhos") return p.status === "failed";
    return true;
  });

  const paidTotal = (payments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + (p.amount_cents ?? 0), 0);
  const pendingTotal = (payments ?? []).filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + (p.amount_cents ?? 0), 0);
  const failedTotal = (payments ?? []).filter((p: any) => p.status === "failed").reduce((s: number, p: any) => s + (p.amount_cents ?? 0), 0);

  const openCreate = () => {
    setMemberId("");
    setPlanId("");
    setAmount("");
    setStatus("paid");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    await createPayment.mutateAsync({
      member_id: memberId,
      amount_cents: Math.round(Number(amount) * 100),
      plan_id: planId || undefined,
      status,
    });
    setDialogOpen(false);
  };

  const markAsPaid = async (id: string) => {
    await updatePayment.mutateAsync({ id, status: "paid" });
  };

  // Unique members from memberships
  const members = (memberships ?? []).map((m: any) => ({ id: m.member_id, name: m.profiles?.name ?? m.member_id }));
  const uniqueMembers = Array.from(new Map(members.map((m: any) => [m.id, m])).values());

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pagamentos</h2>
          <p className="text-sm text-muted-foreground">Gestão financeira</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Exportar</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Registrar</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recebido</p>
          <p className="text-xl font-bold text-success">R$ {(paidTotal / 100).toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendente</p>
          <p className="text-xl font-bold text-warning">R$ {(pendingTotal / 100).toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Falhou</p>
          <p className="text-xl font-bold text-destructive">R$ {(failedTotal / 100).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["Todos", "Pagos", "Pendentes", "Falhos"].map((f) => (
          <Button key={f} variant={filter === f ? "pill-active" : "pill"} size="pill" onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Aluno</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Plano</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Valor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const config = statusConfig[p.status] ?? statusConfig.pending;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{p.profiles?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.plans?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-foreground font-medium">R$ {((p.amount_cents ?? 0) / 100).toFixed(2)}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>{config.label}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4">
                      {p.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => markAsPaid(p.id)}>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Aluno</label>
              <select value={memberId} onChange={e => setMemberId(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="">Selecionar</option>
                {uniqueMembers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor (R$)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Plano</label>
              <select value={planId} onChange={e => setPlanId(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="">Nenhum</option>
                {(plans ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createPayment.isPending || !memberId}>
              {createPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
