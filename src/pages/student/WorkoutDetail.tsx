import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell, Clock, Zap, Play, Loader2, Image as ImageIcon, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, Target, Check, Weight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyAssignedWorkouts, useWorkoutDays, useMyWorkoutSessions } from "@/hooks/use-supabase-data";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function ExerciseInstructions({ instructions }: { instructions: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!instructions) return null;

  let parsed: any = null;
  try { parsed = JSON.parse(instructions); } catch { return null; }
  if (!parsed) return null;

  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-xs text-primary font-medium">
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Ocultar instruções" : "Ver instruções"}
      </button>
      {expanded && (
        <div className="space-y-3 animate-slide-up">
          {parsed.steps && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1"><Target className="w-3 h-3 text-primary" /> Passo a Passo</p>
              {parsed.steps.map((step: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">
                  <span className="text-primary font-semibold">{i + 1}.</span> {step}
                </p>
              ))}
            </div>
          )}
          {parsed.tips && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1"><Lightbulb className="w-3 h-3 text-warning" /> Dicas</p>
              {parsed.tips.map((tip: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">• {tip}</p>
              ))}
            </div>
          )}
          {parsed.common_mistakes && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" /> Erros Comuns</p>
              {parsed.common_mistakes.map((m: string, i: number) => (
                <p key={i} className="text-xs text-muted-foreground pl-4">⚠ {m}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeightHistory({ exerciseId }: { exerciseId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ["weight-history", exerciseId, user?.id],
    enabled: !!exerciseId && !!user && expanded,
    queryFn: async () => {
      // Get last 10 logs for this exercise from the user's sessions
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("performed_sets, created_at, session_id, workout_sessions!inner(member_id, date)")
        .eq("exercise_id", exerciseId!)
        .eq("workout_sessions.member_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!logs || logs.length === 0) return [];

      return logs.map((log) => {
        let sets: { set: number; reps: string; weight_kg?: number | null }[] = [];
        try {
          const raw = typeof log.performed_sets === "string" ? JSON.parse(log.performed_sets) : log.performed_sets;
          if (Array.isArray(raw)) sets = raw;
        } catch {}
        const date = (log.workout_sessions as any)?.date ?? log.created_at?.split("T")[0];
        const maxWeight = Math.max(0, ...sets.map(s => s.weight_kg ?? 0));
        return { date, sets, maxWeight };
      }).filter(h => h.maxWeight > 0);
    },
  });

  if (!exerciseId) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-accent-foreground/70 font-medium"
      >
        <Weight className="w-3 h-3" />
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Ocultar cargas" : "Histórico de cargas"}
      </button>
      {expanded && (
        <div className="animate-slide-up">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Carregando...</span>
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-1">Nenhum registro de carga encontrado</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border/50 px-3 py-2">
                  <span className="text-[10px] text-muted-foreground font-mono w-20 shrink-0">
                    {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {entry.sets.filter(s => s.weight_kg).map((s, si) => (
                      <span key={si} className="text-xs font-semibold text-foreground bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">
                        S{s.set}: {s.weight_kg}kg
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary">{entry.maxWeight}kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkoutDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: assigned } = useMyAssignedWorkouts();

  const workout = assigned?.find(w => w.id === id);
  const templateId = workout?.template_id;
  const { data: days, isLoading } = useWorkoutDays(templateId);
  const { data: sessions } = useMyWorkoutSessions();

  const allItems = days?.flatMap(d => d.workout_items ?? []) ?? [];
  const template = workout?.workout_templates;

  const todayStr = new Date().toISOString().split("T")[0];
  const isTodayDone = (sessions ?? []).some(
    s => s.assigned_workout_id === id && s.status === "done" && s.date === todayStr
  );

  if (isLoading) {
    return (
      <div className="px-5 pt-14 pb-6 max-w-lg mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{template?.name ?? "Treino"}</h1>
          <p className="text-sm text-muted-foreground">{template?.goal_type ?? ""} • {template?.level ?? ""}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-primary" />{allItems.length} exercícios</span>
        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{template?.weeks ?? 0} semanas</span>
      </div>

      {template?.notes && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Observações</p>
          <p className="text-sm text-foreground">{template.notes}</p>
        </div>
      )}

      {isTodayDone ? (
        <Button variant="outline" size="lg" className="w-full" disabled>
          <Check className="w-5 h-5" /> Treino Concluído Hoje ✓
        </Button>
      ) : (
        <Button variant="glow" size="lg" className="w-full" onClick={() => navigate(`/app/workouts/${id}/execute`)}>
          <Play className="w-5 h-5" /> Iniciar Treino
        </Button>
      )}

      {/* Workout Days */}
      {(days ?? []).map((day) => (
        <div key={day.id} className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">{day.title || `Dia ${day.day_index + 1}`}</h2>
          {(day.workout_items ?? [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((item: any, i: number) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Exercise Image */}
              {item.exercises?.media_url && (
                <div className="w-full h-40 bg-secondary overflow-hidden">
                  <img
                    src={item.exercises.media_url}
                    alt={item.exercises?.name ?? "Exercício"}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.exercises?.name ?? "Exercício"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{item.sets} × {item.reps}</span>
                      <span>🔄 {item.rest_seconds}s</span>
                      {item.intensity && <span className="text-primary">{item.intensity}</span>}
                    </div>
                  </div>
                </div>
                {/* AI Instructions */}
                <ExerciseInstructions instructions={item.exercises?.instructions ?? null} />
                {/* Weight History */}
                <WeightHistory exerciseId={item.exercise_id ?? null} />
              </div>
            </div>
          ))}
        </div>
      ))}

      {allItems.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhum exercício cadastrado neste treino</p>
        </div>
      )}
    </div>
  );
}
