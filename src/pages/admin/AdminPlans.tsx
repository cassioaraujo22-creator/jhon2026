import { useState } from "react";
import { Plus, Loader2, Edit, Trash2, MoreHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGymPlans } from "@/hooks/use-supabase-data";
import { useCreatePlan, useUpdatePlan, useDeletePlan } from "@/hooks/use-admin-mutations";
import { useGymCoaches } from "@/hooks/use-gym-coaches";

const goalIcons: Record<string, string> = { hipertrofia: "💪", emagrecimento: "🔥", performance: "⚡", reabilitacao: "🩹", outro: "🎯" };
const billingLabels: Record<string, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual", one_time: "Programa" };

export default function AdminPlans() {
  const { data: plans, isLoading } = useGymPlans();
  const { data: coaches } = useGymCoaches();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price_cents: 0, billing_cycle: "monthly", goal_type: "outro", level: "", duration_weeks: 4, active: true, personal_trainer_id: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price_cents: 0, billing_cycle: "monthly", goal_type: "outro", level: "", duration_weeks: 4, active: true, personal_trainer_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setForm({ name: plan.name, price_cents: plan.price_cents, billing_cycle: plan.billing_cycle, goal_type: plan.goal_type, level: plan.level ?? "", duration_weeks: plan.duration_weeks ?? 4, active: plan.active, personal_trainer_id: plan.personal_trainer_id ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, personal_trainer_id: form.personal_trainer_id || null };
    if (editing) {
      await updatePlan.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createPlan.mutateAsync(payload as any);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este plano?")) await deletePlan.mutateAsync(id);
  };

  const handleToggle = async (plan: any) => {
    await updatePlan.mutateAsync({ id: plan.id, active: !plan.active });
  };

  const getCoachName = (id: string | null) => {
    if (!id) return null;
    return coaches?.find((c) => c.id === id)?.name ?? null;
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Planos por Resultado</h2>
          <p className="text-sm text-muted-foreground">{plans?.length ?? 0} planos configurados</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(plans ?? []).map((plan: any) => {
          const trainerName = getCoachName(plan.personal_trainer_id);
          return (
            <div key={plan.id} className={`rounded-2xl border bg-card p-5 space-y-4 transition-all ${plan.active ? "border-border hover:border-primary/30" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goalIcons[plan.goal_type] ?? "🎯"}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{plan.goal_type} • {plan.level ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(plan)} className={`text-xs px-2 py-1 rounded-full cursor-pointer ${plan.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {plan.active ? "Ativo" : "Inativo"}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(plan)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(plan.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Remover</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-sm font-bold text-foreground">R$ {((plan.price_cents ?? 0) / 100).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{billingLabels[plan.billing_cycle] ?? plan.billing_cycle}</p>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-sm font-bold text-foreground">{plan.duration_weeks ?? "—"}s</p>
                  <p className="text-xs text-muted-foreground">Duração</p>
                </div>
              </div>
              {trainerName && (
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">Personal: {trainerName}</span>
                </div>
              )}
            </div>
          );
        })}
        {(plans ?? []).length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum plano criado</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mensal Hipertrofia"
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preço (R$)</label>
                <input type="number" value={(form.price_cents / 100).toFixed(0)} onChange={e => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ciclo</label>
                <select value={form.billing_cycle} onChange={e => setForm({ ...form, billing_cycle: e.target.value })}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                  <option value="monthly">Mensal</option>
                  <option value="semiannual">Semestral</option>
                  <option value="annual">Anual</option>
                  <option value="one_time">Programa</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Objetivo</label>
                <select value={form.goal_type} onChange={e => setForm({ ...form, goal_type: e.target.value })}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="performance">Performance</option>
                  <option value="reabilitacao">Reabilitação</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nível</label>
                <input value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} placeholder="Iniciante"
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Duração (semanas)</label>
              <input type="number" value={form.duration_weeks} onChange={e => setForm({ ...form, duration_weeks: Number(e.target.value) })}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Personal Trainer</label>
              <select
                value={form.personal_trainer_id}
                onChange={e => setForm({ ...form, personal_trainer_id: e.target.value })}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Sem personal</option>
                {(coaches ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Quando atribuído, o personal aparece na home do aluno</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending}>
              {(createPlan.isPending || updatePlan.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
