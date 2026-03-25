import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Timer, Dumbbell } from "lucide-react";
import { loadActiveWorkout, type ActiveWorkoutState } from "@/lib/active-workout";

export default memo(function ContinueWorkoutBanner() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ActiveWorkoutState | null>(null);

  useEffect(() => {
    setActive(loadActiveWorkout());
  }, []);

  if (!active) return null;

  const elapsed = active.elapsed;
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const progressPct = active.totalExercises > 0
    ? Math.round((active.currentIndex / active.totalExercises) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl border border-warning/30 bg-gradient-to-r from-warning/10 via-card to-warning/5 p-4 space-y-3 cursor-pointer hover:border-warning/50 transition-all group"
      onClick={() => navigate(`/app/workouts/${active.workoutId}/execute`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
          <Dumbbell className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-warning font-semibold uppercase tracking-wider">Treino em andamento</p>
          <p className="text-sm font-bold text-foreground truncate">{active.workoutName}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Timer className="w-3.5 h-3.5 text-warning" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-warning transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {active.currentIndex}/{active.totalExercises} exercícios • Série {active.currentSet}
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-warning/15 text-warning border border-warning/25 rounded-full px-2.5 py-0.5">
            {progressPct}%
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning group-hover:text-warning/80 transition-colors">
            <Play className="w-3.5 h-3.5" />
            Continuar
          </span>
        </div>
      </div>
    </motion.div>
  );
});
