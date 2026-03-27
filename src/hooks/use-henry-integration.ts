import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function useGymId() {
  const { profile } = useAuth();
  return profile?.gym_id ?? null;
}

export function useCreateDevice() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { name: string; location?: string }) => {
      const { error } = await supabase.from("devices").insert({
        name: data.name,
        location: data.location ?? null,
        gym_id: gymId!,
        type: "henry_turnstile" as const,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-devices"] });
      toast({ title: "Dispositivo adicionado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useSimulateAccess() {
  const gymId = useGymId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { credential_token: string }) => {
      const supabaseBaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${supabaseBaseUrl}/functions/v1/henry-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
          },
          body: JSON.stringify({
            event: "access_request",
            credential_token: data.credential_token,
            gym_id: gymId,
            simulate: true,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      return res.json() as Promise<{
        decision: "allow" | "deny";
        reason: string;
        member_name?: string;
        simulate?: boolean;
      }>;
    },
    onError: (e: any) => toast({ title: "Erro na simulação", description: e.message, variant: "destructive" }),
  });
}

export function useGenerateCredential() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (memberId: string) => {
      // Deactivate any existing active credentials
      await supabase
        .from("access_credentials")
        .update({ status: "blocked" as const })
        .eq("member_id", memberId)
        .eq("gym_id", gymId!)
        .eq("status", "active");

      // Generate new token
      const tokenHash = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { error } = await supabase.from("access_credentials").insert({
        member_id: memberId,
        gym_id: gymId!,
        token_hash: tokenHash,
        type: "qr" as const,
        status: "active" as const,
      });
      if (error) throw error;
      return tokenHash;
    },
    onSuccess: (token) => {
      qc.invalidateQueries({ queryKey: ["gym-credentials"] });
      toast({ title: "Credencial gerada!", description: `Token: ${token.slice(0, 8)}...` });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
