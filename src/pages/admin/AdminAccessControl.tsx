import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGymAccessLogs, useGymDevices } from "@/hooks/use-supabase-data";
import { useSimulateAccess } from "@/hooks/use-henry-integration";

export default function AdminAccessControl() {
  const [tokenTest, setTokenTest] = useState("");
  const { data: accessLogs, isLoading } = useGymAccessLogs();
  const { data: devices } = useGymDevices();
  const simulateAccess = useSimulateAccess();

  const handleSimulate = () => {
    if (!tokenTest.trim()) return;
    simulateAccess.mutate({ credential_token: tokenTest.trim() });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-bold text-foreground">Controle de Acesso</h2>

      {/* Devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(devices ?? []).map((d: any) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.location ?? "—"}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {d.status}
              </span>
            </div>
          </div>
        ))}
        {(devices ?? []).length === 0 && (
          <div className="col-span-full rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhum dispositivo cadastrado</p>
          </div>
        )}
      </div>

      {/* Simulator */}
      <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-3">
        <h3 className="text-base font-semibold text-foreground">🧪 Modo Simulador</h3>
        <p className="text-xs text-muted-foreground">Teste a validação sem catraca física. Use o token_hash de uma credencial.</p>
        <div className="flex gap-2">
          <input
            value={tokenTest}
            onChange={(e) => setTokenTest(e.target.value)}
            placeholder="Token hash da credencial"
            className="flex-1 h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
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

      {/* Access Logs */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Logs de Acesso — Hoje</h3>
          <span className="text-xs text-muted-foreground">{accessLogs?.length ?? 0} registros</span>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
          <div className="divide-y divide-border/50">
            {(accessLogs ?? []).map((log: any) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 transition-colors">
                <span className="text-xs font-mono text-muted-foreground w-12">
                  {new Date(log.event_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {log.decision === "allow" ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm text-foreground flex-1">{log.profiles?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{log.devices?.name ?? "—"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${log.decision === "allow" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {log.reason ?? log.decision}
                </span>
              </div>
            ))}
            {(accessLogs ?? []).length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhum acesso registrado hoje</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
