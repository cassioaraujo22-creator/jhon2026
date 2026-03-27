export interface PlanCycleOption {
  id: string;
  cycle_name: string;
  duration_days: number;
  price_cents: number;
  sort_order?: number;
  active?: boolean;
  external_product_code?: string | null;
}

export function resolveEduzzProductCodeForPlan(
  settings: Record<string, any> | null | undefined,
  planId: string
): string | null {
  const productPlanMap = (settings?.eduzz_product_plan_map ?? {}) as Record<string, string>;
  for (const [productCode, mappedPlanId] of Object.entries(productPlanMap)) {
    if (mappedPlanId === planId && productCode.trim()) {
      return productCode.trim();
    }
  }
  return null;
}

export function resolveEduzzProductCode(
  settings: Record<string, any> | null | undefined,
  planId: string,
  cycle?: PlanCycleOption | null
): string | null {
  const cycleCode = String(cycle?.external_product_code ?? "").trim();
  if (cycleCode) return cycleCode;
  return resolveEduzzProductCodeForPlan(settings, planId);
}

export function buildEduzzCheckoutUrl(
  settings: Record<string, any> | null | undefined,
  planId: string,
  cycle?: PlanCycleOption | null
): string | null {
  const productCode = resolveEduzzProductCode(settings, planId, cycle);
  if (!productCode) return null;

  const template = String(settings?.eduzz_checkout_url_template ?? "").trim();
  if (!template) return null;

  const replacements: Record<string, string> = {
    "{product_code}": encodeURIComponent(productCode),
    "{plan_code}": encodeURIComponent(productCode),
    "{plan_id}": encodeURIComponent(planId),
    "{cycle_id}": encodeURIComponent(cycle?.id ?? ""),
    "{cycle_name}": encodeURIComponent(cycle?.cycle_name ?? ""),
    "{duration_days}": encodeURIComponent(String(cycle?.duration_days ?? "")),
    "{amount_cents}": encodeURIComponent(String(cycle?.price_cents ?? "")),
  };

  let resolved = template;
  for (const [token, value] of Object.entries(replacements)) {
    if (resolved.includes(token)) {
      resolved = resolved.replaceAll(token, value);
    }
  }

  if (resolved !== template) return resolved;

  if (template.includes("{product_code}")) {
    return template.replaceAll("{product_code}", encodeURIComponent(productCode));
  }

  if (template.includes("{plan_code}")) {
    return template.replaceAll("{plan_code}", encodeURIComponent(productCode));
  }

  // Fallback: append product id query param when no placeholder is provided.
  const separator = template.includes("?") ? "&" : "?";
  const params = [
    `product_id=${encodeURIComponent(productCode)}`,
    `plan_id=${encodeURIComponent(planId)}`,
  ];
  if (cycle?.id) params.push(`cycle_id=${encodeURIComponent(cycle.id)}`);
  if (cycle?.cycle_name) params.push(`cycle_name=${encodeURIComponent(cycle.cycle_name)}`);
  if (cycle?.duration_days) params.push(`duration_days=${encodeURIComponent(String(cycle.duration_days))}`);
  if (cycle?.price_cents) params.push(`amount_cents=${encodeURIComponent(String(cycle.price_cents))}`);
  return `${template}${separator}${params.join("&")}`;
}

