import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useStoreCategories, useStoreProducts, useCartCount } from "@/hooks/use-store-data";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function StorePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: categories, isLoading: loadingCats } = useStoreCategories();
  const { data: products, isLoading: loadingProducts } = useStoreProducts({
    categorySlug: activeCategory ?? undefined,
    search: search || undefined,
  });
  const { data: featured, isLoading: loadingFeatured } = useStoreProducts({ featured: true });
  const cartCount = useCartCount();

  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loja</h1>
          <p className="text-sm text-muted-foreground">Suplementos, roupas e acessórios</p>
        </div>
        <button
          onClick={() => navigate("/app/cart")}
          className="relative p-2.5 rounded-2xl bg-secondary/60 border border-border hover:bg-secondary transition-colors"
        >
          <ShoppingBag className="w-5 h-5 text-foreground" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-secondary/60 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          style={{ backdropFilter: "blur(12px)" }}
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border",
            !activeCategory
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-secondary/60 text-muted-foreground border-border hover:border-primary/20"
          )}
        >
          Todos
        </button>
        {loadingCats
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />)
          : categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug === activeCategory ? null : cat.slug)}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border",
                  activeCategory === cat.slug
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-secondary/60 text-muted-foreground border-border hover:border-primary/20"
                )}
              >
                {cat.name}
              </button>
            ))}
      </div>

      {/* Featured Carousel */}
      {!search && !activeCategory && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Destaques</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {loadingFeatured
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="min-w-[160px] h-[200px] rounded-2xl shrink-0" />)
              : featured?.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => navigate(`/app/store/product/${p.slug}`)}
                    className="min-w-[160px] rounded-2xl p-3 space-y-2 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-card border border-border"
                  >
                    <div className="w-full h-24 rounded-xl bg-secondary/40 flex items-center justify-center overflow-hidden">
                      {(p.images as string[])?.[0] ? (
                        <img src={(p.images as string[])[0]} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                      )}
                    </div>
                    {p.compare_at_price_cents && (
                      <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-0">
                        -{Math.round((1 - p.price_cents / p.compare_at_price_cents) * 100)}%
                      </Badge>
                    )}
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
        </section>
      )}

      {/* Categories Grid (when no search and no active filter) */}
      {!search && !activeCategory && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categorias</h2>
          <div className="space-y-2">
            {categories?.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/app/store/category/${cat.slug}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-card border border-border hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid */}
      {(search || activeCategory) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {products?.length ?? 0} produto{(products?.length ?? 0) !== 1 ? "s" : ""}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {loadingProducts
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-2xl" />)
              : products?.map((p, i) => (
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
          {!loadingProducts && products?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum produto encontrado</p>
          )}
        </section>
      )}
    </div>
  );
}
