import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowRight } from "lucide-react";
import bannerImg from "@/assets/banner-fitness.png";

interface NoPlanBannerProps {
  hasActivePlan: boolean;
  isLoading: boolean;
}

export default function NoPlanBanner({ hasActivePlan, isLoading }: NoPlanBannerProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Don't show if user has active plan or data is loading
  if (isLoading || hasActivePlan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-purple-600/30 via-purple-500/20 to-pink-500/30 mb-6"
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: isHovered ? ["-100%", "100%"] : ["0%", "0%"],
        }}
        transition={{ duration: 1.5, ease: "linear" }}
        style={{ pointerEvents: "none" }}
      />

      <div className="relative bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-black/80 backdrop-blur-xl rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-6 lg:p-8">
          {/* Left Content */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Premium Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border border-yellow-400/50"
            >
              <Crown className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Premium</span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl lg:text-4xl font-bold text-white leading-tight"
            >
              Desbloqueie seu <br />
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                potencial
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm lg:text-base text-purple-100/80 leading-relaxed"
            >
              Acesse programas personalizados, acompanhamento de progresso em tempo real e dicas de especialistas para transformar seu corpo e mente.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => navigate("/app/plans")}
              className="relative inline-flex items-center justify-center gap-2 mt-2 px-6 py-3 rounded-xl font-semibold text-white overflow-hidden group w-fit"
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 opacity-100 group-hover:opacity-110 transition-opacity duration-300" />

              {/* Shimmer effect on button */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: isHovered ? ["-100%", "100%"] : ["0%", "0%"],
                }}
                transition={{ duration: 1.2, ease: "linear" }}
              />

              {/* Button content */}
              <span className="relative flex items-center gap-2">
                Escolher Plano
                <motion.div
                  animate={{ x: isHovered ? 4 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </span>
            </motion.button>
          </div>

          {/* Right Image - Hidden on mobile, visible on lg */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
              {/* Gradient border glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-transparent to-pink-500/40 rounded-2xl pointer-events-none" />

              {/* Image */}
              <img
                src={bannerImg}
                alt="Mulher atlética em academia - Desbloqueie seu potencial"
                className="w-full h-full object-cover"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/10 to-purple-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      </div>
    </motion.div>
  );
}
