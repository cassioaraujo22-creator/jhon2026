import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminCategories, useAdminCategoryMutations } from "@/hooks/use-admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { StoreCategory } from "@/hooks/use-store-data";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminStoreCategories() {
  const { data: categories, isLoading } = useAdminCategories();
  const { upsert, remove } = useAdminCategoryMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<StoreCategory>>({});

  const handleSave = () => {
    if (!editing.name) { toast.error("Nome é obrigatório"); return; }
    upsert.mutate(
      { ...editing, name: editing.name, slug: editing.slug || slugify(editing.name) } as any,
      { onSuccess: () => { setOpen(false); setEditing({}); toast.success("Salvo!"); } }
    );
  };

  const handleEdit = (cat: StoreCategory) => { setEditing(cat); setOpen(true); };
  const handleNew = () => { setEditing({}); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Categorias da Loja</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing({}); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleNew}><Plus className="w-4 h-4 mr-1" />Nova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
              <div><Label>Slug</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Ícone</Label><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="pill, shirt, dumbbell..." /></div>
              <div><Label>Ordem</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active ?? true} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
                <Label>Ativa</Label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={upsert.isPending}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/40 text-muted-foreground text-left"><th className="p-3">Nome</th><th className="p-3">Slug</th><th className="p-3">Ordem</th><th className="p-3">Ativa</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : categories?.map((cat) => (
              <tr key={cat.id} className="border-t border-border hover:bg-secondary/20">
                <td className="p-3 font-medium text-foreground">{cat.name}</td>
                <td className="p-3 text-muted-foreground">{cat.slug}</td>
                <td className="p-3 text-muted-foreground">{cat.sort_order}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{cat.is_active ? "Sim" : "Não"}</span></td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirm("Excluir?")) remove.mutate(cat.id, { onSuccess: () => toast.success("Excluída") }); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
