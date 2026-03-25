import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function useGymId() {
  const { profile } = useAuth();
  return profile?.gym_id ?? null;
}

// ==========================================
// PLANS
// ==========================================

export function useCreatePlan() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (plan: { name: string; price_cents: number; billing_cycle: string; goal_type: string; level?: string; duration_weeks?: number; benefits?: any }) => {
      const { error } = await supabase.from("plans").insert({ ...plan, gym_id: gymId! } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-plans"] }); toast({ title: "Plano criado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-plans"] }); toast({ title: "Plano atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-plans"] }); toast({ title: "Plano removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// MEMBERSHIPS (Users)
// ==========================================

export function useCreateMembership() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { member_id: string; plan_id?: string; status?: string }) => {
      const { error } = await supabase.from("memberships").insert({ ...data, gym_id: gymId!, status: data.status ?? "active" } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-memberships"] }); toast({ title: "Membro adicionado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateMembership() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("memberships").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-memberships"] }); toast({ title: "Membro atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteMembership() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("memberships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-memberships"] }); toast({ title: "Membro removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// WORKOUT TEMPLATES (Programs)
// ==========================================

export function useCreateTemplate() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { name: string; goal_type?: string; level?: string; weeks?: number; notes?: string }) => {
      const { error } = await supabase.from("workout_templates").insert({ ...data, gym_id: gymId!, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-templates"] }); toast({ title: "Programa criado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("workout_templates").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-templates"] }); toast({ title: "Programa atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-templates"] }); toast({ title: "Programa removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// PAYMENTS
// ==========================================

export function useCreatePayment() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { member_id: string; amount_cents: number; plan_id?: string; status?: string }) => {
      const { error } = await supabase.from("payments").insert({
        ...data,
        gym_id: gymId!,
        status: data.status ?? "paid",
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-payments"] }); toast({ title: "Pagamento registrado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string }) => {
      const payload: any = { ...updates };
      if (updates.status === "paid") payload.paid_at = new Date().toISOString();
      const { error } = await supabase.from("payments").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-payments"] }); toast({ title: "Pagamento atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// GYM SETTINGS
// ==========================================

export function useUpdateGym() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (updates: { name?: string; logo_url?: string; accent_color?: string; timezone?: string; settings?: any }) => {
      const { error } = await supabase.from("gyms").update(updates).eq("id", gymId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-settings"] });
      qc.invalidateQueries({ queryKey: ["gym-info"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// ASSIGNED WORKOUTS
// ==========================================

export function useAssignWorkout() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { member_id: string; template_id: string; start_date?: string }) => {
      const startDate = data.start_date ?? new Date().toISOString().split("T")[0];

      // 1. Create the assignment
      const { data: assignment, error } = await supabase.from("assigned_workouts").insert({
        member_id: data.member_id,
        template_id: data.template_id,
        gym_id: gymId!,
        status: "active",
        start_date: startDate,
      } as any).select("id").single();
      if (error) throw error;

      // 2. Fetch workout days for the template
      const { data: days } = await supabase
        .from("workout_days")
        .select("day_index")
        .eq("template_id", data.template_id)
        .order("day_index");

      if (days && days.length > 0) {
        // 3. Fetch template weeks
        const { data: template } = await supabase
          .from("workout_templates")
          .select("weeks")
          .eq("id", data.template_id)
          .single();

        const weeks = template?.weeks ?? 4;
        const start = new Date(startDate + "T00:00:00");
        const sessions: any[] = [];

        // Generate sessions: for each week, create a session for each workout day
        for (let w = 0; w < weeks; w++) {
          for (const day of days) {
            const sessionDate = new Date(start);
            sessionDate.setDate(start.getDate() + w * 7 + day.day_index);
            sessions.push({
              member_id: data.member_id,
              gym_id: gymId!,
              assigned_workout_id: assignment.id,
              date: sessionDate.toISOString().split("T")[0],
              status: "planned",
            });
          }
        }

        if (sessions.length > 0) {
          const { error: sessErr } = await supabase.from("workout_sessions").insert(sessions);
          if (sessErr) console.error("Error creating sessions:", sessErr);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-assigned-workouts"] });
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
      qc.invalidateQueries({ queryKey: ["my-assigned-workouts"] });
      qc.invalidateQueries({ queryKey: ["my-workout-stats"] });
      toast({ title: "Treino atribuído!", description: "Sessões geradas no calendário." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useRemoveAssignedWorkout() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assigned_workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-assigned-workouts"] });
      qc.invalidateQueries({ queryKey: ["my-assigned-workouts"] });
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
      qc.invalidateQueries({ queryKey: ["my-workout-stats"] });
      toast({ title: "Treino removido!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// EXERCISES
// ==========================================

export function useCreateExercise() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { name: string; muscle_group?: string | null; category?: string | null; equipment?: string | null; instructions?: string | null; media_url?: string | null }) => {
      const { error } = await supabase.from("exercises").insert({ ...data, gym_id: gymId! } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-exercises"] }); toast({ title: "Exercício criado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("exercises").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-exercises"] }); toast({ title: "Exercício atualizado!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-exercises"] }); toast({ title: "Exercício removido!" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// ==========================================
// PROFILE UPDATES (for linking gym)
// ==========================================

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gym-profiles"] }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
