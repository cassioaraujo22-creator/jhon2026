import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Instagram, Award, Clock, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrainerCardProps {
  coachId: string;
  coachName: string;
  coachAvatar?: string | null;
}

export default function TrainerCard({ coachId, coachName, coachAvatar }: TrainerCardProps) {
  const [open, setOpen] = useState(false);

  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile-detail", coachId],
    enabled: open && !!coachId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", coachId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-2xl border border-primary/20 bg-gradient-card p-4 flex items-center gap-4 hover:border-primary/40 transition-all glow-purple cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="relative">
          <Avatar className="w-14 h-14 border-2 border-primary/30">
            <AvatarImage src={coachAvatar ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
              {coachName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success rounded-full border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs text-primary font-medium">Personal Trainer</p>
          </div>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{coachName}</p>
          <p className="text-xs text-muted-foreground">Toque para ver perfil</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            if (coachProfile?.whatsapp) {
              window.open(`https://wa.me/${coachProfile.whatsapp.replace(/\D/g, "")}`, "_blank");
            } else {
              setOpen(true);
            }
          }}
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="sr-only">Perfil do Personal Trainer - {coachName}</DialogTitle>
          <div className="flex flex-col items-center gap-3 pt-2">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={coachAvatar ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                {coachName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">{coachName}</h3>
              <p className="text-xs text-primary font-medium flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Personal Trainer
              </p>
            </div>
          </div>

          {coachProfile ? (
            <div className="space-y-4 py-3">
              {coachProfile.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Biografia</p>
                  <p className="text-sm text-foreground leading-relaxed">{coachProfile.bio}</p>
                </div>
              )}

              {(coachProfile.specialties as string[])?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Especialidades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(coachProfile.specialties as string[]).map((s) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(coachProfile.certifications as string[])?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Certificações</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(coachProfile.certifications as string[]).map((c) => (
                      <span key={c} className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" /> {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(coachProfile.experience_years ?? 0) > 0 && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> {coachProfile.experience_years} anos de experiência
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {coachProfile.whatsapp && (
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${coachProfile.whatsapp!.replace(/\D/g, "")}`, "_blank")}
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                )}
                {coachProfile.instagram && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => window.open(`https://instagram.com/${coachProfile.instagram!.replace("@", "")}`, "_blank")}
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando perfil...</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
