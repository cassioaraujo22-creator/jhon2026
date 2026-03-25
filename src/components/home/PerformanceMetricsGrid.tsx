import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Timer, Zap, Target, TrendingUp, Footprints } from "lucide-react";
import type { DailyMetrics } from "@/hooks/use-performance-data";

interface Props {
  metrics: DailyMetrics;
}

const neonGreen = "hsl(152 60% 50%)";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  delay: number;
}

const MetricCard = memo(function MetricCard({ icon, label, value, sub, accent = neonGreen, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-3.5 border border-border/50 cursor-default"
      style={{
        background: "linear-gradient(145deg, hsl(225 25% 10% / 0.9), hsl(225 25% 8%))",
      }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${accent}15` }}>
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <p className="text-lg font-bold text-foreground tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </motion.div>
  );
});

export default memo(function PerformanceMetricsGrid({ metrics }: Props) {
  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h${m > 0 ? ` ${m}m` : ""}`;
    }
    return `${mins}m`;
  };

  const cards = useMemo<MetricCardProps[]>(() => [
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Calorias",
      value: `${metrics.calories_burned}`,
      sub: `Meta: ${metrics.calories_goal} kcal`,
      accent: "hsl(38 92% 60%)",
      delay: 0.1,
    },
    {
      icon: <Timer className="w-4 h-4" />,
      label: "Tempo Ativo",
      value: formatTime(metrics.active_minutes),
      sub: "hoje",
      accent: neonGreen,
      delay: 0.15,
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: "Intensidade",
      value: `${metrics.intensity_score}`,
      sub: "score 0-100",
      accent: "hsl(258 82% 60%)",
      delay: 0.2,
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Treinos Hoje",
      value: `${metrics.workouts_completed_today}`,
      sub: `${metrics.workouts_completed_week}/${metrics.weekly_workout_goal} sem`,
      accent: "hsl(210 90% 60%)",
      delay: 0.25,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Streak",
      value: `${metrics.streak_days}d`,
      sub: "dias seguidos",
      accent: "hsl(0 72% 55%)",
      delay: 0.3,
    },
    {
      icon: <Footprints className="w-4 h-4" />,
      label: "Distância",
      value: `${metrics.distance_km.toFixed(1)}`,
      sub: "km estimados",
      accent: neonGreen,
      delay: 0.35,
    },
  ], [metrics.calories_burned, metrics.calories_goal, metrics.active_minutes, metrics.intensity_score, metrics.workouts_completed_today, metrics.workouts_completed_week, metrics.weekly_workout_goal, metrics.streak_days, metrics.distance_km]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
});
