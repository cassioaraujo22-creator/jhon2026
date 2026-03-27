import { memo } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type HomePromoBannerConfig = {
  id?: string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  image_url?: string;
  is_active?: boolean;
  priority?: number;
  overlay_color?: string;
  overlay_opacity?: number;
};

function isExternalLink(link: string) {
  return /^https?:\/\//i.test(link);
}

export default memo(function HomePromoBanner({
  banner,
}: {
  banner?: HomePromoBannerConfig | null;
}) {
  const navigate = useNavigate();

  if (!banner?.is_active) return null;
  if (!banner.image_url) return null;

  const overlayColor = banner.overlay_color || "#0b0b12";
  const overlayOpacity =
    typeof banner.overlay_opacity === "number"
      ? Math.max(0, Math.min(1, banner.overlay_opacity))
      : 0.42;

  const buttonText = (banner.button_text || "").trim();
  const buttonLink = (banner.button_link || "").trim();
  const canNavigate = !!buttonText && !!buttonLink;

  const handleBannerClick = () => {
    if (!canNavigate) return;
    if (isExternalLink(buttonLink)) {
      window.open(buttonLink, "_blank", "noopener,noreferrer");
      return;
    }
    const internalPath = buttonLink.startsWith("/") ? buttonLink : `/${buttonLink}`;
    navigate(internalPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card"
    >
      <img
        src={banner.image_url}
        alt={banner.title || "Banner promocional"}
        className="w-full h-44 md:h-52 object-cover"
        loading="lazy"
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${overlayColor}22 0%, ${overlayColor}${Math.round(
            overlayOpacity * 255
          )
            .toString(16)
            .padStart(2, "0")} 100%)`,
        }}
      />

      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-end gap-2">
        {banner.title ? (
          <h3 className="text-base md:text-lg font-bold text-white drop-shadow-sm line-clamp-2">
            {banner.title}
          </h3>
        ) : null}

        {banner.subtitle ? (
          <p className="text-xs md:text-sm text-white/90 drop-shadow-sm line-clamp-2">
            {banner.subtitle}
          </p>
        ) : null}

        {canNavigate ? (
          <div className="pt-1">
            <Button
              size="sm"
              variant="glow"
              onClick={handleBannerClick}
              className="gap-1"
            >
              {buttonText}
              {isExternalLink(buttonLink) ? (
                <ExternalLink className="w-4 h-4" />
              ) : null}
            </Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
});

