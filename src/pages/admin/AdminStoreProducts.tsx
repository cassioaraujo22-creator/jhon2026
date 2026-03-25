import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useAdminProducts, useAdminProductMutations } from "@/hooks/use-admin-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function AdminStoreProducts() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useAdminProducts();
  const { remove } = useAdminProductMutations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Produtos da Loja</h2>
        <Button size="sm" onClick={() => navigate("/admin/store/products/new")}><Plus className="w-4 h-4 mr-1" />Novo produto</Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/40 text-muted-foreground text-left"><th className="p-3">Img</th><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3">Ativo</th><th className="p-3">Destaque</th><th className="p-3">Promo</th><th className="p-3"></th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : products?.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/20">
                <td className="p-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/40 overflow-hidden flex items-center justify-center">
                    {(p.images as string[])?.[0] ? <img src={(p.images as string[])[0]} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-4 h-4 text-muted-foreground/40" />}
                  </div>
                </td>
                <td className="p-3 font-medium text-foreground max-w-[160px] truncate">{p.name}</td>
                <td className="p-3 text-muted-foreground">{(p as any).store_categories?.name ?? "—"}</td>
                <td className="p-3 text-foreground">{formatPrice(p.price_cents)}</td>
                <td className="p-3 text-muted-foreground">{p.stock_quantity}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{p.is_active ? "Sim" : "Não"}</span></td>
                <td className="p-3"><span className={`text-xs ${p.is_featured ? "text-primary" : "text-muted-foreground"}`}>{p.is_featured ? "★" : "—"}</span></td>
                <td className="p-3"><span className={`text-xs ${(p as any).is_promotion ? "text-warning font-medium" : "text-muted-foreground"}`}>{(p as any).is_promotion ? "🏷️" : "—"}</span></td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => navigate(`/admin/store/products/${p.id}/edit`)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirm("Excluir?")) remove.mutate(p.id, { onSuccess: () => toast.success("Excluído") }); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
