import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Copy, Loader2, Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGymWorkoutTemplates } from "@/hooks/use-supabase-data";
import { useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/use-admin-mutations";

const goalColors: Record<string, string> = {
  hipertrofia: "bg-primary/15 text-primary", emagrecimento: "bg-success/15 text-success",
  performance: "bg-info/15 text-info", reabilitacao: "bg-warning/15 text-warning", outro: "bg-muted text-muted-foreground",
};
const goalLabels: Record<string, string> = {
  hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento", performance: "Performance", reabilitacao: "Reabilitação", outro: "Outro",
};

export default function AdminPrograms() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useGymWorkoutTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", goal_type: "outro", level: "", weeks: 4, notes: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", goal_type: "outro", level: "", weeks: 4, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, goal_type: t.goal_type ?? "outro", level: t.level ?? "", weeks: t.weeks ?? 4, notes: t.notes ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateTemplate.mutateAsync({ id: editing.id, ...form });
    } else {
      await createTemplate.mutateAsync(form as any);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este programa?")) await deleteTemplate.mutateAsync(id);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Programas de Treino</h2>
          <p className="text-sm text-muted-foreground">{templates?.length ?? 0} templates criados</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Novo Programa</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(templates ?? []).map((t: any) => {
          const goalKey = t.goal_type ?? "outro";
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/admin/programs/${t.id}`)}>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${goalColors[goalKey] ?? goalColors.outro}`}>
                    {goalLabels[goalKey] ?? goalKey}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${t.id}`); }}><Eye className="w-4 h-4 mr-2" /> Ver Dias</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(t); }}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Remover</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.level ?? "—"} • {t.weeks ?? 0} semanas</p>
                {t.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.notes}</p>}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Por {(t.profiles as any)?.name ?? "—"}</span>
              </div>
            </div>
          );
        })}
        {(templates ?? []).length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum programa criado</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Programa" : "Novo Programa"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Push Pull Legs"
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
              <label className="text-sm font-medium text-foreground">Duração (semanas)</label>
              <input type="number" value={form.weeks} onChange={e => setForm({ ...form, weeks: Number(e.target.value) })}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notas</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Observações sobre o programa..."
                className="w-full rounded-xl bg-secondary border border-border px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createTemplate.isPending || updateTemplate.isPending}>
              {(createTemplate.isPending || updateTemplate.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
