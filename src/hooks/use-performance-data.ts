import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyMetrics {
  id: string;
  calories_burned: number;
  calories_goal: number;
  active_minutes: number;
  workout_time_minutes: number;
  workouts_completed_today: number;
  workouts_completed_week: number;
  streak_days: number;
  intensity_score: number;
  distance_km: number;
  weekly_workout_goal: number;
  steps: number;
  avg_pace: string | null;
}

const defaultMetrics: DailyMetrics = {
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

const getLocalDayIso = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const getStartOfWeekIso = (date = new Date()) => {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  const day = local.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + diffToMonday);
  return getLocalDayIso(local);
};

const mapRowToMetrics = (row: any): DailyMetrics => ({
  id: row.id,
  calories_burned: row.calories_burned,
  calories_goal: row.calories_goal,
  active_minutes: row.active_minutes,
  workout_time_minutes: row.workout_time_minutes,
  workouts_completed_today: row.workouts_completed_today,
  workouts_completed_week: row.workouts_completed_week,
  streak_days: row.streak_days,
  intensity_score: row.intensity_score,
  distance_km: Number(row.distance_km),
  weekly_workout_goal: row.weekly_workout_goal,
  steps: row.steps,
  avg_pace: row.avg_pace,
});

const estimateLogCalories = (durationSeconds: number, caloriesEstimated: number | null) => {
  if (caloriesEstimated && caloriesEstimated > 0) return caloriesEstimated;
  const effectiveDuration = Math.max(30, durationSeconds);
  return Math.max(5, Math.round((effectiveDuration / 60) * 5.5));
};

async function getDailyMetricsFromLogs(
  userId: string,
  day: string,
  caloriesGoal: number,
  weeklyWorkoutGoal: number
): Promise<DailyMetrics> {
  const weekStart = getStartOfWeekIso(new Date(`${day}T12:00:00`));

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, date, status")
    .eq("member_id", userId)
    .gte("date", weekStart)
    .lte("date", day);

  if (sessionsError) throw sessionsError;

  const doneWeek = (sessions ?? []).filter((s) => s.status === "done");
  const doneToday = doneWeek.filter((s) => s.date === day);

  if (doneToday.length === 0) {
    return {
      ...defaultMetrics,
      calories_goal: caloriesGoal,
      weekly_workout_goal: weeklyWorkoutGoal,
      workouts_completed_week: doneWeek.length,
    };
  }

  const sessionIds = doneToday.map((s) => s.id);
  const { data: logs, error: logsError } = await supabase
    .from("workout_logs")
    .select("calories_estimated, duration_seconds")
    .in("session_id", sessionIds);

  if (logsError) throw logsError;

  let totalCalories = 0;
  let totalDurationSeconds = 0;

  (logs ?? []).forEach((log) => {
    const durationSeconds = Math.max(0, Number(log.duration_seconds ?? 0));
    totalDurationSeconds += durationSeconds;
    totalCalories += estimateLogCalories(durationSeconds, log.calories_estimated ?? null);
  });

  const workoutMinutes = Math.round(totalDurationSeconds / 60);
  const intensity =
    workoutMinutes > 0 ? Math.min(100, Math.round((totalCalories / workoutMinutes) * 10)) : 0;

  return {
    ...defaultMetrics,
    calories_goal: caloriesGoal,
    weekly_workout_goal: weeklyWorkoutGoal,
    calories_burned: totalCalories,
    active_minutes: workoutMinutes,
    workout_time_minutes: workoutMinutes,
    workouts_completed_today: doneToday.length,
    workouts_completed_week: doneWeek.length,
    intensity_score: intensity,
  };
}

async function syncMetricsCache(userId: string, day: string, metrics: DailyMetrics, gymId?: string | null) {
  try {
    let resolvedGymId = gymId ?? null;

    if (!resolvedGymId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("id", userId)
        .maybeSingle();
      resolvedGymId = profile?.gym_id ?? null;
    }

    if (!resolvedGymId) return;

    await supabase.from("user_daily_metrics").upsert(
      {
        gym_id: resolvedGymId,
        user_id: userId,
        day,
        calories_burned: metrics.calories_burned,
        calories_goal: metrics.calories_goal,
        active_minutes: metrics.active_minutes,
        workout_time_minutes: metrics.workout_time_minutes,
        workouts_completed_today: metrics.workouts_completed_today,
        workouts_completed_week: metrics.workouts_completed_week,
        intensity_score: metrics.intensity_score,
        weekly_workout_goal: metrics.weekly_workout_goal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" }
    );
  } catch {
    // best effort cache sync
  }
}

export function useDailyMetrics() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = getLocalDayIso();
  const rpcCalledRef = useRef(false);

  // OPTIMIZED: Single realtime channel instead of 3 separate ones
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("perf-metrics-combined")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_daily_metrics", filter: `user_id=eq.${user.id}` },
        () => { qc.invalidateQueries({ queryKey: ["daily-metrics", user.id] }); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_sessions", filter: `member_id=eq.${user.id}` },
        () => {
          rpcCalledRef.current = false; // allow re-calc on next fetch
          setTimeout(() => { qc.invalidateQueries({ queryKey: ["daily-metrics", user.id] }); }, 300);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_logs" },
        () => {
          rpcCalledRef.current = false;
          qc.invalidateQueries({ queryKey: ["daily-metrics", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["daily-metrics", user?.id, today],
    enabled: !!user,
    staleTime: 15_000, // avoid refetch within 15s
    gcTime: 60_000,
    queryFn: async (): Promise<DailyMetrics> => {
      // Only call RPC once per mount cycle to avoid hammering the DB
      if (!rpcCalledRef.current) {
        rpcCalledRef.current = true;
        try {
          await supabase.rpc("calculate_daily_metrics", {
            _user_id: user!.id,
            _day: today,
          });
        } catch {
          // segue com fallback
        }
      }

      let cachedRow: any = null;
      try {
        const { data } = await supabase
          .from("user_daily_metrics")
          .select("*")
          .eq("user_id", user!.id)
          .eq("day", today)
          .maybeSingle();
        cachedRow = data;
      } catch {
        cachedRow = null;
      }

      const cached = cachedRow ? mapRowToMetrics(cachedRow) : null;
      const caloriesGoal = cached?.calories_goal ?? defaultMetrics.calories_goal;
      const weeklyGoal = cached?.weekly_workout_goal ?? defaultMetrics.weekly_workout_goal;

      try {
        const live = await getDailyMetricsFromLogs(user!.id, today, caloriesGoal, weeklyGoal);

        const merged: DailyMetrics = {
          ...defaultMetrics,
          ...(cached ?? {}),
          ...live,
          id: cached?.id ?? live.id,
          streak_days: cached?.streak_days ?? live.streak_days,
          distance_km: cached?.distance_km ?? live.distance_km,
          steps: cached?.steps ?? live.steps,
          avg_pace: cached?.avg_pace ?? live.avg_pace,
        };

        const needsSync =
          !cached ||
          cached.calories_burned !== merged.calories_burned ||
          cached.active_minutes !== merged.active_minutes ||
          cached.workout_time_minutes !== merged.workout_time_minutes ||
          cached.workouts_completed_today !== merged.workouts_completed_today ||
          cached.workouts_completed_week !== merged.workouts_completed_week ||
          cached.intensity_score !== merged.intensity_score;

        if (needsSync) {
          void syncMetricsCache(user!.id, today, merged, cachedRow?.gym_id);
        }

        return merged;
      } catch {
        if (cached) return cached;
        return {
          ...defaultMetrics,
          calories_goal: caloriesGoal,
          weekly_workout_goal: weeklyGoal,
        };
      }
    },
    refetchInterval: 60_000, // 60s instead of 30s
  });
}

export function useHourlyActivity() {
  const { user } = useAuth();
  const today = getLocalDayIso();

  return useQuery({
    queryKey: ["hourly-activity", user?.id, today],
    enabled: !!user,
    staleTime: 30_000, // 30s stale time
    gcTime: 120_000,
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, created_at")
        .eq("member_id", user!.id)
        .eq("date", today)
        .eq("status", "done");

      if (!sessions || sessions.length === 0) {
        return Array.from({ length: 24 }, (_, i) => ({ hour: i, calories: 0, intensity: 0 }));
      }

      const { data: logs } = await supabase
        .from("workout_logs")
        .select("calories_estimated, duration_seconds, created_at")
        .in("session_id", sessions.map((s) => s.id));

      const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, calories: 0, intensity: 0 }));

      (logs ?? []).forEach((log) => {
        const h = new Date(log.created_at).getHours();
        const cal =
          log.calories_estimated && log.calories_estimated > 0
            ? log.calories_estimated
            : Math.round(((log.duration_seconds ?? 0) / 60) * 8);
        hourly[h].calories += cal;
        hourly[h].intensity = Math.min(100, hourly[h].intensity + Math.round(cal / 5));
      });

      return hourly;
    },
  });
}
