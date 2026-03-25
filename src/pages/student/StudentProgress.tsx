import { ArrowLeft, Loader2, TrendingUp, Scale, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyWorkoutStats } from "@/hooks/use-supabase-data";

export default function StudentProgress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats } = useMyWorkoutStats();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["my-progress-metrics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_metrics")
        .select("*")
        .eq("member_id", user!.id)
        .order("measured_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const weights = metrics?.filter(m => m.type === "weight") ?? [];
  const bodyfat = metrics?.filter(m => m.type === "bodyfat") ?? [];
  const measurements = metrics?.filter(m => m.type === "measurements") ?? [];

  const latestWeight = weights[0];
  const latestBodyfat = bodyfat[0];

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Meu Progresso</h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center space-y-1">
          <TrendingUp className="w-5 h-5 mx-auto text-success" />
          <p className="text-lg font-bold text-foreground">{stats?.done ?? 0}</p>
          <p className="text-xs text-muted-foreground">Treinos</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center space-y-1">
          <Scale className="w-5 h-5 mx-auto text-primary" />
          <p className="text-lg font-bold text-foreground">{latestWeight ? `${latestWeight.value}kg` : "—"}</p>
          <p className="text-xs text-muted-foreground">Peso</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center space-y-1">
          <Ruler className="w-5 h-5 mx-auto text-warning" />
          <p className="text-lg font-bold text-foreground">{latestBodyfat ? `${latestBodyfat.value}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">BF</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <>
          {/* Weight History */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Histórico de Peso</h2>
            {weights.length > 0 ? (
              <div className="space-y-2">
                {weights.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <span className="text-sm text-foreground font-medium">{m.value} {m.unit ?? "kg"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.measured_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma medição registrada</p>
            )}
          </div>

          {/* Bodyfat History */}
          {bodyfat.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Gordura Corporal</h2>
              <div className="space-y-2">
                {bodyfat.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <span className="text-sm text-foreground font-medium">{m.value}%</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.measured_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Measurements */}
          {measurements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">Medidas</h2>
              <div className="space-y-2">
                {measurements.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <span className="text-sm text-foreground font-medium">{m.value} {m.unit ?? "cm"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.measured_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
