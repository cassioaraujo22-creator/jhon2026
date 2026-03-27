import type { PlanCycleOption } from "@/lib/eduzz";

type LegacyPlan = {
  id: string;
  billing_cycle?: string | null;
  duration_weeks?: number | null;
  price_cents?: number | null;
};

const legacyCycleLabel: Record<string, string> = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual",
  one_time: "Programa",
};

export function getLegacyDurationDays(plan: LegacyPlan): number {
  const byWeeks = (plan.duration_weeks ?? 0) * 7;
  if (byWeeks > 0) return byWeeks;
  switch (plan.billing_cycle) {
    case "monthly":
      return 30;
    case "semiannual":
      return 180;
    case "annual":
      return 365;
    default:
      return 30;
  }
}

export function buildPlanCycleOptions(plan: any): PlanCycleOption[] {
  const cycles = Array.isArray(plan?.plan_cycles) ? plan.plan_cycles : [];
  const normalized = cycles
    .filter((c: any) => c?.active !== false)
    .map((c: any, index: number) => ({
      id: String(c.id),
      cycle_name: String(c.cycle_name ?? "Ciclo"),
      duration_days: Number(c.duration_days ?? 0),
      price_cents: Number(c.price_cents ?? 0),
      sort_order: Number(c.sort_order ?? index + 1),
      active: c.active !== false,
      external_product_code: c.external_product_code ?? null,
    }))
    .filter((c: PlanCycleOption) => c.duration_days > 0 && c.price_cents > 0)
    .sort((a: PlanCycleOption, b: PlanCycleOption) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (normalized.length > 0) return normalized;

  return [
    {
      id: `legacy-${plan.id}`,
      cycle_name: legacyCycleLabel[plan.billing_cycle ?? ""] ?? "Plano",
      duration_days: getLegacyDurationDays(plan),
      price_cents: Math.max(Number(plan.price_cents ?? 0), 0),
      sort_order: 1,
      active: true,
      external_product_code: null,
    },
  ];
}

export function getPlanStartingPrice(plan: any): number {
  const cycles = buildPlanCycleOptions(plan).filter((c) => c.price_cents > 0);
  if (cycles.length === 0) return Math.max(Number(plan.price_cents ?? 0), 0);
  return Math.min(...cycles.map((c) => c.price_cents));
}

export function isPlanCyclesFeatureUnavailable(error: any): boolean {
  const message = String(error?.message ?? "").toLowerCase();
  const details = String(error?.details ?? "").toLowerCase();
  const hint = String(error?.hint ?? "").toLowerCase();
  const code = String(error?.code ?? "").toUpperCase();
  return (
    message.includes("plan_cycles") ||
    details.includes("plan_cycles") ||
    hint.includes("plan_cycles") ||
    code === "PGRST200" ||
    code === "42P01" ||
    code === "42703"
  );
}

