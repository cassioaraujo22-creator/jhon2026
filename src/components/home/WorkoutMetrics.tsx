import { motion } from "framer-motion";
import { Heart, Timer } from "lucide-react";
import { useWeeklyWorkoutTime } from "@/hooks/use-home-data";
import { useMyWorkoutStats } from "@/hooks/use-supabase-data";

export default function WorkoutMetrics() {
  const { data: weeklySeconds } = useWeeklyWorkoutTime();
  const { data: stats } = useMyWorkoutStats();

  const totalMinutes = Math.round((weeklySeconds ?? 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-3 hover:border-primary/20 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-destructive" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Treinos Feitos</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{stats?.done ?? 0}</p>
        <p className="text-[10px] text-muted-foreground">total concluídos</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 space-y-3 hover:border-primary/20 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-info/15 flex items-center justify-center">
            <Timer className="w-4.5 h-4.5 text-info" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Tempo Semanal</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{timeLabel}</p>
        <p className="text-[10px] text-muted-foreground">esta semana</p>
      </motion.div>
    </div>
  );
}
