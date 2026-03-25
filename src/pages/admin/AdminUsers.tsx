import { useState } from "react";
import { Search, Plus, MoreHorizontal, Download, Loader2, Trash2, Edit, Dumbbell, QrCode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGymMemberships, useGymPlans, useGymWorkoutTemplates, useGymAssignedWorkouts } from "@/hooks/use-supabase-data";
import { useCreateMembership, useUpdateMembership, useDeleteMembership, useAssignWorkout, useRemoveAssignedWorkout } from "@/hooks/use-admin-mutations";
import { useGenerateCredential } from "@/hooks/use-henry-integration";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-success/15 text-success" },
  paused: { label: "Pausado", className: "bg-warning/15 text-warning" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expirado", className: "bg-destructive/15 text-destructive" },
};

const filters = ["Todos", "Ativos", "Pausados", "Expirados"];

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [planMember, setPlanMember] = useState<any>(null);
  const [assignMember, setAssignMember] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlanId, setNewPlanId] = useState("");
  const [newStatus, setNewStatus] = useState("active");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const { data: memberships, isLoading } = useGymMemberships();
  const { data: plans } = useGymPlans();
  const { data: templates } = useGymWorkoutTemplates();
  const { data: assignedWorkouts } = useGymAssignedWorkouts();
  const { profile } = useAuth();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembership();
  const deleteMembership = useDeleteMembership();
  const assignWorkout = useAssignWorkout();
  const removeAssigned = useRemoveAssignedWorkout();
  const generateCredential = useGenerateCredential();
  const { toast } = useToast();

  const filtered = (memberships ?? []).filter((m: any) => {
    const name = m.profiles?.name ?? "";
    const email = m.profiles?.email ?? "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === "Ativos") return matchSearch && m.status === "active";
    if (activeFilter === "Pausados") return matchSearch && m.status === "paused";
    if (activeFilter === "Expirados") return matchSearch && (m.status === "expired" || m.status === "cancelled");
    return matchSearch;
  });

  const openCreate = () => {
    setEditingMember(null);
    setNewEmail("");
    setNewName("");
    setNewPlanId(plans?.[0]?.id ?? "");
    setNewStatus("active");
    setDialogOpen(true);
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setNewPlanId(member.plan_id ?? "");
    setNewStatus(member.status);
    setDialogOpen(true);
  };

  const openAssign = (member: any) => {
    setAssignMember(member);
    setSelectedTemplateId(templates?.[0]?.id ?? "");
    setAssignDialogOpen(true);
  };

  const openPlanDialog = (member: any) => {
    setPlanMember(member);
    setNewPlanId(member.plan_id ?? "");
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planMember) return;
    await updateMembership.mutateAsync({ id: planMember.id, plan_id: newPlanId || null });
    setPlanDialogOpen(false);
  };

  const getMemberAssignedWorkouts = (memberId: string) => {
    return (assignedWorkouts ?? []).filter((aw: any) => aw.member_id === memberId && aw.status === "active");
  };

  const handleSave = async () => {
    if (editingMember) {
      await updateMembership.mutateAsync({ id: editingMember.id, plan_id: newPlanId || null, status: newStatus });
    } else {
      if (!newEmail.trim()) { toast({ title: "Informe o email", variant: "destructive" }); return; }
      
      const { data: foundProfiles } = await supabase.rpc("find_profile_by_email", { _email: newEmail.trim() });
      const existingProfile = foundProfiles?.[0] ?? null;

      if (!existingProfile) {
        toast({ title: "Usuário não encontrado", description: "O email precisa ter uma conta cadastrada no sistema.", variant: "destructive" });
        return;
      }

      if (!existingProfile.gym_id) {
        await supabase.from("profiles").update({ gym_id: profile!.gym_id }).eq("id", existingProfile.id);
      }

      await createMembership.mutateAsync({
        member_id: existingProfile.id,
        plan_id: newPlanId || undefined,
        status: newStatus,
      });

      await supabase.from("user_roles").upsert(
        { user_id: existingProfile.id, gym_id: profile!.gym_id, role: "member" } as any,
        { onConflict: "user_id,role" }
      ).select();
    }
    setDialogOpen(false);
  };

  const handleAssign = async () => {
    if (!selectedTemplateId || !assignMember) return;
    await assignWorkout.mutateAsync({
      member_id: assignMember.member_id,
      template_id: selectedTemplateId,
    });
    setAssignDialogOpen(false);
  };

  const handleRemoveAssigned = async (id: string) => {
    if (confirm("Remover este treino atribuído?")) {
      await removeAssigned.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este membro?")) {
      await deleteMembership.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Gestão de Alunos</h2>
          <p className="text-sm text-muted-foreground">{memberships?.length ?? 0} alunos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Exportar</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Aluno</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno..."
            className="w-full h-10 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button key={f} variant={activeFilter === f ? "pill-active" : "pill"} size="pill" onClick={() => setActiveFilter(f)}>{f}</Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Treino</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member: any) => {
                const config = statusConfig[member.status] ?? statusConfig.active;
                const name = member.profiles?.name ?? "—";
                const email = member.profiles?.email ?? "";
                const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                const memberWorkouts = getMemberAssignedWorkouts(member.member_id);
                return (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{initials}</div>
                        <div>
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{member.plans?.name ?? "—"}</td>
                    <td className="py-3 px-4">
                      {memberWorkouts.length > 0 ? (
                        <div className="space-y-1">
                          {memberWorkouts.map((aw: any) => (
                            <div key={aw.id} className="flex items-center gap-1.5">
                              <Dumbbell className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-xs text-foreground truncate max-w-[120px]">{aw.workout_templates?.name}</span>
                              <button onClick={() => handleRemoveAssigned(aw.id)} className="text-muted-foreground hover:text-destructive ml-1">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>{config.label}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{member.created_at ? new Date(member.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAssign(member)}><Dumbbell className="w-4 h-4 mr-2" /> Atribuir Treino</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPlanDialog(member)}><CreditCard className="w-4 h-4 mr-2" /> Atribuir Plano</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateCredential.mutate(member.member_id)}><QrCode className="w-4 h-4 mr-2" /> Gerar Credencial</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(member)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(member.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Nenhum aluno encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? "Editar Membro" : "Adicionar Aluno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingMember && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email do aluno</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="aluno@email.com"
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
                <p className="text-xs text-muted-foreground">O aluno precisa ter uma conta cadastrada</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Plano</label>
              <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="">Sem plano</option>
                {(plans ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="cancelled">Cancelado</option>
                <option value="expired">Expirado</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMembership.isPending || updateMembership.isPending}>
              {(createMembership.isPending || updateMembership.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Workout Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Aluno: <span className="font-medium text-foreground">{assignMember?.profiles?.name ?? "—"}</span>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Programa de Treino</label>
              <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="">Selecione...</option>
                {(templates ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} {t.level ? `(${t.level})` : ""}</option>
                ))}
              </select>
            </div>
            {assignMember && getMemberAssignedWorkouts(assignMember.member_id).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Treinos atuais</label>
                <div className="space-y-1">
                  {getMemberAssignedWorkouts(assignMember.member_id).map((aw: any) => (
                    <div key={aw.id} className="flex items-center justify-between rounded-lg bg-secondary p-2">
                      <span className="text-xs text-foreground">{aw.workout_templates?.name}</span>
                      <button onClick={() => handleRemoveAssigned(aw.id)} className="text-xs text-destructive hover:underline">Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={!selectedTemplateId || assignWorkout.isPending}>
              {assignWorkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atribuir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Aluno: <span className="font-medium text-foreground">{planMember?.profiles?.name ?? "—"}</span>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Plano</label>
              <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
                <option value="">Sem plano</option>
                {(plans ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — R$ {(p.price_cents / 100).toFixed(2)} ({p.billing_cycle === "monthly" ? "Mensal" : p.billing_cycle === "semiannual" ? "Semestral" : p.billing_cycle === "annual" ? "Anual" : "Avulso"})
                  </option>
                ))}
              </select>
            </div>
            {planMember?.plans?.name && (
              <p className="text-xs text-muted-foreground">Plano atual: <span className="font-medium text-foreground">{planMember.plans.name}</span></p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan} disabled={updateMembership.isPending}>
              {updateMembership.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
