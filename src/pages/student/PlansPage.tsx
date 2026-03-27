import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles, Zap, Star, Loader2, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGymInfo } from "@/hooks/use-home-data";
import { buildEduzzCheckoutUrl, resolveEduzzProductCode, type PlanCycleOption } from "@/lib/eduzz";
import { buildPlanCycleOptions, getPlanStartingPrice, isPlanCyclesFeatureUnavailable } from "@/lib/plan-cycles";

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

function calculatePricePerDay(priceCents: number, days: number) {
  if (!days || days <= 0) return null;
  return priceCents / days;
}

export default memo(function PlansPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: gymInfo } = useGymInfo();
  const [checkoutPlan, setCheckoutPlan] = useState<any | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["available-plans", profile?.gym_id],
    enabled: !!profile?.gym_id,
    staleTime: 60_000,
    queryFn: async () => {
      const withCycles = await supabase
        .from("plans")
        .select("*, plan_cycles(*)")
        .eq("gym_id", profile!.gym_id!)
        .eq("active", true)
        .order("price_cents", { ascending: true });
      if (!withCycles.error) return withCycles.data ?? [];
      if (!isPlanCyclesFeatureUnavailable(withCycles.error)) throw withCycles.error;

      const legacy = await supabase
        .from("plans")
        .select("*")
        .eq("gym_id", profile!.gym_id!)
        .eq("active", true)
        .order("price_cents", { ascending: true });
      if (legacy.error) throw legacy.error;
      return legacy.data ?? [];
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const formatPricePerDay = (pricePerDayCents: number | null) => {
    if (!pricePerDayCents) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(pricePerDayCents / 100);
  };

  const openCycleSelector = (plan: any) => {
    const cycles = buildPlanCycleOptions(plan).filter((c) => c.active !== false);
    setCheckoutPlan(plan);
    setSelectedCycleId(cycles[0]?.id ?? null);
  };

  const handleSubscribe = (planId: string, selectedCycle: PlanCycleOption | null) => {
    const gymSettings = (gymInfo?.settings as Record<string, any> | undefined) ?? {};
    const eduzzProductCode = resolveEduzzProductCode(gymSettings, planId, selectedCycle);
    const eduzzCheckoutUrl = buildEduzzCheckoutUrl(gymSettings, planId, selectedCycle);

    if (eduzzProductCode) {
      if (!eduzzCheckoutUrl) {
        toast({
          title: "Checkout da Eduzz não configurado",
          description: "Peça para o admin preencher a URL de checkout da Eduzz em Integrações.",
          variant: "destructive",
        });
        return;
      }
      window.open(eduzzCheckoutUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Redirecionando para pagamento",
        description: "Finalize a compra na Eduzz para ativar o plano escolhido.",
      });
      return;
    }

    navigate("/app/profile/plan", {
      state: {
        planId,
        planCycleId: selectedCycle?.id ?? null,
        planCycleName: selectedCycle?.cycle_name ?? null,
        planCycleDays: selectedCycle?.duration_days ?? null,
        amountCents: selectedCycle?.price_cents ?? null,
      },
    });
  };

  const handleContinueCheckout = async () => {
    if (!checkoutPlan) return;
    if (!selectedCycleId) {
      toast({
        title: "Selecione um ciclo",
        description: "Escolha uma opção de assinatura para continuar.",
        variant: "destructive",
      });
      return;
    }

    const selectedCycle =
      buildPlanCycleOptions(checkoutPlan).find((c) => c.id === selectedCycleId) ?? null;

    setIsOpeningCheckout(true);
    try {
      handleSubscribe(checkoutPlan.id, selectedCycle);
      setCheckoutPlan(null);
      setSelectedCycleId(null);
    } finally {
      setIsOpeningCheckout(false);
    }
  };

  const checkoutCycles = checkoutPlan
    ? buildPlanCycleOptions(checkoutPlan).filter((cycle) => cycle.active !== false)
    : [];

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
        {!isLoading && (plans?.length ?? 0) > 0 ? (
          <div className="rounded-2xl border border-primary/25 bg-gradient-card p-4 mb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">Planos Premium</p>
                <h2 className="text-sm font-semibold text-foreground mt-1">
                  Escolha o ciclo ideal e finalize em poucos toques
                </h2>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        ) : null}

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
            const cycles = buildPlanCycleOptions(plan).filter((c) => c.active !== false);
            const startsAt = getPlanStartingPrice(plan);
            const bestValueCycle =
              [...cycles].sort((a, b) => {
                const aPerDay = (a.price_cents || 0) / Math.max(a.duration_days || 1, 1);
                const bPerDay = (b.price_cents || 0) / Math.max(b.duration_days || 1, 1);
                return aPerDay - bPerDay;
              })[0] ?? null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-2xl border p-5 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isPopular
                    ? "border-primary/45 bg-gradient-card glow-purple shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/25"
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPopular ? "bg-primary/20 border border-primary/25" : "bg-secondary border border-border"}`}>
                        <Icon className={`w-4.5 h-4.5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {cycles.length > 1
                            ? `${cycles.length} opções de assinatura`
                            : `${cycles[0]?.cycle_name ?? cycleLabels[plan.billing_cycle] ?? "Plano"}`}
                          {cycles.length <= 1 && cycles[0]?.duration_days
                            ? ` · ${cycles[0].duration_days} dias`
                            : ""}
                        </p>
                        {bestValueCycle ? (
                          <p className="text-[11px] text-primary font-medium mt-0.5">
                            Melhor custo: {bestValueCycle.cycle_name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-foreground">{formatPrice(startsAt)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cycles.length > 1
                        ? "A partir de"
                        : `/${(cycles[0]?.cycle_name ?? cycleLabels[plan.billing_cycle] ?? "mês").toLowerCase()}`}
                    </p>
                    {bestValueCycle ? (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatPricePerDay(calculatePricePerDay(bestValueCycle.price_cents, bestValueCycle.duration_days))}/dia
                      </p>
                    ) : null}
                  </div>
                </div>

                {cycles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {cycles.slice(0, 3).map((cycle) => (
                      <span
                        key={cycle.id}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-[10px] text-muted-foreground"
                      >
                        <CalendarDays className="w-3 h-3" />
                        {cycle.cycle_name}
                      </span>
                    ))}
                    {cycles.length > 3 ? (
                      <span className="inline-flex items-center rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-[10px] text-muted-foreground">
                        +{cycles.length - 3} opções
                      </span>
                    ) : null}
                  </div>
                ) : null}

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
                    openCycleSelector(plan);
                  }}
                >
                  <Crown className="w-4 h-4" />
                  {cycles.length > 1 ? "Escolher ciclo" : "Assinar Plano"}
                </Button>
              </motion.div>
            );
          })
        )}
      </div>

      <Dialog open={!!checkoutPlan} onOpenChange={(open) => !open && setCheckoutPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha seu plano</DialogTitle>
          </DialogHeader>

          {checkoutPlan && (
            <div className="space-y-3 py-2">
              <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{checkoutPlan.name}</p>
                <p className="text-xs text-muted-foreground">Selecione o ciclo para continuar no pagamento</p>
              </div>

              <div className="space-y-2 max-h-[44vh] overflow-auto pr-1">
                {checkoutCycles.map((cycle) => {
                    const selected = selectedCycleId === cycle.id;
                    const monthlyReference = checkoutCycles.find((c) => c.duration_days >= 28 && c.duration_days <= 35);
                    const currentPerDay = calculatePricePerDay(cycle.price_cents, cycle.duration_days);
                    const monthlyPerDay = monthlyReference
                      ? calculatePricePerDay(monthlyReference.price_cents, monthlyReference.duration_days)
                      : null;
                    const savingsPercent =
                      monthlyPerDay && currentPerDay && monthlyPerDay > currentPerDay
                        ? Math.round(((monthlyPerDay - currentPerDay) / monthlyPerDay) * 100)
                        : 0;
                    const isBestValue = checkoutCycles.length > 1
                      ? checkoutCycles.every((c) => {
                          const cPerDay = calculatePricePerDay(c.price_cents, c.duration_days) ?? Number.POSITIVE_INFINITY;
                          return (currentPerDay ?? Number.POSITIVE_INFINITY) <= cPerDay;
                        })
                      : false;
                    return (
                      <button
                        key={cycle.id}
                        type="button"
                        onClick={() => setSelectedCycleId(cycle.id)}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          selected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{cycle.cycle_name}</p>
                              {isBestValue ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                                  Melhor valor
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">{cycle.duration_days} dias</p>
                            {savingsPercent > 0 ? (
                              <p className="text-[11px] text-success mt-0.5">Economia de até {savingsPercent}% vs mensal</p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{formatPrice(cycle.price_cents)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatPricePerDay(currentPerDay) ? `${formatPricePerDay(currentPerDay)}/dia` : ""}
                            </p>
                            {selected ? <p className="text-[10px] text-primary">Selecionado</p> : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCheckoutPlan(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="glow"
              onClick={handleContinueCheckout}
              disabled={!selectedCycleId || isOpeningCheckout}
            >
              {isOpeningCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continuar para pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
