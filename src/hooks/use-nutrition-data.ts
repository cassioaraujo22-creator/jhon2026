import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Recipe {
  id: string;
  gym_id: string;
  title: string;
  description: string | null;
  meal_type: "cafe_da_manha" | "almoco" | "jantar" | "lanche" | "ceia";
  prep_time_minutes: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: string[];
  steps: string[];
  image_url: string | null;
  is_active: boolean;
}

export interface Diet {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
}

export interface DietRecipe {
  id: string;
  diet_id: string;
  recipe_id: string;
  meal_order: number;
  scheduled_time: string | null;
}

export interface StudentDiet {
  id: string;
  gym_id: string;
  student_id: string;
  diet_id: string;
  starts_at: string;
  ends_at: string | null;
  status: "active" | "paused" | "finished";
  notes: string | null;
  assigned_by: string | null;
}

export function useGymRecipes() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-recipes", profile?.gym_id],
    enabled: true,
    queryFn: async () => {
      let query = supabase
        .from("recipes" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (profile?.gym_id) {
        // Also include legacy rows that were created without gym_id.
        query = query.or(`gym_id.eq.${profile.gym_id},gym_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Recipe[];
    },
  });
}

export function useGymDiets() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-diets", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diets" as any)
        .select("*")
        .eq("gym_id", profile!.gym_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Diet[];
    },
  });
}

export function useDietRecipes(dietId?: string) {
  return useQuery({
    queryKey: ["diet-recipes", dietId],
    enabled: !!dietId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_recipes" as any)
        .select("*")
        .eq("diet_id", dietId!)
        .order("meal_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DietRecipe[];
    },
  });
}

export function useGymStudentDietAssignments() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-student-diets", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_diets" as any)
        .select("*")
        .eq("gym_id", profile!.gym_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStudentActiveDiet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["student-active-diet", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data: assignment, error: assignmentError } = await supabase
        .from("student_diets" as any)
        .select("id, diet_id, starts_at, ends_at, notes, status")
        .eq("student_id", user!.id)
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      if (!assignment) return null;

      const { data: diet, error: dietError } = await supabase
        .from("diets" as any)
        .select("id, name, description, is_active")
        .eq("id", assignment.diet_id)
        .eq("is_active", true)
        .maybeSingle();

      if (dietError) throw dietError;
      if (!diet) return null;

      const { data: links, error: linksError } = await supabase
        .from("diet_recipes" as any)
        .select("id, recipe_id, meal_order, scheduled_time")
        .eq("diet_id", diet.id)
        .order("meal_order", { ascending: true });

      if (linksError) throw linksError;
      const recipeIds = (links ?? []).map((l: any) => l.recipe_id);
      if (recipeIds.length === 0) {
        return { assignment, diet, meals: [] as any[] };
      }

      const { data: recipes, error: recipesError } = await supabase
        .from("recipes" as any)
        .select("*")
        .in("id", recipeIds)
        .eq("is_active", true);

      if (recipesError) throw recipesError;
      const recipeById = new Map((recipes ?? []).map((r: any) => [r.id, r]));

      const meals = (links ?? [])
        .map((link: any) => ({
          ...link,
          recipe: recipeById.get(link.recipe_id) ?? null,
        }))
        .filter((item: any) => item.recipe);

      return { assignment, diet, meals };
    },
  });
}
