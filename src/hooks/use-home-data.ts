import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 120_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}

export function useDailyCalories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily-calories", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("member_id", user!.id)
        .eq("date", today)
        .eq("status", "done");

      if (!sessions || sessions.length === 0) return { burned: 0, goal: 2500 };

      const sessionIds = sessions.map(s => s.id);
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("calories_estimated, duration_seconds")
        .in("session_id", sessionIds);

      const burned = (logs ?? []).reduce((sum, l) => {
        if (l.calories_estimated && l.calories_estimated > 0) return sum + l.calories_estimated;
        const mins = (l.duration_seconds ?? 0) / 60;
        return sum + Math.round(mins * 8);
      }, 0);

      return { burned, goal: 2500 };
    },
  });
}

export function useWeeklyWorkoutTime() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["weekly-workout-time", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekStart = startOfWeek.toISOString().split("T")[0];

      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("member_id", user!.id)
        .gte("date", weekStart)
        .eq("status", "done");

      if (!sessions || sessions.length === 0) return 0;

      const { data: logs } = await supabase
        .from("workout_logs")
        .select("duration_seconds")
        .in("session_id", sessions.map(s => s.id));

      return (logs ?? []).reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
    },
  });
}

export function useGymInfo() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-info", profile?.gym_id],
    enabled: !!profile?.gym_id,
    staleTime: 300_000, // gym info rarely changes - 5min
    gcTime: 600_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gyms")
        .select("name, logo_url, accent_color, settings")
        .eq("id", profile!.gym_id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useBodyFocusExercises() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["body-focus-exercises", profile?.gym_id],
    enabled: !!profile?.gym_id,
    staleTime: 300_000, // exercises rarely change - 5min
    gcTime: 600_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, category, media_url, equipment, instructions")
        .eq("gym_id", profile!.gym_id!)
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}
