import { useState, useMemo } from "react";
import { Plus, Loader2, Edit, Trash2, MoreHorizontal, Search, Dumbbell, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGymExercises } from "@/hooks/use-supabase-data";
import { useCreateExercise, useUpdateExercise, useDeleteExercise } from "@/hooks/use-admin-mutations";

const muscleGroups = [
  "Todos", "Peito", "Costas", "Ombro", "Bíceps", "Tríceps",
  "Perna", "Glúteo", "Abdômen", "Cardio", "Outro"
];

const categories = ["compound", "isolamento", "aeróbico", "isométrico", "funcional"];
const equipmentOptions = ["Barra", "Halteres", "Máquina", "Cabo", "Peso Corporal", "Elástico", "Kettlebell", "Esteira", "Bicicleta"];

const defaultForm = { name: "", muscle_group: "", category: "", equipment: "", instructions: "", media_url: "" };

export default function AdminExercises() {
  const { data: exercises, isLoading } = useGymExercises();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("Todos");

  const filtered = useMemo(() => {
    let list = exercises ?? [];
    if (filterGroup !== "Todos") {
      list = list.filter((ex: any) =>
        (ex.muscle_group ?? "").toLowerCase().includes(filterGroup.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((ex: any) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.equipment ?? "").toLowerCase().includes(q) ||
        (ex.muscle_group ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, filterGroup, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (ex: any) => {
    setEditing(ex);
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group ?? "",
      category: ex.category ?? "",
      equipment: ex.equipment ?? "",
      instructions: ex.instructions ?? "",
      media_url: ex.media_url ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      muscle_group: form.muscle_group || null,
      category: form.category || null,
      equipment: form.equipment || null,
      instructions: form.instructions || null,
      media_url: form.media_url || null,
    };
    if (editing) {
      await updateExercise.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createExercise.mutateAsync(payload as any);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este exercício? Ele será desvinculado dos treinos.")) {
      await deleteExercise.mutateAsync(id);
    }
  };

  const isPending = createExercise.isPending || updateExercise.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Exercícios</h2>
          <p className="text-sm text-muted-foreground">{exercises?.length ?? 0} exercícios cadastrados</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Exercício
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercício..."
            className="w-full h-10 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {muscleGroups.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filterGroup === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Exercício</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Grupo Muscular</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Equipamento</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex: any) => (
                <tr key={ex.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {ex.media_url ? (
                          <img src={ex.media_url} alt={ex.name} className="w-full h-full object-contain" />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ex.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden capitalize">{ex.muscle_group ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">
                      {ex.muscle_group ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground capitalize">{ex.category ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{ex.equipment ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(ex)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(ex.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum exercício encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Supino Reto com Barra"
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Grupo Muscular</label>
                <select
                  value={form.muscle_group}
                  onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="">Selecione</option>
                  {muscleGroups.filter((g) => g !== "Todos").map((g) => (
                    <option key={g} value={g.toLowerCase()}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Equipamento</label>
              <select
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Sem equipamento</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL da Mídia (imagem/GIF)</label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Instruções</label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Descreva a execução do exercício..."
                rows={3}
                className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
