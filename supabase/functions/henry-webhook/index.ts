import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-henry-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();

    // Henry sends: { event: "access_request", credential_token: "...", device_serial: "..." }
    // We also support a "simulate" mode from the admin panel
    const {
      event,
      credential_token,
      device_serial,
      gym_id,
      simulate = false,
    } = body;

    if (!credential_token) {
      return new Response(
        JSON.stringify({ decision: "deny", reason: "missing_token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Look up the credential
    let credentialQuery = supabase
      .from("access_credentials")
      .select("id, member_id, gym_id, status, type")
      .eq("token_hash", credential_token);

    if (gym_id) {
      credentialQuery = credentialQuery.eq("gym_id", gym_id);
    }

    const { data: credential, error: credErr } = await credentialQuery.maybeSingle();

    if (credErr || !credential) {
      const logEntry = {
        gym_id: gym_id ?? "00000000-0000-0000-0000-000000000000",
        decision: "deny" as const,
        reason: "credential_not_found",
        raw: body,
      };
      if (!simulate) await supabase.from("access_logs").insert(logEntry);
      return new Response(
        JSON.stringify({ decision: "deny", reason: "credential_not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check credential status
    if (credential.status !== "active") {
      const logEntry = {
        gym_id: credential.gym_id,
        member_id: credential.member_id,
        credential_id: credential.id,
        decision: "deny" as const,
        reason: `credential_${credential.status}`,
        raw: body,
      };
      if (!simulate) await supabase.from("access_logs").insert(logEntry);
      return new Response(
        JSON.stringify({ decision: "deny", reason: `credential_${credential.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("member_id", credential.member_id)
      .eq("gym_id", credential.gym_id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      const logEntry = {
        gym_id: credential.gym_id,
        member_id: credential.member_id,
        credential_id: credential.id,
        decision: "deny" as const,
        reason: "no_active_membership",
        raw: body,
      };
      if (!simulate) await supabase.from("access_logs").insert(logEntry);
      return new Response(
        JSON.stringify({ decision: "deny", reason: "no_active_membership" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Resolve device (optional)
    let deviceId: string | null = null;
    if (device_serial) {
      const { data: device } = await supabase
        .from("devices")
        .select("id")
        .eq("gym_id", credential.gym_id)
        .eq("name", device_serial)
        .maybeSingle();
      deviceId = device?.id ?? null;
    }

    // 5. Log access and allow
    const logEntry = {
      gym_id: credential.gym_id,
      member_id: credential.member_id,
      credential_id: credential.id,
      device_id: deviceId,
      decision: "allow" as const,
      reason: "valid_credential",
      raw: body,
    };
    if (!simulate) await supabase.from("access_logs").insert(logEntry);

    // Fetch member name for display on turnstile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", credential.member_id)
      .single();

    return new Response(
      JSON.stringify({
        decision: "allow",
        reason: "valid_credential",
        member_name: profile?.name ?? "",
        simulate,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Henry webhook error:", err);
    return new Response(
      JSON.stringify({ decision: "deny", reason: "internal_error", error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
