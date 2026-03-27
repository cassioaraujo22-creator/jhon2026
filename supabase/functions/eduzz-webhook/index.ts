import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-eduzz-token, x-webhook-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonObject = Record<string, unknown>;

function getByPath(obj: JsonObject, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function pickString(obj: JsonObject, paths: string[]): string | null {
  for (const path of paths) {
    const value = getByPath(obj, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function pickNumber(obj: JsonObject, paths: string[]): number | null {
  for (const path of paths) {
    const value = getByPath(obj, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      const normalized = /,\d{1,2}$/.test(trimmed)
        ? trimmed.replace(/\./g, "").replace(",", ".")
        : trimmed.replace(/,/g, "");
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function toIsoDate(input: string | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizePaymentStatus(rawStatus: string | null, eventType: string | null): "paid" | "pending" | "failed" | "refunded" {
  const raw = `${rawStatus ?? ""} ${eventType ?? ""}`.toLowerCase();
  if (raw.includes("refund") || raw.includes("estorno")) return "refunded";
  if (raw.includes("paid") || raw.includes("approved") || raw.includes("success") || raw.includes("completed")) return "paid";
  if (raw.includes("pending") || raw.includes("waiting") || raw.includes("process")) return "pending";
  if (raw.includes("cancel") || raw.includes("failed") || raw.includes("refused") || raw.includes("chargeback") || raw.includes("expired")) return "failed";
  return "pending";
}

function normalizeSubscriptionStatus(rawStatus: string | null, eventType: string | null): "active" | "past_due" | "cancelled" | "trialing" {
  const raw = `${rawStatus ?? ""} ${eventType ?? ""}`.toLowerCase();
  if (raw.includes("trial")) return "trialing";
  if (raw.includes("cancel")) return "cancelled";
  if (raw.includes("past_due") || raw.includes("past due") || raw.includes("overdue") || raw.includes("inadimpl")) return "past_due";
  return "active";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "missing_supabase_env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const body = (await req.json().catch(() => ({}))) as JsonObject;
    const gymId =
      url.searchParams.get("gym_id") ??
      pickString(body, ["gym_id", "gym.id", "account.gym_id", "metadata.gym_id"]);

    if (!gymId) {
      return new Response(JSON.stringify({ error: "missing_gym_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("id, settings")
      .eq("id", gymId)
      .maybeSingle();

    if (gymError || !gym) {
      return new Response(JSON.stringify({ error: "gym_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = (gym.settings ?? {}) as Record<string, unknown>;
    const configuredSecret = String(settings.eduzz_webhook_secret ?? "").trim();
    const headerBearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const candidateSecrets = [
      req.headers.get("x-eduzz-token")?.trim(),
      req.headers.get("x-webhook-token")?.trim(),
      headerBearer,
      pickString(body, ["token", "secret", "webhook_token", "signature"]),
    ].filter(Boolean) as string[];

    if (configuredSecret && !candidateSecrets.some((candidate) => candidate === configuredSecret)) {
      return new Response(JSON.stringify({ error: "invalid_webhook_secret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = pickString(body, ["event", "event_type", "type", "action", "notification_type"]);
    const rawStatus = pickString(body, [
      "status",
      "payment.status",
      "transaction.status",
      "sale.status",
      "subscription.status",
      "data.status",
    ]);

    const paymentStatus = normalizePaymentStatus(rawStatus, eventType);
    const subscriptionStatus = normalizeSubscriptionStatus(rawStatus, eventType);

    const providerPaymentId = pickString(body, [
      "payment_id",
      "transaction_id",
      "sale_id",
      "charge_id",
      "invoice_id",
      "data.payment_id",
      "data.transaction_id",
    ]);
    const providerSubscriptionId = pickString(body, [
      "subscription_id",
      "assination_id",
      "data.subscription_id",
      "subscription.id",
    ]);
    const providerProductCode = pickString(body, [
      "product_id",
      "plan_id",
      "offer_id",
      "item.product_id",
      "data.product_id",
      "subscription.plan_id",
      "metadata.product_id",
    ]);

    const memberIdFromPayload = pickString(body, ["member_id", "buyer.id", "customer.id", "metadata.member_id"]);
    const buyerEmail = pickString(body, [
      "buyer.email",
      "customer.email",
      "email",
      "data.email",
      "contact.email",
    ])?.toLowerCase();
    const planIdFromPayload = pickString(body, ["plan_id", "metadata.plan_id"]);

    const amountCentsRaw = pickNumber(body, [
      "amount_cents",
      "payment.amount_cents",
      "transaction.amount_cents",
      "data.amount_cents",
    ]);
    const amountValue = pickNumber(body, [
      "amount",
      "value",
      "price",
      "total",
      "transaction.amount",
      "payment.amount",
      "data.amount",
    ]);
    const amountCents = amountCentsRaw != null
      ? Math.max(0, Math.round(amountCentsRaw))
      : Math.max(0, Math.round((amountValue ?? 0) * 100));

    const paidAt = toIsoDate(
      pickString(body, ["paid_at", "approved_at", "payment_date", "data.paid_at", "transaction.approved_at"])
    ) ?? (paymentStatus === "paid" ? new Date().toISOString() : null);

    let member: { id: string; gym_id: string; name: string | null } | null = null;
    if (memberIdFromPayload) {
      const { data } = await supabase
        .from("profiles")
        .select("id, gym_id, name")
        .eq("id", memberIdFromPayload)
        .eq("gym_id", gymId)
        .maybeSingle();
      member = data;
    }

    if (!member && buyerEmail) {
      const { data } = await supabase
        .from("profiles")
        .select("id, gym_id, name")
        .eq("gym_id", gymId)
        .ilike("email", buyerEmail)
        .maybeSingle();
      member = data;
    }

    if (!member) {
      return new Response(
        JSON.stringify({
          processed: false,
          reason: "member_not_found",
          gym_id: gymId,
          event_type: eventType,
          payment_status: paymentStatus,
        }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resolvedPlanId: string | null = null;
    if (planIdFromPayload) {
      const { data: explicitPlan } = await supabase
        .from("plans")
        .select("id")
        .eq("id", planIdFromPayload)
        .eq("gym_id", gymId)
        .maybeSingle();
      resolvedPlanId = explicitPlan?.id ?? null;
    }

    if (!resolvedPlanId && providerProductCode) {
      const productPlanMap = (settings.eduzz_product_plan_map ?? {}) as Record<string, string>;
      const mapped = productPlanMap[providerProductCode];
      if (mapped) resolvedPlanId = mapped;
    }

    if (!resolvedPlanId) {
      const { data: activeMembership } = await supabase
        .from("memberships")
        .select("plan_id")
        .eq("gym_id", gymId)
        .eq("member_id", member.id)
        .eq("status", "active")
        .maybeSingle();
      resolvedPlanId = activeMembership?.plan_id ?? null;
    }

    if (providerSubscriptionId) {
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("gym_id", gymId)
        .eq("member_id", member.id)
        .eq("provider", "eduzz")
        .eq("provider_subscription_id", providerSubscriptionId)
        .maybeSingle();

      if (existingSubscription?.id) {
        await supabase
          .from("subscriptions")
          .update({
            status: subscriptionStatus,
            plan_id: resolvedPlanId,
            next_billing_at: toIsoDate(pickString(body, ["next_billing_at", "subscription.next_billing_at"])),
          })
          .eq("id", existingSubscription.id);
      } else {
        await supabase.from("subscriptions").insert({
          gym_id: gymId,
          member_id: member.id,
          plan_id: resolvedPlanId,
          provider: "eduzz",
          provider_subscription_id: providerSubscriptionId,
          status: subscriptionStatus,
          next_billing_at: toIsoDate(pickString(body, ["next_billing_at", "subscription.next_billing_at"])),
        });
      }
    }

    if (providerPaymentId) {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("gym_id", gymId)
        .eq("member_id", member.id)
        .eq("provider", "eduzz")
        .eq("provider_payment_id", providerPaymentId)
        .maybeSingle();

      const paymentPayload = {
        gym_id: gymId,
        member_id: member.id,
        plan_id: resolvedPlanId,
        provider: "eduzz",
        provider_payment_id: providerPaymentId,
        amount_cents: amountCents,
        status: paymentStatus,
        paid_at: paymentStatus === "paid" ? paidAt : null,
        raw: body,
      };

      if (existingPayment?.id) {
        await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
      } else {
        await supabase.from("payments").insert(paymentPayload);
      }
    }

    if (paymentStatus === "paid") {
      const { data: activeMembership } = await supabase
        .from("memberships")
        .select("id, plan_id")
        .eq("gym_id", gymId)
        .eq("member_id", member.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeMembership?.id) {
        await supabase
          .from("memberships")
          .update({
            plan_id: resolvedPlanId ?? activeMembership.plan_id,
            status: "active",
          })
          .eq("id", activeMembership.id);
      } else {
        await supabase.from("memberships").insert({
          gym_id: gymId,
          member_id: member.id,
          plan_id: resolvedPlanId,
          status: "active",
          start_at: new Date().toISOString(),
        });
      }

      await supabase.from("notifications").insert({
        gym_id: gymId,
        user_id: member.id,
        title: "Pagamento aprovado",
        message: "Recebemos seu pagamento e seu plano permanece ativo.",
        type: "payment_paid",
      });
    }

    if (paymentStatus === "failed") {
      await supabase.from("notifications").insert({
        gym_id: gymId,
        user_id: member.id,
        title: "Falha no pagamento",
        message: "Não conseguimos confirmar seu pagamento. Verifique com sua operadora.",
        type: "payment_failed",
      });
    }

    if (subscriptionStatus === "cancelled") {
      await supabase
        .from("memberships")
        .update({ status: "cancelled", end_at: new Date().toISOString() })
        .eq("gym_id", gymId)
        .eq("member_id", member.id)
        .eq("status", "active");
    }

    return new Response(
      JSON.stringify({
        processed: true,
        provider: "eduzz",
        gym_id: gymId,
        member_id: member.id,
        plan_id: resolvedPlanId,
        payment_status: paymentStatus,
        subscription_status: subscriptionStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Eduzz webhook error:", error);
    return new Response(JSON.stringify({ error: "internal_error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
