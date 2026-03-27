import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import homeHero from "@/assets/home-hero.jpg";
import { Flame, ChevronRight, Dumbbell, Clock, Sparkles, Check, Loader2, Target, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMembership, useMyAssignedWorkouts, useMyWorkoutSessions, useMyWorkoutStats } from "@/hooks/use-supabase-data";
import { useGymInfo } from "@/hooks/use-home-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";
import PerformanceDashboard from "./PerformanceDashboard";
import PerformanceActivityChart from "./PerformanceActivityChart";
import TrainerCard from "./TrainerCard";
import BodyFocusCarousel from "./BodyFocusCarousel";
import PromotionSlider from "./PromotionSlider";
import NoPlanBanner from "./NoPlanBanner";
import ContinueWorkoutBanner from "./ContinueWorkoutBanner";
import TodayDietBlock from "./TodayDietBlock";
import HomePromoBanner from "./HomePromoBanner";

const getLocalDayIso = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default memo(function HomeDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: membership, isLoading: membershipLoading } = useMyMembership();
  const { data: assignedWorkouts, isLoading } = useMyAssignedWorkouts();
  const { data: sessions } = useMyWorkoutSessions();
  const { data: stats } = useMyWorkoutStats();
  const { data: gym } = useGymInfo();

  const heroImage = (gym?.settings as any)?.hero_image_url || homeHero;
  const pwaInstallEnabled = Boolean((gym?.settings as any)?.pwa_install_enabled);
  const homePromoBanner = (gym?.settings as any)?.home_promo_banner;
  const personalTrainerId = (membership?.plans as any)?.personal_trainer_id;
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const { data: trainerProfile } = useQuery({
    queryKey: ["personal-trainer", personalTrainerId],
    enabled: !!personalTrainerId,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", personalTrainerId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const todayStr = useMemo(() => getLocalDayIso(), []);

  const { todayWorkout, isTodayWorkoutDone } = useMemo(() => {
    if (!assignedWorkouts || assignedWorkouts.length === 0) return { todayWorkout: undefined, isTodayWorkoutDone: false };
    const notDoneToday = assignedWorkouts.find(w =>
      !(sessions ?? []).some(s => s.status === "done" && s.date === todayStr && s.assigned_workout_id === w.id)
    );
    const workout = notDoneToday ?? assignedWorkouts[0];
    const done = workout
      ? (sessions ?? []).some(s => s.status === "done" && s.date === todayStr && s.assigned_workout_id === workout.id)
      : false;
    return { todayWorkout: workout, isTodayWorkoutDone: done };
  }, [assignedWorkouts, sessions, todayStr]);

  const firstName = profile?.name?.split(" ")[0] || "Aluno";
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone || !pwaInstallEnabled) {
      setShowInstallBanner(false);
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const onAppInstalled = () => {
      setShowInstallBanner(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [pwaInstallEnabled]);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstallBanner(false);
      setInstallPromptEvent(null);
    }
  };

  return (
    <div className="relative max-w-lg mx-auto space-y-5">
      {/* Hero background image */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden">
        <img src={heroImage} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="relative px-5 pt-12 pb-6 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="text-lg font-bold text-foreground">{firstName} 👋</h1>
            {gym?.name && (
              <p className="text-[10px] text-muted-foreground/60">Bem-vindo à {gym.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur border border-border rounded-full px-3 py-1.5">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">{stats?.streak ?? 0}</span>
          </div>
          <NotificationBell />
        </div>
      </motion.div>

      {/* Plan pill */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <span className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
          <Target className="w-3 h-3" />
          {membership?.plans?.name ?? "Sem plano"}
        </span>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${
          membership?.status === "active"
            ? "bg-success/10 text-success border-success/20"
            : "bg-warning/10 text-warning border-warning/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${membership?.status === "active" ? "bg-success" : "bg-warning"}`} />
          {membership ? (membership.status === "active" ? "Ativo" : "Pendente") : "Inativo"}
        </span>
      </motion.div>

      {/* No Plan Banner */}
      <NoPlanBanner
        hasActivePlan={!!membership && membership.status === "active" && !!membership.plan_id}
        isLoading={membershipLoading}
        bannerImageUrl={(gym?.settings as any)?.no_plan_banner_image_url}
      />

      {/* Install App Banner */}
      {showInstallBanner && installPromptEvent && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-primary/25 bg-gradient-card p-4 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Instale o app no seu celular</p>
            <p className="text-xs text-muted-foreground">Acesso mais rápido e experiência melhor em tela cheia.</p>
          </div>
          <Button size="sm" variant="glow" onClick={handleInstallApp}>
            <Download className="w-4 h-4" />
            Instalar
          </Button>
        </motion.div>
      )}

      {/* Continue Workout Banner */}
      <ContinueWorkoutBanner />

      {/* Home Promotional Banner */}
      <HomePromoBanner banner={homePromoBanner} />

      {/* Today's Workout */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : todayWorkout ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-2xl border border-primary/20 bg-gradient-card p-5 space-y-4 cursor-pointer hover:border-primary/40 transition-all glow-purple group"
          onClick={() => navigate(`/app/workouts/${todayWorkout.id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Treino de Hoje</p>
                <h3 className="text-base font-semibold text-foreground mt-0.5">{todayWorkout.workout_templates?.name}</h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {todayWorkout.workout_templates?.weeks ?? 4} sem</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {todayWorkout.workout_templates?.level ?? "Intermediário"}</span>
          </div>
          {isTodayWorkoutDone ? (
            <Button variant="outline" size="lg" className="w-full" disabled>
              <Check className="w-4 h-4" />
              Treino Concluído Hoje ✓
            </Button>
          ) : (
            <Button variant="glow" size="lg" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/app/workouts/${todayWorkout.id}/execute`); }}>
              <Dumbbell className="w-4 h-4" />
              Iniciar Treino
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-8 text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <Dumbbell className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum treino atribuído ainda</p>
          <p className="text-xs text-muted-foreground/60">Seu coach vai montar seu treino em breve</p>
        </motion.div>
      )}

      {/* Performance Dashboard */}
      <PerformanceDashboard />

      {/* Promotion Slider */}
      <PromotionSlider />

      {/* Personal Trainer */}
      {trainerProfile && (
        <TrainerCard coachId={trainerProfile.id} coachName={trainerProfile.name} coachAvatar={trainerProfile.avatar_url} />
      )}

      {/* Activity compact */}
      <PerformanceActivityChart compact />

      {/* Body Focus */}
      <BodyFocusCarousel />

      {/* Diet block */}
      <TodayDietBlock />
      </div>
    </div>
  );
});
