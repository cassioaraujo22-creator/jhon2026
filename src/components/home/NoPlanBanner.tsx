import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, ChevronRight } from "lucide-react";
import bannerImg from "@/assets/banner-fitness.png";

interface NoPlanBannerProps {
  hasActivePlan: boolean;
  isLoading: boolean;
}

export default memo(function NoPlanBanner({ hasActivePlan, isLoading }: NoPlanBannerProps) {
  const navigate = useNavigate();

  if (isLoading || hasActivePlan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      onClick={() => navigate("/app/plans")}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: "linear-gradient(135deg, hsl(258 82% 25%) 0%, hsl(225 30% 8%) 50%, hsl(258 60% 20%) 100%)",
          backgroundSize: "200% 200%",
          animation: "gradientShift 6s ease infinite",
        }}
      />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-card/20" />

      {/* Glow effect */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-primary/15 blur-3xl" />

      {/* Content */}
      <div className="relative flex items-center gap-3 p-4 pr-0">
        {/* Text side */}
        <div className="flex-1 space-y-2.5 min-w-0 z-10">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-warning" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-warning">
              Premium
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground leading-tight">
            Desbloqueie seu potencial
          </h3>

          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            Adquira um plano e tenha acesso completo aos treinos, métricas e acompanhamento profissional.
          </p>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary-foreground overflow-hidden group/btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/app/plans");
            }}
          >
            {/* Button gradient bg */}
            <div className="absolute inset-0 bg-gradient-purple" />
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 animate-shimmer opacity-30"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.4), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
            <span className="relative z-10">Escolher Plano</span>
            <ChevronRight className="relative z-10 w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </motion.button>
        </div>

        {/* Image side */}
        <div className="relative w-28 h-32 flex-shrink-0 overflow-hidden rounded-l-2xl">
          <img
            src={bannerImg}
            alt="Fitness"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* Hover lift effect */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
});
