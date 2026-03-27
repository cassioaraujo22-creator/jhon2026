import { memo } from "react";
import { motion } from "framer-motion";
import { Tag, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default memo(function PromotionSlider() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: sliderData } = useQuery({
    queryKey: ["home-promotions", profile?.gym_id],
    staleTime: 120_000,
    queryFn: async () => {
      const queryBase = () => {
        let q = supabase
          .from("store_products")
          .select("id, name, slug, images, price_cents, compare_at_price_cents, promotion_label")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(10);

        if (profile?.gym_id) {
          q = q.eq("gym_id", profile.gym_id);
        }

        return q;
      };

      const promotionsRes = await queryBase().eq("is_promotion", true);
      if (promotionsRes.error) throw promotionsRes.error;
      if ((promotionsRes.data ?? []).length > 0) {
        return { title: "Promoções", items: promotionsRes.data as any[] };
      }

      const featuredRes = await queryBase().eq("is_featured", true);
      if (featuredRes.error) throw featuredRes.error;
      if ((featuredRes.data ?? []).length > 0) {
        return { title: "Destaques da Loja", items: featuredRes.data as any[] };
      }

      const latestRes = await queryBase();
      if (latestRes.error) throw latestRes.error;
      return { title: "Produtos da Loja", items: (latestRes.data ?? []) as any[] };
    },
  });

  const promos = sliderData?.items ?? [];
  if (promos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-bold text-foreground">{sliderData?.title ?? "Produtos da Loja"}</h3>
        </div>
        <button
          onClick={() => navigate("/app/store")}
          className="flex items-center gap-0.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
        >
          Ver loja <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
        {promos.map((p, i) => {
          const img = (p.images as string[])?.[0];
          const label = (p as any).promotion_label;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              onClick={() => navigate(`/app/store/product/${p.slug}`)}
              className="relative flex-shrink-0 w-56 rounded-2xl overflow-hidden border border-warning/20 bg-card cursor-pointer hover:border-warning/40 transition-all group"
            >
              {/* Image */}
              <div className="h-32 bg-secondary/40 overflow-hidden">
                {img ? (
                  <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Promo badge */}
              {label && (
                <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-warning text-warning-foreground">
                  {label}
                </span>
              )}

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground line-clamp-1">{p.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{formatPrice(p.price_cents)}</span>
                  {p.compare_at_price_cents && p.compare_at_price_cents > p.price_cents && (
                    <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.compare_at_price_cents)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});
