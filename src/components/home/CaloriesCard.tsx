import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useDailyCalories } from "@/hooks/use-home-data";

export default function CaloriesCard() {
  const { data } = useDailyCalories();
  const burned = data?.burned ?? 0;
  const goal = data?.goal ?? 2500;
  const pct = Math.min((burned / goal) * 100, 100);

  const [displayVal, setDisplayVal] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (burned === 0) { setDisplayVal(0); return; }
    const duration = 1200;
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(from + (burned - from) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [burned]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-3xl overflow-hidden p-6"
      style={{
        background: "linear-gradient(135deg, hsl(258 82% 20% / 0.6), hsl(152 60% 20% / 0.4), hsl(225 25% 9%))",
      }}
    >
      <div className="absolute inset-0 backdrop-blur-xl" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Calorias do Dia</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-foreground tabular-nums">{displayVal}</span>
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
          </div>
          <p className="text-xs text-muted-foreground">Meta: {goal} kcal</p>
        </div>

        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(225 20% 16%)" strokeWidth="10" />
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="url(#calGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
            <defs>
              <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(258 82% 60%)" />
                <stop offset="100%" stopColor="hsl(152 60% 50%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Flame className="w-6 h-6 text-warning mb-1" />
            <span className="text-lg font-bold text-foreground">{Math.round(pct)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
