import { motion } from "framer-motion";
import { useDailyMetrics, type DailyMetrics } from "@/hooks/use-performance-data";
import PerformanceHeroRing from "./PerformanceHeroRing";
import PerformanceMetricsGrid from "./PerformanceMetricsGrid";
import { Skeleton } from "@/components/ui/skeleton";

const fallbackMetrics: DailyMetrics = {
  id: "",
  calories_burned: 0,
  calories_goal: 2500,
  active_minutes: 0,
  workout_time_minutes: 0,
  workouts_completed_today: 0,
  workouts_completed_week: 0,
  streak_days: 0,
  intensity_score: 0,
  distance_km: 0,
  weekly_workout_goal: 5,
  steps: 0,
  avg_pace: null,
};

export default function PerformanceDashboard() {
  const { data: metrics, isLoading } = useDailyMetrics();

  if (isLoading && !metrics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    );
  }

  const resolvedMetrics = metrics ?? fallbackMetrics;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PerformanceHeroRing metrics={resolvedMetrics} />
      <PerformanceMetricsGrid metrics={resolvedMetrics} />
    </motion.div>
  );
}

