import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isPlanCyclesFeatureUnavailable } from "@/lib/plan-cycles";

// ==========================================
// STUDENT HOOKS
// ==========================================

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyMembership() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-membership", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*, plans(*)")
        .eq("member_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyAssignedWorkouts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-assigned-workouts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assigned_workouts", filter: `member_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-assigned-workouts", user.id] });
          qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
          qc.invalidateQueries({ queryKey: ["my-workout-stats", user.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_sessions", filter: `member_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-sessions", user.id] });
          qc.invalidateQueries({ queryKey: ["my-workout-stats", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: ["my-assigned-workouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*, workout_templates(*)")
        .eq("member_id", user!.id)
        .eq("status", "active")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWorkoutDays(templateId: string | undefined) {
  return useQuery({
    queryKey: ["workout-days", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_days")
        .select("*, workout_items(*, exercises(*))")
        .eq("template_id", templateId!)
        .order("day_index");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyWorkoutSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*, assigned_workouts(*, workout_templates(*))")
        .eq("member_id", user!.id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyWorkoutStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-workout-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("status, date")
        .eq("member_id", user!.id);
      
      const { data: badges } = await supabase
        .from("member_badges")
        .select("id")
        .eq("member_id", user!.id);

      const done = sessions?.filter(s => s.status === "done").length ?? 0;
      const total = sessions?.length ?? 0;
      const badgeCount = badges?.length ?? 0;

      // Calculate streak
      let streak = 0;
      if (sessions) {
        const doneDates = sessions
          .filter(s => s.status === "done")
          .map(s => s.date)
          .sort()
          .reverse();
        
        const today = new Date();
        for (let i = 0; i < doneDates.length; i++) {
          const d = new Date(doneDates[i]);
          const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
          if (diff <= i + 1) streak++;
          else break;
        }
      }

      return { done, total, badgeCount, streak };
    },
  });
}

export function useMyCredential() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-credential", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_credentials")
        .select("*")
        .eq("member_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyPayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, plans(name)")
        .eq("member_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ==========================================
// ADMIN HOOKS
// ==========================================

export function useGymProfiles() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-profiles", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymMemberships() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-memberships", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*, profiles(name, email, phone, avatar_url), plans(name, goal_type)")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymPlans() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-plans", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const withCycles = await supabase
        .from("plans")
        .select("*, plan_cycles(*)")
        .eq("gym_id", profile!.gym_id!);
      if (!withCycles.error) return withCycles.data ?? [];
      if (!isPlanCyclesFeatureUnavailable(withCycles.error)) throw withCycles.error;

      const legacy = await supabase
        .from("plans")
        .select("*")
        .eq("gym_id", profile!.gym_id!);
      if (legacy.error) throw legacy.error;
      return legacy.data ?? [];
    },
  });
}

export function useGymWorkoutTemplates() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-templates", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*, profiles!workout_templates_created_by_fkey(name)")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymPayments() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-payments", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profiles(name), plans(name)")
        .eq("gym_id", profile!.gym_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymAccessLogs() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-access-logs", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("access_logs")
        .select("*, profiles(name), devices(name)")
        .eq("gym_id", profile!.gym_id!)
        .gte("event_time", today)
        .order("event_time", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymDevices() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-devices", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymAssignedWorkouts() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-assigned-workouts", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*, workout_templates(name), profiles(name)")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymExercises() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-exercises", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGymSettings() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-settings", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gyms")
        .select("*")
        .eq("id", profile!.gym_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useGymStats() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-stats", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const gymId = profile!.gym_id!;

      const [membershipsRes, paymentsRes, accessRes] = await Promise.all([
        supabase.from("memberships").select("status, created_at").eq("gym_id", gymId),
        supabase.from("payments").select("amount_cents, status, created_at").eq("gym_id", gymId),
        supabase.from("access_logs").select("decision, event_time").eq("gym_id", gymId),
      ]);

      const memberships = membershipsRes.data ?? [];
      const payments = paymentsRes.data ?? [];

      const activeMembers = memberships.filter(m => m.status === "active").length;
      const thisMonth = new Date().toISOString().slice(0, 7);
      const newThisMonth = memberships.filter(m => m.created_at?.startsWith(thisMonth)).length;
      const paidThisMonth = payments
        .filter(p => p.status === "paid" && p.created_at?.startsWith(thisMonth))
        .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);

      return {
        activeMembers,
        newThisMonth,
        revenue: paidThisMonth,
        totalMemberships: memberships.length,
      };
    },
  });
}
