import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Zap, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const cycleLabels: Record<string, string> = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual",
  one_time: "Avulso",
};

const goalIcons: Record<string, typeof Zap> = {
  hipertrofia: Zap,
  emagrecimento: Star,
  performance: Crown,
};

export default memo(function PlansPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["available-plans", profile?.gym_id],
    enabled: !!profile?.gym_id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("gym_id", profile!.gym_id!)
        .eq("active", true)
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Escolha seu Plano</h1>
            <p className="text-xs text-muted-foreground">Comece sua transformação hoje</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !plans || plans.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Crown className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">Nenhum plano disponível no momento</p>
          </div>
        ) : (
          plans.map((plan, i) => {
            const Icon = goalIcons[plan.goal_type] || Crown;
            const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
            const isPopular = i === Math.floor(plans.length / 2);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-2xl border p-5 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isPopular
                    ? "border-primary/40 bg-gradient-card glow-purple"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-purple text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                    Mais Popular
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPopular ? "bg-primary/20" : "bg-secondary"}`}>
                        <Icon className={`w-4.5 h-4.5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {cycleLabels[plan.billing_cycle] || plan.billing_cycle}
                          {plan.duration_weeks ? ` · ${plan.duration_weeks} sem` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-foreground">{formatPrice(plan.price_cents)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      /{cycleLabels[plan.billing_cycle]?.toLowerCase() || "mês"}
                    </p>
                  </div>
                </div>

                {benefits.length > 0 && (
                  <ul className="space-y-2">
                    {(benefits as string[]).slice(0, 5).map((benefit, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        <span>{String(benefit)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  variant={isPopular ? "glow" : "outline"}
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    // Future: integrate with payment flow
                    navigate("/app/profile/plan");
                  }}
                >
                  <Crown className="w-4 h-4" />
                  Assinar Plano
                </Button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
});
