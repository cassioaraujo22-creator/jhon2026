import { memo } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHourlyActivity } from "@/hooks/use-performance-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

const neonGreen = "hsl(152 60% 50%)";

export default memo(function PerformanceActivityChart({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { data: hourly } = useHourlyActivity();

  const currentHour = new Date().getHours();
  const { chartData, hasData } = useMemo(() => {
    const data = (hourly ?? [])
      .filter((h) => h.hour <= currentHour + 1)
      .map((h) => ({
        hour: `${String(h.hour).padStart(2, "0")}h`,
        calorias: h.calories,
      }));
    return { chartData: data, hasData: data.some((d) => d.calorias > 0) };
  }, [hourly, currentHour]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={`rounded-3xl ${compact ? "p-4" : "p-5"} border border-border/50`}
      style={{
        background: "linear-gradient(145deg, hsl(225 25% 10% / 0.9), hsl(225 25% 8%))",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-xl flex items-center justify-center`} style={{ background: `${neonGreen}15` }}>
            <Activity className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} style={{ color: neonGreen }} />
          </div>
          <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-foreground`}>Atividade Hoje</span>
        </div>
        <button
          onClick={() => navigate("/app/progress/today")}
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: neonGreen }}
        >
          Detalhes <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasData ? (
        <div className={compact ? "h-24" : "h-36"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 60% 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152 60% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(225 15% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "hsl(225 15% 45%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225 25% 12%)",
                  border: "1px solid hsl(225 20% 20%)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "hsl(220 20% 95%)",
                }}
                formatter={(value: number) => [`${value} kcal`, "Calorias"]}
              />
              <Area
                type="monotone"
                dataKey="calorias"
                stroke="hsl(152 60% 50%)"
                strokeWidth={2}
                fill="url(#chartFill)"
                dot={false}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={`${compact ? "h-24" : "h-36"} flex items-center justify-center`}>
          <p className="text-xs text-muted-foreground">Nenhuma atividade registrada hoje</p>
        </div>
      )}
    </motion.div>
  );
});
