import { ArrowLeft, Trophy, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function StudentBadges() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: myBadges, isLoading } = useQuery({
    queryKey: ["my-badges-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_badges")
        .select("*, badges(*)")
        .eq("member_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allBadges } = useQuery({
    queryKey: ["gym-badges-all", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("gym_id", profile!.gym_id!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const earnedIds = new Set(myBadges?.map((mb: any) => mb.badge_id) ?? []);

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Minhas Conquistas</h1>
      </div>

      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto glow-purple">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <p className="text-2xl font-bold text-foreground">{myBadges?.length ?? 0}</p>
        <p className="text-sm text-muted-foreground">badges conquistados</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {allBadges?.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4 text-center space-y-2 transition-all ${
                  earned
                    ? "border-primary/30 bg-card glow-purple"
                    : "border-border bg-card/50 opacity-50"
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  earned ? "bg-primary/15" : "bg-secondary"
                }`}>
                  {earned ? (
                    <Trophy className="w-7 h-7 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs font-medium text-foreground truncate">{badge.title}</p>
                {badge.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{badge.description}</p>
                )}
              </div>
            );
          })}
          {(allBadges?.length ?? 0) === 0 && (
            <div className="col-span-3 text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum badge disponível ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
