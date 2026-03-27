import { useEffect, useState } from "react";
import { Loader2, Copy, ExternalLink, CreditCard, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { useUpdateGym } from "@/hooks/use-admin-mutations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminIntegrations() {
  const { profile, user } = useAuth();
  const { data: gym } = useGymSettings();
  const updateGym = useUpdateGym();
  const { toast } = useToast();

  const [eduzzSecret, setEduzzSecret] = useState("");
  const [eduzzCheckoutTemplate, setEduzzCheckoutTemplate] = useState("");

  const { data: fallbackGymId } = useQuery({
    queryKey: ["integrations-fallback-gym-id", user?.id],
    enabled: !!user?.id && !profile?.gym_id && !gym?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_gym_id", { _user_id: user!.id });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
  });

  const supabaseBaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const gymId = gym?.id ?? profile?.gym_id ?? fallbackGymId ?? "";
  const eduzzWebhookUrl = `${supabaseBaseUrl}/functions/v1/eduzz-webhook?gym_id=${encodeURIComponent(gymId)}`;

  useEffect(() => {
    const settings = (gym?.settings as any) ?? {};
    setEduzzSecret(settings.eduzz_webhook_secret ?? "");
    setEduzzCheckoutTemplate(settings.eduzz_checkout_url_template ?? "");
  }, [gym?.id, gym?.settings]);

  const copyEduzzUrl = () => {
    navigator.clipboard.writeText(eduzzWebhookUrl);
    toast({ title: "URL da Eduzz copiada!" });
  };

  const saveEduzzConfig = async () => {
    if (!gym) return;
    const currentSettings = (gym.settings as any) ?? {};

    await updateGym.mutateAsync({
      settings: {
        ...currentSettings,
        eduzz_webhook_secret: eduzzSecret.trim(),
        eduzz_checkout_url_template: eduzzCheckoutTemplate.trim(),
      },
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex gap-2">
        <Button variant="pill-active" size="pill">
          <CreditCard className="w-4 h-4" />
          Eduzz (Pagamentos)
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Webhook Eduzz</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure esta URL no painel da Eduzz para receber eventos de compra, assinatura e cobrança.
        </p>
        <div className="flex gap-2">
          <Input value={eduzzWebhookUrl} readOnly className="font-mono text-xs bg-secondary" />
          <Button variant="outline" size="sm" onClick={copyEduzzUrl}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Configuração da Eduzz</h3>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Segredo do Webhook (token)</label>
          <Input
            type="password"
            value={eduzzSecret}
            onChange={(e) => setEduzzSecret(e.target.value)}
            placeholder="Cole aqui o token secreto configurado na Eduzz"
          />
          <p className="text-[11px] text-muted-foreground">
            O webhook valida os headers `x-eduzz-token`, `x-webhook-token` ou `Authorization: Bearer`.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">URL de checkout Eduzz (template)</label>
          <Input
            value={eduzzCheckoutTemplate}
            onChange={(e) => setEduzzCheckoutTemplate(e.target.value)}
            placeholder="https://checkout.exemplo.com/{product_code}"
          />
          <p className="text-[11px] text-muted-foreground">
            Use <code>{"{product_code}"}</code>, <code>{"{cycle_id}"}</code>, <code>{"{cycle_name}"}</code>,{" "}
            <code>{"{duration_days}"}</code> e <code>{"{amount_cents}"}</code> para enviar o ciclo escolhido.
          </p>
          <p className="text-[11px] text-muted-foreground">
            O código do produto agora é configurado no cadastro do plano, em cada ciclo.
          </p>
        </div>

        <Button onClick={saveEduzzConfig} disabled={updateGym.isPending}>
          {updateGym.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar configuração Eduzz
        </Button>
      </div>

      <div className="rounded-2xl border border-warning/30 bg-card p-5 space-y-2">
        <p className="text-sm font-medium text-foreground">Eventos processados automaticamente</p>
        <p className="text-xs text-muted-foreground">
          Pagamentos criados/atualizados em `payments`, assinatura atualizada em `subscriptions` e matrícula ativada/cancelada em `memberships` conforme status recebido.
        </p>
      </div>
    </div>
  );
}
