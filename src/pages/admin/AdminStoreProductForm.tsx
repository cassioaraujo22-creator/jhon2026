import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAdminProductById, useAdminProductMutations } from "@/hooks/use-admin-store";
import { useAdminCategories } from "@/hooks/use-admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminStoreProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { data: existingProduct } = useAdminProductById(id);
  const { data: categories } = useAdminCategories();
  const { upsert } = useAdminProductMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category_id: "",
    short_description: "",
    description: "",
    price_cents: 0,
    compare_at_price_cents: null as number | null,
    stock_quantity: 0,
    sku: "",
    is_featured: false,
    is_active: true,
    is_promotion: false,
    promotion_label: "",
    tags: "",
    imageUrls: [] as string[],
    benefits: "",
    ingredients_or_materials: "",
    usage_instructions: "",
  });

  useEffect(() => {
    if (existingProduct) {
      setForm({
        name: existingProduct.name,
        slug: existingProduct.slug,
        category_id: existingProduct.category_id ?? "",
        short_description: existingProduct.short_description ?? "",
        description: existingProduct.description ?? "",
        price_cents: existingProduct.price_cents,
        compare_at_price_cents: existingProduct.compare_at_price_cents,
        stock_quantity: existingProduct.stock_quantity,
        sku: existingProduct.sku ?? "",
        is_featured: existingProduct.is_featured,
        is_active: existingProduct.is_active,
        is_promotion: (existingProduct as any).is_promotion ?? false,
        promotion_label: (existingProduct as any).promotion_label ?? "",
        tags: (existingProduct.tags ?? []).join(", "),
        imageUrls: (existingProduct.images as string[]) ?? [],
        benefits: ((existingProduct.benefits as string[]) ?? []).join("\n"),
        ingredients_or_materials: ((existingProduct.ingredients_or_materials as string[]) ?? []).join("\n"),
        usage_instructions: existingProduct.usage_instructions ?? "",
      });
    }
  }, [existingProduct]);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `products/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("store-products")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("store-products")
        .getPublicUrl(path);

      newUrls.push(urlData.publicUrl);
    }

    setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    setUploading(false);
    if (newUrls.length > 0) toast.success(`${newUrls.length} imagem(ns) enviada(s)`);
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    const payload = {
      ...(isEdit ? { id } : {}),
      name: form.name,
      slug: form.slug || slugify(form.name),
      category_id: form.category_id || null,
      short_description: form.short_description || null,
      description: form.description || null,
      price_cents: form.price_cents,
      compare_at_price_cents: form.compare_at_price_cents || null,
      stock_quantity: form.stock_quantity,
      sku: form.sku || null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      is_promotion: form.is_promotion,
      promotion_label: form.promotion_label || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      images: form.imageUrls,
      benefits: form.benefits ? form.benefits.split("\n").map((b) => b.trim()).filter(Boolean) : [],
      ingredients_or_materials: form.ingredients_or_materials ? form.ingredients_or_materials.split("\n").map((i) => i.trim()).filter(Boolean) : [],
      usage_instructions: form.usage_instructions || null,
    };
    upsert.mutate(payload as any, {
      onSuccess: () => { toast.success("Salvo!"); navigate("/admin/store/products"); },
    });
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/store/products")} className="p-2 rounded-xl bg-secondary/60 border border-border">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{isEdit ? "Editar" : "Novo"} Produto</h2>
      </div>

      <div className="space-y-4 p-5 rounded-2xl bg-card border border-border">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => { set("name", e.target.value); if (!isEdit) set("slug", slugify(e.target.value)); }} /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} /></div>
        </div>

        <div>
          <Label>Categoria</Label>
          <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div><Label>Descrição curta</Label><Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} /></div>
        <div><Label>Descrição completa</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} /></div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Imagens do produto</Label>

          {/* Preview grid */}
          {form.imageUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-secondary/40">
                  <img src={url} alt={`Produto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUploadImages(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-secondary/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Enviando...</span></>
            ) : (
              <><Upload className="w-5 h-5" /><span className="text-sm">Clique para enviar imagens</span></>
            )}
          </button>
          <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. Múltiplas imagens permitidas.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><Label>Preço (centavos) *</Label><Input type="number" value={form.price_cents} onChange={(e) => set("price_cents", parseInt(e.target.value) || 0)} /></div>
          <div><Label>Preço "de" (centavos)</Label><Input type="number" value={form.compare_at_price_cents ?? ""} onChange={(e) => set("compare_at_price_cents", parseInt(e.target.value) || null)} /></div>
          <div><Label>Estoque</Label><Input type="number" value={form.stock_quantity} onChange={(e) => set("stock_quantity", parseInt(e.target.value) || 0)} /></div>
        </div>

        <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
        <div><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="whey, proteina, isolado" /></div>
        <div><Label>Benefícios (um por linha)</Label><Textarea value={form.benefits} onChange={(e) => set("benefits", e.target.value)} rows={3} /></div>
        <div><Label>Ingredientes/Material (um por linha)</Label><Textarea value={form.ingredients_or_materials} onChange={(e) => set("ingredients_or_materials", e.target.value)} rows={3} /></div>
        <div><Label>Instruções de uso</Label><Textarea value={form.usage_instructions} onChange={(e) => set("usage_instructions", e.target.value)} rows={3} /></div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(c) => set("is_featured", c)} /><Label>Destaque</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => set("is_active", c)} /><Label>Ativo</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_promotion} onCheckedChange={(c) => set("is_promotion", c)} /><Label>Promoção</Label></div>
        </div>

        {form.is_promotion && (
          <div><Label>Rótulo da promoção (ex: "50% OFF", "Black Friday")</Label><Input value={form.promotion_label} onChange={(e) => set("promotion_label", e.target.value)} placeholder="Ex: 30% OFF" /></div>
        )}

        <Button className="w-full" size="lg" onClick={handleSave} disabled={upsert.isPending}>
          {isEdit ? "Atualizar produto" : "Criar produto"}
        </Button>
      </div>
    </div>
  );
}
