import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireStaff?: boolean;
}

export default function ProtectedRoute({ children, requireStaff }: Props) {
  const { session, user, loading, isStaff, roles, profile } = useAuth();
  const location = useLocation();

  const { data: onboardingData, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding-check", user?.id],
    enabled: !!user && !!profile && !isStaff,
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_data")
        .select("completed")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Wait until auth AND profile/roles are fully loaded
  const profileLoading = !!user && !profile;
  const rolesLoading = !!user && roles.length === 0 && !profile;

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/" replace />;
  if (requireStaff && !isStaff) return <Navigate to="/app" replace />;

  // Only check onboarding for non-staff users when profile is loaded
  if (!isStaff && !!profile) {
    if (onboardingLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }
    if (location.pathname !== "/onboarding" && (!onboardingData || !onboardingData.completed)) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
