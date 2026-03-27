import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachWithProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  experience_years: number;
  instagram: string | null;
  whatsapp: string | null;
  available_for_chat: boolean;
  coach_profile_id: string | null;
}

export function useGymCoaches() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["gym-coaches", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      // Get user_roles with role = 'coach' or 'owner' for this gym
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("gym_id", profile!.gym_id!)
        .in("role", ["coach", "owner"]);
      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, phone")
        .in("id", userIds);
      if (pErr) throw pErr;

      // Fetch extended coach profiles
      const { data: coachProfiles } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("gym_id", profile!.gym_id!);

      return (profiles ?? []).map((p) => {
        const cp = (coachProfiles ?? []).find((c) => c.user_id === p.id);
        return {
          id: p.id,
          user_id: p.id,
          name: p.name,
          email: p.email,
          avatar_url: p.avatar_url,
          phone: p.phone,
          role: roles.find((r) => r.user_id === p.id)?.role ?? "coach",
          bio: cp?.bio ?? null,
          specialties: cp?.specialties ?? [],
          certifications: cp?.certifications ?? [],
          experience_years: cp?.experience_years ?? 0,
          instagram: cp?.instagram ?? null,
          whatsapp: cp?.whatsapp ?? null,
          available_for_chat: cp?.available_for_chat ?? true,
          coach_profile_id: cp?.id ?? null,
        } as CoachWithProfile;
      });
    },
  });
}
