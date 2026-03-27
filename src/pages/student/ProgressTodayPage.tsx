import { motion } from "framer-motion";
import { ArrowLeft, Flame, Timer, Zap, Target, TrendingUp, Footprints } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDailyMetrics, useHourlyActivity } from "@/hooks/use-performance-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const neonGreen = "hsl(152 60% 50%)";

export default function ProgressTodayPage() {
  const navigate = useNavigate();
  const { data: metrics } = useDailyMetrics();
  const { data: hourly } = useHourlyActivity();

  const pct = metrics && metrics.calories_goal > 0
    ? Math.min((metrics.calories_burned / metrics.calories_goal) * 100, 100)
    : 0;

  const currentHour = new Date().getHours();
  const chartData = (hourly ?? [])
    .filter((h) => h.hour <= currentHour + 1)
    .map((h) => ({
      hour: `${String(h.hour).padStart(2, "0")}h`,
      calorias: h.calories,
      intensidade: h.intensity,
    }));

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Progresso de Hoje</h1>
      </motion.div>

      {/* Big ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center py-6"
      >
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(225 20% 14%)" strokeWidth="12" />
            <motion.circle
              cx="100" cy="100" r={radius}
              fill="none" stroke="url(#detailGradient)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="detailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(152 60% 40%)" />
                <stop offset="100%" stopColor="hsl(152 80% 55%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold tabular-nums text-foreground">{Math.round(pct)}%</span>
            <span className="text-xs text-muted-foreground">da meta de calorias</span>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{metrics?.calories_burned ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">queimadas</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{metrics?.calories_goal ?? 2500}</p>
            <p className="text-[10px] text-muted-foreground">meta kcal</p>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <Timer className="w-4 h-4" />, label: "Tempo Ativo", value: `${metrics?.active_minutes ?? 0}m`, color: neonGreen },
          { icon: <Zap className="w-4 h-4" />, label: "Intensidade", value: `${metrics?.intensity_score ?? 0}/100`, color: "hsl(258 82% 60%)" },
          { icon: <Target className="w-4 h-4" />, label: "Treinos Semana", value: `${metrics?.workouts_completed_week ?? 0}/${metrics?.weekly_workout_goal ?? 5}`, color: "hsl(210 90% 60%)" },
          { icon: <TrendingUp className="w-4 h-4" />, label: "Streak", value: `${metrics?.streak_days ?? 0} dias`, color: "hsl(0 72% 55%)" },
          { icon: <Footprints className="w-4 h-4" />, label: "Distância", value: `${(metrics?.distance_km ?? 0).toFixed(1)} km`, color: neonGreen },
          { icon: <Flame className="w-4 h-4" />, label: "Treino Hoje", value: `${metrics?.workout_time_minutes ?? 0}m`, color: "hsl(38 92% 60%)" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-border/50 p-4"
            style={{ background: "linear-gradient(145deg, hsl(225 25% 10% / 0.9), hsl(225 25% 8%))" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${item.color}15` }}>
              <div style={{ color: item.color }}>{item.icon}</div>
            </div>
            <p className="text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-3xl border border-border/50 p-5"
        style={{ background: "linear-gradient(145deg, hsl(225 25% 10% / 0.9), hsl(225 25% 8%))" }}
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Calorias por Hora</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="detailChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 60% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152 60% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fill: "hsl(225 15% 45%)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "hsl(225 15% 45%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(225 25% 12%)", border: "1px solid hsl(225 20% 20%)", borderRadius: "12px", fontSize: "12px", color: "hsl(220 20% 95%)" }}
                formatter={(value: number) => [`${value} kcal`, "Calorias"]}
              />
              <Area type="monotone" dataKey="calorias" stroke="hsl(152 60% 50%)" strokeWidth={2} fill="url(#detailChartFill)" dot={false} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
