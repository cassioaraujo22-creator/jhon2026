import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function useGymId() {
  const { profile } = useAuth();
  return profile?.gym_id ?? null;
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  const gymId = useGymId();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { error } = await supabase.from("recipes" as any).insert({ ...payload, gym_id: gymId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-recipes"] });
      toast({ title: "Receita criada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, any>) => {
      const { error } = await supabase.from("recipes" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-recipes"] });
      toast({ title: "Receita atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-recipes"] });
      toast({ title: "Receita removida!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useCreateDiet() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string | null; is_active?: boolean; recipes: Array<{ recipe_id: string; meal_order: number; scheduled_time?: string | null }> }) => {
      const { recipes, ...dietPayload } = payload;
      const { data: diet, error } = await supabase
        .from("diets" as any)
        .insert({
          ...dietPayload,
          gym_id: profile!.gym_id!,
          created_by: profile!.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (recipes.length > 0) {
        const { error: linksError } = await supabase
          .from("diet_recipes" as any)
          .insert(recipes.map((r) => ({ ...r, diet_id: diet.id })));
        if (linksError) throw linksError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-diets"] });
      qc.invalidateQueries({ queryKey: ["diet-recipes"] });
      toast({ title: "Dieta criada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateDiet() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: { id: string; name: string; description?: string | null; is_active?: boolean; recipes: Array<{ recipe_id: string; meal_order: number; scheduled_time?: string | null }> }) => {
      const { id, recipes, ...dietUpdates } = payload;
      const { error } = await supabase.from("diets" as any).update(dietUpdates).eq("id", id);
      if (error) throw error;

      const { error: deleteError } = await supabase.from("diet_recipes" as any).delete().eq("diet_id", id);
      if (deleteError) throw deleteError;

      if (recipes.length > 0) {
        const { error: linksError } = await supabase
          .from("diet_recipes" as any)
          .insert(recipes.map((r) => ({ ...r, diet_id: id })));
        if (linksError) throw linksError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-diets"] });
      qc.invalidateQueries({ queryKey: ["diet-recipes"] });
      qc.invalidateQueries({ queryKey: ["student-active-diet"] });
      toast({ title: "Dieta atualizada!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDiet() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diets" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-diets"] });
      qc.invalidateQueries({ queryKey: ["gym-student-diets"] });
      qc.invalidateQueries({ queryKey: ["student-active-diet"] });
      toast({ title: "Dieta removida!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useAssignDietToStudent() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: {
      student_id: string;
      diet_id: string;
      starts_at: string;
      ends_at?: string | null;
      notes?: string | null;
      status?: "active" | "paused" | "finished";
      skip_duplicate_check?: boolean;
    }) => {
      if (!payload.skip_duplicate_check && payload.status !== "paused" && payload.status !== "finished") {
        const { data: existing, error: existingError } = await supabase
          .from("student_diets" as any)
          .select("id")
          .eq("gym_id", profile!.gym_id!)
          .eq("student_id", payload.student_id)
          .eq("diet_id", payload.diet_id)
          .eq("status", "active")
          .limit(1);
        if (existingError) throw existingError;
        if ((existing ?? []).length > 0) {
          throw new Error("duplicate_active_assignment");
        }
      }

      const { error } = await supabase.from("student_diets" as any).insert({
        gym_id: profile!.gym_id!,
        student_id: payload.student_id,
        diet_id: payload.diet_id,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at ?? null,
        notes: payload.notes ?? null,
        status: payload.status ?? "active",
        assigned_by: profile!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-student-diets"] });
      qc.invalidateQueries({ queryKey: ["student-active-diet"] });
      toast({ title: "Dieta atribuída!" });
    },
    onError: (e: any) => {
      if (e.message === "duplicate_active_assignment") {
        toast({
          title: "Já existe atribuição ativa dessa dieta",
          description: "Confirme para criar uma nova atribuição.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateStudentDietStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "finished" }) => {
      const { error } = await supabase.from("student_diets" as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-student-diets"] });
      qc.invalidateQueries({ queryKey: ["student-active-diet"] });
      toast({ title: "Status da atribuição atualizado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
