import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  Shield,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  CreditCard,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGymDevices, useGymSettings, useGymPlans } from "@/hooks/use-supabase-data";
import { useCreateDevice, useSimulateAccess } from "@/hooks/use-henry-integration";
import { useUpdateGym } from "@/hooks/use-admin-mutations";
import { useToast } from "@/hooks/use-toast";

export default function AdminIntegrations() {
  const { data: devices, isLoading: devicesLoading } = useGymDevices();
  const { data: gym } = useGymSettings();
  const { data: plans } = useGymPlans();
  const createDevice = useCreateDevice();
  const simulateAccess = useSimulateAccess();
  const updateGym = useUpdateGym();
  const { toast } = useToast();

  const [activeIntegration, setActiveIntegration] = useState<"eduzz" | "henry">("eduzz");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceLocation, setNewDeviceLocation] = useState("");
  const [simToken, setSimToken] = useState("");
  const [eduzzSecret, setEduzzSecret] = useState("");
  const [eduzzPlanKeys, setEduzzPlanKeys] = useState<Record<string, string>>({});

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/henry-webhook`;
  const eduzzWebhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/eduzz-webhook?gym_id=${gym?.id ?? ""}`;

  useEffect(() => {
    const settings = (gym?.settings as any) ?? {};
    setEduzzSecret(settings.eduzz_webhook_secret ?? "");

    const productPlanMap = settings.eduzz_product_plan_map ?? {};
    const byPlan: Record<string, string> = {};
    Object.entries(productPlanMap).forEach(([productCode, planId]) => {
      if (typeof productCode === "string" && typeof planId === "string") {
        byPlan[planId] = productCode;
      }
    });
    setEduzzPlanKeys(byPlan);
  }, [gym?.id, gym?.settings]);

  const mappedCount = useMemo(
    () => Object.values(eduzzPlanKeys).filter((code) => code.trim().length > 0).length,
    [eduzzPlanKeys]
  );

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) return;
    createDevice.mutate(
      { name: newDeviceName.trim(), location: newDeviceLocation.trim() || undefined },
      { onSuccess: () => { setNewDeviceName(""); setNewDeviceLocation(""); } }
    );
  };

  const handleSimulate = () => {
    if (!simToken.trim()) return;
    simulateAccess.mutate({ credential_token: simToken.trim() });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL copiada!" });
  };

  const copyEduzzUrl = () => {
    navigator.clipboard.writeText(eduzzWebhookUrl);
    toast({ title: "URL da Eduzz copiada!" });
  };

  const handlePlanCodeChange = (planId: string, productCode: string) => {
    setEduzzPlanKeys((prev) => ({ ...prev, [planId]: productCode }));
  };

  const saveEduzzConfig = async () => {
    if (!gym) return;
    const currentSettings = (gym.settings as any) ?? {};

    const productPlanMap: Record<string, string> = {};
    Object.entries(eduzzPlanKeys).forEach(([planId, productCode]) => {
      const trimmedCode = productCode.trim();
      if (trimmedCode) productPlanMap[trimmedCode] = planId;
    });

    await updateGym.mutateAsync({
      settings: {
        ...currentSettings,
        eduzz_webhook_secret: eduzzSecret.trim(),
        eduzz_product_plan_map: productPlanMap,
      },
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-bold text-foreground">Integrações</h2>

      <div className="flex gap-2">
        <Button
          variant={activeIntegration === "eduzz" ? "pill-active" : "pill"}
          size="pill"
          onClick={() => setActiveIntegration("eduzz")}
        >
          <CreditCard className="w-4 h-4" />
          Eduzz (Pagamentos)
        </Button>
        <Button
          variant={activeIntegration === "henry" ? "pill-active" : "pill"}
          size="pill"
          onClick={() => setActiveIntegration("henry")}
        >
          <Zap className="w-4 h-4" />
          Catraca Henry
        </Button>
      </div>

      {activeIntegration === "eduzz" && (
        <>
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
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Segurança e Mapeamento</h3>
              <span className="text-xs text-muted-foreground">{mappedCount} plano(s) mapeado(s)</span>
            </div>

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

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Mapear código de produto/plano da Eduzz para plano interno</p>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {(plans ?? []).map((plan: any) => (
                  <div key={plan.id} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 items-center">
                    <span className="text-sm text-foreground truncate">{plan.name}</span>
                    <Input
                      value={eduzzPlanKeys[plan.id] ?? ""}
                      onChange={(e) => handlePlanCodeChange(plan.id, e.target.value)}
                      placeholder="Ex.: 123456 ou PROD-ABC"
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
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
        </>
      )}

      {activeIntegration === "henry" && (
        <>
          {/* Webhook URL */}
          <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Webhook URL</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no painel da Henry como endpoint de validação de acesso.
            </p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs bg-secondary" />
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Payload esperado (POST JSON):</p>
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{`{
  "event": "access_request",
  "credential_token": "<token_hash>",
  "device_serial": "<nome_dispositivo>"
}`}</pre>
            </div>
          </div>

          {/* Devices */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Dispositivos ({devices?.length ?? 0})</h3>
            </div>

            {devicesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {(devices ?? []).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    {d.status === "active" ? (
                      <Wifi className="w-4 h-4 text-success" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.location ?? "Sem localização"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {d.status === "active" ? "Online" : d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add device */}
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Adicionar dispositivo</p>
              <div className="flex gap-2">
                <Input
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Nome / Serial"
                  className="flex-1"
                />
                <Input
                  value={newDeviceLocation}
                  onChange={(e) => setNewDeviceLocation(e.target.value)}
                  placeholder="Localização"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddDevice} disabled={createDevice.isPending}>
                  {createDevice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Simulator */}
          <div className="rounded-2xl border border-warning/30 bg-card p-5 space-y-3">
            <h3 className="text-base font-semibold text-foreground">🧪 Simulador de Acesso</h3>
            <p className="text-xs text-muted-foreground">
              Teste a validação da catraca sem hardware físico. Use o token_hash de uma credencial ativa.
            </p>
            <div className="flex gap-2">
              <Input
                value={simToken}
                onChange={(e) => setSimToken(e.target.value)}
                placeholder="Token hash da credencial"
                className="flex-1"
              />
              <Button size="sm" onClick={handleSimulate} disabled={simulateAccess.isPending}>
                {simulateAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simular"}
              </Button>
            </div>

            {simulateAccess.data && (
              <div className={`flex items-center gap-2 rounded-xl p-3 ${
                simulateAccess.data.decision === "allow"
                  ? "bg-success/10 border border-success/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}>
                {simulateAccess.data.decision === "allow" ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {simulateAccess.data.decision === "allow" ? "Acesso Permitido" : "Acesso Negado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {simulateAccess.data.member_name && `Aluno: ${simulateAccess.data.member_name} · `}
                    Motivo: {simulateAccess.data.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
