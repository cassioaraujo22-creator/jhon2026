import { ArrowLeft, User, Flame, Footprints, Dumbbell, Activity, Scale, Ruler as RulerIcon, Target, Clock, MapPin, AlertTriangle, Zap, TrendingUp, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyWorkoutStats, useMyMembership } from "@/hooks/use-supabase-data";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const goalLabels: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  performance: "Performance",
  reabilitacao: "Reabilitação",
  outro: "Outro",
};

const activityLabels: Record<string, string> = {
  sedentary: "Sedentário",
  light: "Levemente ativo",
  moderate: "Moderado",
  active: "Ativo",
  very_active: "Muito ativo",
};

const experienceLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const genderLabels: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
};

export default function StudentMyProfile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: stats } = useMyWorkoutStats();
  const { data: membership } = useMyMembership();

  const { data: onboarding, isLoading } = useQuery({
    queryKey: ["my-onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_data")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["my-progress-latest", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_metrics")
        .select("*")
        .eq("member_id", user!.id)
        .order("measured_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["my-badges-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_badges")
        .select("*, badges(*)")
        .eq("member_id", user!.id)
        .order("awarded_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const latestWeight = metrics?.find(m => m.type === "weight");
  const latestBf = metrics?.find(m => m.type === "bodyfat");

  // Estimated data for visual charts
  const workoutsDone = stats?.done ?? 0;
  const estimatedCalories = workoutsDone * 320;
  const completionRate = stats?.total ? Math.round((workoutsDone / stats.total) * 100) : 0;

  const radialData = [{ name: "Progresso", value: completionRate, fill: "hsl(var(--primary))" }];

  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Meu Perfil</h1>
      </div>

      {/* Hero Card with Progress */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5">
        {/* Animated orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-xl font-bold text-primary shrink-0 shadow-lg shadow-primary/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{profile?.name ?? "Aluno"}</h2>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {onboarding?.fitness_goal && (
                <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                  {goalLabels[onboarding.fitness_goal] ?? onboarding.fitness_goal}
                </span>
              )}
              {onboarding?.experience_level && (
                <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border font-medium">
                  {experienceLabels[onboarding.experience_level] ?? onboarding.experience_level}
                </span>
              )}
            </div>
          </div>

          {/* Circular progress */}
          <div className="w-20 h-20 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={radialData} barSize={6}>
                <RadialBar background={{ fill: "hsl(var(--secondary))" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Flame, label: "Calorias", value: estimatedCalories.toLocaleString(), color: "text-orange-400" },
          { icon: Dumbbell, label: "Treinos", value: workoutsDone, color: "text-primary" },
          { icon: Zap, label: "Streak", value: `${stats?.streak ?? 0}d`, color: "text-yellow-400" },
          { icon: Trophy, label: "Badges", value: stats?.badgeCount ?? 0, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-3 text-center space-y-1 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <stat.icon className={`w-4 h-4 mx-auto ${stat.color}`} />
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Body Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Dados Corporais
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Peso", value: latestWeight ? `${latestWeight.value} kg` : onboarding?.weight ? `${onboarding.weight} kg` : "—", icon: Scale },
            { label: "Gordura", value: latestBf ? `${latestBf.value}%` : "—", icon: TrendingUp },
            { label: "Altura", value: onboarding?.height ? `${onboarding.height} cm` : "—", icon: RulerIcon },
            { label: "Idade", value: onboarding?.age ? `${onboarding.age} anos` : "—", icon: User },
          ].map((item, i) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${200 + i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Info */}
      {onboarding && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Meu Perfil Fitness
          </h3>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {[
              { label: "Gênero", value: genderLabels[onboarding.gender ?? ""] ?? onboarding.gender },
              { label: "Nível de Atividade", value: activityLabels[onboarding.activity_level ?? ""] ?? onboarding.activity_level },
              { label: "Objetivo", value: goalLabels[onboarding.fitness_goal ?? ""] ?? onboarding.fitness_goal },
              { label: "Experiência", value: experienceLabels[onboarding.experience_level ?? ""] ?? onboarding.experience_level },
              { label: "Local de Treino", value: onboarding.workout_location },
              { label: "Duração do Treino", value: onboarding.workout_duration },
              { label: "Horário Preferido", value: onboarding.preferred_time },
            ]
              .filter(item => item.value)
              .map((item, i) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3 animate-fade-in" style={{ animationDelay: `${400 + i * 40}ms`, animationFillMode: "both" }}>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
          </div>

          {/* Equipment */}
          {onboarding.equipment && onboarding.equipment.length > 0 && (
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
              <p className="text-xs text-muted-foreground px-1">Equipamentos</p>
              <div className="flex flex-wrap gap-1.5">
                {onboarding.equipment.map((eq: string) => (
                  <span key={eq} className="text-[10px] bg-secondary text-foreground px-2.5 py-1 rounded-full border border-border">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Injuries */}
          {onboarding.injuries && onboarding.injuries.length > 0 && (
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "650ms", animationFillMode: "both" }}>
              <p className="text-xs text-muted-foreground px-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" /> Lesões / Restrições
              </p>
              <div className="flex flex-wrap gap-1.5">
                {onboarding.injuries.map((inj: string) => (
                  <span key={inj} className="text-[10px] bg-warning/10 text-warning px-2.5 py-1 rounded-full border border-warning/20">
                    {inj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Badges */}
      {badges && badges.length > 0 && (
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "700ms", animationFillMode: "both" }}>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Conquistas Recentes
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {badges.map((mb: any) => (
              <div key={mb.id} className="shrink-0 w-20 text-center space-y-1">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] text-foreground font-medium truncate">{mb.badges?.title ?? "Badge"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Membership quick info */}
      {membership && (
        <div
          onClick={() => navigate("/app/profile/plan")}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors animate-fade-in"
          style={{ animationDelay: "750ms", animationFillMode: "both" }}
        >
          <div>
            <p className="text-xs text-muted-foreground">Plano Atual</p>
            <p className="text-sm font-bold text-primary">{(membership as any)?.plans?.name ?? "—"}</p>
          </div>
          <span className="text-xs bg-primary/15 text-primary px-3 py-1 rounded-full font-medium">Ver detalhes →</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
