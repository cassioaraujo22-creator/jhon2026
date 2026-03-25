import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ChevronRight, CheckCircle2, Loader2, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyAssignedWorkouts, useMyWorkoutSessions } from "@/hooks/use-supabase-data";

export default function StudentWorkouts() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const { data: assigned, isLoading } = useMyAssignedWorkouts();
  const { data: sessions } = useMyWorkoutSessions();

  const filters = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "done", label: "Concluídos" },
  ];

  const filteredWorkouts = (assigned ?? []).filter(w => {
    if (filter === "active") return w.status === "active";
    if (filter === "done") return w.status !== "active";
    return true;
  });

  const getWorkoutStatus = (assignedId: string) => {
    const s = sessions?.filter(s => s.assigned_workout_id === assignedId);
    const done = s?.some(s => s.status === "done");
    return done ? "done" : "active";
  };

  if (isLoading) {
    return (
      <div className="px-5 pt-12 pb-6 max-w-lg mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Meus Treinos</h1>
        <p className="text-sm text-muted-foreground">Seus programas de treino atribuídos</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "pill-active" : "pill"}
            size="pill"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">{filteredWorkouts.length} programa{filteredWorkouts.length !== 1 ? "s" : ""}</p>

      {/* Workout List */}
      {filteredWorkouts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <Dumbbell className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum treino encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((workout) => {
            const status = getWorkoutStatus(workout.id);
            const isDone = status === "done";
            return (
              <div
                key={workout.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 cursor-pointer transition-all ${
                  isDone 
                    ? "border-success/20 bg-card hover:border-success/30" 
                    : "border-border bg-card hover:border-primary/30"
                }`}
                onClick={() => navigate(`/app/workouts/${workout.id}`)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isDone ? "bg-success/10" : "bg-primary/10"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Dumbbell className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{workout.workout_templates?.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {workout.workout_templates?.level ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {workout.workout_templates?.weeks ?? 0} sem
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                    isDone
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {isDone ? "Concluído" : "Ativo"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
