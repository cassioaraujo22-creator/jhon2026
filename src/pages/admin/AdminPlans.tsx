import { useMemo, useState } from "react";
import { Plus, Loader2, Edit, Trash2, MoreHorizontal, User, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGymPlans } from "@/hooks/use-supabase-data";
import { useCreatePlan, useUpdatePlan, useDeletePlan } from "@/hooks/use-admin-mutations";
import { useGymCoaches } from "@/hooks/use-gym-coaches";
import { useToast } from "@/hooks/use-toast";
import { buildPlanCycleOptions, getLegacyDurationDays, getPlanStartingPrice } from "@/lib/plan-cycles";

const goalIcons: Record<string, string> = { hipertrofia: "💪", emagrecimento: "🔥", performance: "⚡", reabilitacao: "🩹", outro: "🎯" };
type EditableCycle = {
  id: string;
  cycle_name: string;
  duration_days: number;
  price_cents: number;
  sort_order: number;
  active: boolean;
  external_product_code?: string | null;
};

export default function AdminPlans() {
  const { data: plans, isLoading } = useGymPlans();
  const { data: coaches } = useGymCoaches();
  const { toast } = useToast();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    goal_type: "outro",
    level: "",
    active: true,
    personal_trainer_id: "",
    benefits_text: "",
    cycles: [] as EditableCycle[],
  });

  const sortedCycles = useMemo(
    () => [...form.cycles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [form.cycles]
  );

  const reindexCycles = (cycles: EditableCycle[]) =>
    cycles.map((c, idx) => ({ ...c, sort_order: idx + 1 }));

  const syncLegacyFieldsFromCycles = (cycles: EditableCycle[]) => {
    const activeCycles = cycles.filter((c) => c.active);
    const selected = (activeCycles[0] ?? cycles[0]) as EditableCycle | undefined;
    if (!selected) {
      return {
        price_cents: 0,
        billing_cycle: "monthly",
        duration_weeks: 4,
      };
    }

    const durationDays = selected.duration_days || 30;
    let billingCycle: "monthly" | "semiannual" | "annual" | "one_time" = "one_time";
    if (durationDays <= 31) billingCycle = "monthly";
    else if (durationDays >= 160 && durationDays <= 200) billingCycle = "semiannual";
    else if (durationDays >= 330) billingCycle = "annual";

    return {
      price_cents: selected.price_cents,
      billing_cycle: billingCycle,
      duration_weeks: Math.max(1, Math.round(durationDays / 7)),
    };
  };

  const createDefaultCycle = (seed?: Partial<EditableCycle>): EditableCycle => ({
    id: crypto.randomUUID(),
    cycle_name: seed?.cycle_name ?? "Mensal",
    duration_days: seed?.duration_days ?? 30,
    price_cents: seed?.price_cents ?? 14900,
    sort_order: seed?.sort_order ?? 1,
    active: seed?.active ?? true,
    external_product_code: seed?.external_product_code ?? "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      goal_type: "outro",
      level: "",
      active: true,
      personal_trainer_id: "",
      benefits_text: "",
      cycles: [createDefaultCycle()],
    });
    setDialogOpen(true);
  };

  const openEdit = (plan: any) => {
    const cycleOptions = buildPlanCycleOptions(plan);
    setEditing(plan);
    setForm({
      name: plan.name ?? "",
      goal_type: plan.goal_type ?? "outro",
      level: plan.level ?? "",
      active: !!plan.active,
      personal_trainer_id: plan.personal_trainer_id ?? "",
      benefits_text: Array.isArray(plan.benefits) ? plan.benefits.join("\n") : "",
      cycles: cycleOptions.map((cycle, idx) => ({
        id: cycle.id,
        cycle_name: cycle.cycle_name,
        duration_days: cycle.duration_days || getLegacyDurationDays(plan),
        price_cents: cycle.price_cents || plan.price_cents || 0,
        sort_order: cycle.sort_order ?? idx + 1,
        active: cycle.active !== false,
        external_product_code: cycle.external_product_code ?? "",
      })),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Informe o nome do plano", variant: "destructive" });
      return;
    }

    const sanitizedCycles = reindexCycles(
      sortedCycles.map((cycle) => ({
        ...cycle,
        cycle_name: cycle.cycle_name.trim(),
        duration_days: Number(cycle.duration_days || 0),
        price_cents: Number(cycle.price_cents || 0),
      }))
    );

    if (sanitizedCycles.length === 0) {
      toast({ title: "Adicione ao menos um ciclo", variant: "destructive" });
      return;
    }

    if (!sanitizedCycles.some((c) => c.active)) {
      toast({ title: "Ative ao menos um ciclo", variant: "destructive" });
      return;
    }

    const invalidCycle = sanitizedCycles.find(
      (c) => !c.cycle_name || c.duration_days <= 0 || c.price_cents <= 0
    );
    if (invalidCycle) {
      toast({
        title: "Ciclo inválido",
        description: "Cada ciclo precisa de nome, duração (dias) e preço válidos.",
        variant: "destructive",
      });
      return;
    }

    const legacyFields = syncLegacyFieldsFromCycles(sanitizedCycles);
    const payload = {
      name: form.name.trim(),
      goal_type: form.goal_type,
      level: form.level.trim() || null,
      active: form.active,
      personal_trainer_id: form.personal_trainer_id || null,
      benefits: form.benefits_text
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      ...legacyFields,
      cycles: sanitizedCycles.map((cycle) => ({
        cycle_name: cycle.cycle_name,
        duration_days: cycle.duration_days,
        price_cents: cycle.price_cents,
        sort_order: cycle.sort_order,
        active: cycle.active,
        external_product_code: cycle.external_product_code?.trim() || null,
      })),
    };

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

  const addCycle = () => {
    setForm((prev) => ({
      ...prev,
      cycles: reindexCycles([
        ...prev.cycles,
        createDefaultCycle({
          cycle_name: "Novo ciclo",
          duration_days: 30,
          price_cents: 9900,
          sort_order: prev.cycles.length + 1,
          active: true,
        }),
      ]),
    }));
  };

  const updateCycle = (cycleId: string, updates: Partial<EditableCycle>) => {
    setForm((prev) => ({
      ...prev,
      cycles: prev.cycles.map((cycle) => (cycle.id === cycleId ? { ...cycle, ...updates } : cycle)),
    }));
  };

  const removeCycle = (cycleId: string) => {
    setForm((prev) => ({
      ...prev,
      cycles: reindexCycles(prev.cycles.filter((cycle) => cycle.id !== cycleId)),
    }));
  };

  const moveCycle = (cycleId: string, direction: "up" | "down") => {
    setForm((prev) => {
      const cycles = reindexCycles([...prev.cycles].sort((a, b) => a.sort_order - b.sort_order));
      const idx = cycles.findIndex((cycle) => cycle.id === cycleId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= cycles.length) return prev;
      const swapped = [...cycles];
      [swapped[idx], swapped[target]] = [swapped[target], swapped[idx]];
      return { ...prev, cycles: reindexCycles(swapped) };
    });
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
          const cycles = buildPlanCycleOptions(plan);
          const startingPrice = getPlanStartingPrice(plan);
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
                  <p className="text-sm font-bold text-foreground">R$ {(startingPrice / 100).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">A partir de</p>
                </div>
                <div className="rounded-xl bg-secondary p-2">
                  <p className="text-sm font-bold text-foreground">{cycles.length}</p>
                  <p className="text-xs text-muted-foreground">Opções de ciclo</p>
                </div>
              </div>
              {cycles.length > 0 && (
                <div className="text-xs text-muted-foreground rounded-xl border border-border px-3 py-2">
                  {cycles.slice(0, 2).map((c) => `${c.cycle_name} (${c.duration_days} dias)`).join(" • ")}
                  {cycles.length > 2 ? " • ..." : ""}
                </div>
              )}
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
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1 min-h-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Hipertrofia Iniciante"
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Benefícios (1 por linha)</label>
              <textarea
                value={form.benefits_text}
                onChange={(e) => setForm({ ...form, benefits_text: e.target.value })}
                placeholder="Acesso ao app&#10;Treino personalizado"
                className="w-full min-h-24 rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Opções de ciclo e preço</p>
                  <p className="text-xs text-muted-foreground">Defina as opções de assinatura do mesmo plano</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addCycle}>
                  <Plus className="w-4 h-4" />
                  Adicionar ciclo
                </Button>
              </div>

              <div className="space-y-3 max-h-[36vh] overflow-auto pr-1">
                {sortedCycles.map((cycle, idx) => (
                  <div key={cycle.id} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        value={cycle.cycle_name}
                        onChange={(e) => updateCycle(cycle.id, { cycle_name: e.target.value })}
                        placeholder="Nome do ciclo (ex.: Mensal)"
                        className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                      <input
                        type="number"
                        min={1}
                        value={cycle.duration_days}
                        onChange={(e) => updateCycle(cycle.id, { duration_days: Number(e.target.value || 0) })}
                        placeholder="Duração (dias)"
                        className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={(cycle.price_cents / 100).toFixed(2)}
                        onChange={(e) => updateCycle(cycle.id, { price_cents: Math.round(Number(e.target.value || 0) * 100) })}
                        placeholder="Preço (R$)"
                        className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                      <input
                        value={cycle.external_product_code ?? ""}
                        onChange={(e) => updateCycle(cycle.id, { external_product_code: e.target.value })}
                        placeholder="Código produto/oferta (gateway)"
                        className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={cycle.active}
                          onChange={(e) => updateCycle(cycle.id, { active: e.target.checked })}
                        />
                        Ciclo ativo
                      </label>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="outline" className="w-8 h-8" disabled={idx === 0} onClick={() => moveCycle(cycle.id, "up")}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="icon" variant="outline" className="w-8 h-8" disabled={idx === sortedCycles.length - 1} onClick={() => moveCycle(cycle.id, "down")}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="icon" variant="destructive" className="w-8 h-8" onClick={() => removeCycle(cycle.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {sortedCycles.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum ciclo adicionado.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-border">
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
