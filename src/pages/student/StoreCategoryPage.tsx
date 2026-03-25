import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useCategoryBySlug, useStoreProducts } from "@/hooks/use-store-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

type SortOption = "relevance" | "price_asc" | "price_desc";

export default function StoreCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: category } = useCategoryBySlug(slug);
  const { data: products, isLoading } = useStoreProducts({ categorySlug: slug });
  const [sort, setSort] = useState<SortOption>("relevance");

  const sorted = products ? [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price_cents - b.price_cents;
    if (sort === "price_desc") return b.price_cents - a.price_cents;
    return 0;
  }) : [];

  return (
    <div className="px-4 pt-4 pb-8 space-y-5 max-w-lg mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/store")} className="p-2 rounded-xl bg-secondary/60 border border-border">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{category?.name ?? "Categoria"}</h1>
          <p className="text-xs text-muted-foreground">{category?.description}</p>
        </div>
      </div>

      {/* Banner */}
      {category?.banner_image_url && (
        <div className="w-full h-32 rounded-2xl overflow-hidden bg-gradient-card border border-border">
          <img src={category.banner_image_url} alt={category.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Sort */}
      <div className="flex gap-2">
        {(["relevance", "price_asc", "price_desc"] as SortOption[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              sort === s ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/60 text-muted-foreground border-border"
            }`}
          >
            {s === "relevance" ? "Relevância" : s === "price_asc" ? "Menor preço" : "Maior preço"}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-2xl" />)
          : sorted.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/app/store/product/${p.slug}`)}
                className="rounded-2xl p-3 space-y-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-card border border-border"
              >
                <div className="w-full aspect-square rounded-xl bg-secondary/40 flex items-center justify-center overflow-hidden">
                  {(p.images as string[])?.[0] ? (
                    <img src={(p.images as string[])[0]} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                  )}
                </div>
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary">{formatPrice(p.price_cents)}</span>
                  {p.compare_at_price_cents && (
                    <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.compare_at_price_cents)}</span>
                  )}
                </div>
              </motion.div>
            ))}
      </div>
      {!isLoading && sorted.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum produto nesta categoria</p>
      )}
    </div>
  );
}
