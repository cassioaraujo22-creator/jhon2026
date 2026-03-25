import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flame, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DailyMetrics } from "@/hooks/use-performance-data";

interface Props {
  metrics: DailyMetrics;
}

export default memo(function PerformanceHeroRing({ metrics }: Props) {
  const navigate = useNavigate();
  const pct = metrics.calories_goal > 0
    ? Math.min((metrics.calories_burned / metrics.calories_goal) * 100, 100)
    : 0;
  const remaining = Math.max(0, metrics.calories_goal - metrics.calories_burned);
  const hasWorkoutToday = metrics.workouts_completed_today > 0;

  // Count-up animation with reduced setState calls
  const [displayCal, setDisplayCal] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const animRef = useRef(0);
  const lastCalRef = useRef(-1);
  const lastPctRef = useRef(-1);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    const targetCal = metrics.calories_burned;
    const targetPct = Math.round(pct);

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newCal = Math.round(targetCal * eased);
      const newPct = Math.round(targetPct * eased);
      // Only setState when value actually changes
      if (newCal !== lastCalRef.current) {
        lastCalRef.current = newCal;
        setDisplayCal(newCal);
      }
      if (newPct !== lastPctRef.current) {
        lastPctRef.current = newPct;
        setDisplayPct(newPct);
      }
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [metrics.calories_burned, pct]);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const isHot = pct >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden p-4 border border-primary/30"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-accent/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Floating orbs — using CSS will-change for GPU acceleration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse will-change-[opacity]" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-success/10 blur-2xl animate-pulse will-change-[opacity]" style={{ animationDelay: "1s" }} />

      {/* Neon green glow */}
      <div className="absolute top-1/2 right-12 -translate-y-1/2 w-28 h-28 rounded-full blur-3xl opacity-20" style={{ background: "hsl(152 60% 50%)" }} />

      {isHot && (
        <div className="absolute inset-0 animate-pulse-glow" style={{
          background: "radial-gradient(circle at 70% 40%, hsl(152 60% 50% / 0.1), transparent 50%)",
        }} />
      )}

      <div className="relative z-10 flex items-center justify-between">
        {/* Left side info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(152 60% 50% / 0.15)" }}>
              <Flame className="w-3.5 h-3.5" style={{ color: "hsl(152 60% 50%)" }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Meta Diária
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tabular-nums text-foreground">{displayCal}</span>
              <span className="text-xs text-muted-foreground font-medium">kcal</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {!hasWorkoutToday
                ? "Treine hoje para bater sua meta"
                : remaining > 0
                  ? `Faltam ${remaining} kcal`
                  : "🔥 Meta atingida!"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: "hsl(225 20% 14%)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(152 60% 40%), hsl(152 60% 55%))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: "hsl(152 60% 50%)" }}>
              {displayPct}%
            </span>
          </div>

          <button
            onClick={() => navigate("/app/progress/today")}
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "hsl(152 60% 50%)" }}
          >
            Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0 ml-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(225 20% 14%)" strokeWidth="10" />
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="url(#perfGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
            />
            <defs>
              <linearGradient id="perfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(152 60% 40%)" />
                <stop offset="100%" stopColor="hsl(152 80% 55%)" />
              </linearGradient>
            </defs>
          </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold tabular-nums text-foreground">{displayPct}%</span>
            <span className="text-[9px] text-muted-foreground font-medium">da meta</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
