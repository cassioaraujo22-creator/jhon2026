import { useState } from "react";
import { ArrowLeft, Crown, Check, Sparkles, Zap, Shield, Star, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMyMembership } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const cycleLabels: Record<string, string> = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual",
  one_time: "Avulso",
};

const goalLabels: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  performance: "Performance",
  reabilitacao: "Reabilitação",
  outro: "Geral",
};

export default function StudentPlan() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useMyMembership();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Fetch all available plans for the gym
  const { data: allPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["available-plans", profile?.gym_id],
    enabled: !!profile?.gym_id,
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

  const currentPlan = membership?.plans;
  const currentPlanId = membership?.plan_id;
  const otherPlans = (allPlans ?? []).filter(p => p.id !== currentPlanId);

  const handleUpgrade = async (planId: string) => {
    if (!membership?.id) return;
    setUpgrading(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .update({ plan_id: planId })
        .eq("id", membership.id);
      if (error) throw error;
      toast({ title: "Plano atualizado!", description: "Seu plano foi alterado com sucesso." });
      setSelectedPlanId(null);
      // Force refetch
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  const isLoading = membershipLoading || plansLoading;

  if (isLoading) {
    return (
      <div className="px-5 pt-14 pb-6 max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Meu Plano</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
        </div>
      </div>

      {/* Current Plan Hero Card */}
      {currentPlan ? (
        <div className="relative rounded-3xl border border-primary/30 overflow-hidden animate-fade-in">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none" />
          
          {/* Floating orbs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/10 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="relative p-6 space-y-5">
            {/* Plan badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-[0.15em]">Plano Atual</p>
                  <h2 className="text-xl font-extrabold text-foreground">{currentPlan.name}</h2>
                </div>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0",
                membership?.status === "active"
                  ? "bg-success/15 text-success border-success/20"
                  : "bg-warning/15 text-warning border-warning/20"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  membership?.status === "active" ? "bg-success" : "bg-warning"
                )} />
                {membership?.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-foreground">
                R$ {((currentPlan.price_cents ?? 0) / 100).toFixed(2).replace(".", ",")}
              </span>
              <span className="text-sm text-muted-foreground">
                /{cycleLabels[currentPlan.billing_cycle] ?? currentPlan.billing_cycle}
              </span>
            </div>

            {/* Plan details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Objetivo</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{goalLabels[currentPlan.goal_type] ?? currentPlan.goal_type}</p>
              </div>
              <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nível</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{currentPlan.level ?? "Todos"}</p>
              </div>
              {currentPlan.duration_weeks && (
                <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duração</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{currentPlan.duration_weeks} semanas</p>
                </div>
              )}
              <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cobrança</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{cycleLabels[currentPlan.billing_cycle] ?? currentPlan.billing_cycle}</p>
              </div>
            </div>

            {/* Benefits */}
            {currentPlan.benefits && Array.isArray(currentPlan.benefits) && (currentPlan.benefits as string[]).length > 0 && (
              <div className="space-y-2.5 pt-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Benefícios inclusos</p>
                <div className="space-y-2">
                  {(currentPlan.benefits as string[]).map((benefit: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Membership dates */}
            {membership?.start_at && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span>Início: {new Date(membership.start_at).toLocaleDateString("pt-BR")}</span>
                {membership.end_at && (
                  <span>Vencimento: {new Date(membership.end_at).toLocaleDateString("pt-BR")}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-3 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Sem plano ativo</h2>
          <p className="text-sm text-muted-foreground">Escolha um plano abaixo para começar</p>
        </div>
      )}

      {/* Available Plans / Upgrade Section */}
      {otherPlans.length > 0 && (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {currentPlan ? "Mudar de Plano" : "Planos Disponíveis"}
            </h2>
          </div>

          <div className="space-y-3">
            {otherPlans.map((plan, i) => {
              const isUpgrade = (plan.price_cents ?? 0) > (currentPlan?.price_cents ?? 0);
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                  className={cn(
                    "relative rounded-2xl border p-4 cursor-pointer transition-all duration-300 animate-fade-in",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                  )}
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  {isUpgrade && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                      Upgrade
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary/20" : "bg-secondary"
                      )}>
                        <Crown className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{goalLabels[plan.goal_type] ?? plan.goal_type}</span>
                          {plan.level && (
                            <>
                              <span className="text-xs text-border">•</span>
                              <span className="text-xs text-muted-foreground">{plan.level}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        R$ {((plan.price_cents ?? 0) / 100).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{cycleLabels[plan.billing_cycle] ?? plan.billing_cycle}</p>
                    </div>
                  </div>

                  {/* Expanded benefits */}
                  {isSelected && (
                    <div className="mt-4 space-y-3 animate-fade-in">
                      {plan.benefits && Array.isArray(plan.benefits) && (plan.benefits as string[]).length > 0 && (
                        <div className="space-y-1.5">
                          {(plan.benefits as string[]).map((b: string, j: number) => (
                            <div key={j} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-success shrink-0" />
                              <span className="text-xs text-foreground">{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        variant="glow"
                        size="lg"
                        className="w-full"
                        disabled={upgrading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpgrade(plan.id);
                        }}
                      >
                        {upgrading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {isUpgrade ? "Fazer Upgrade" : "Mudar para este plano"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No other plans */}
      {otherPlans.length === 0 && currentPlan && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">Nenhum outro plano disponível no momento</p>
        </div>
      )}
    </div>
  );
}
