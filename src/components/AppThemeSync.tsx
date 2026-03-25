import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGymSettings } from "@/hooks/use-supabase-data";

const DEFAULT_ACCENT_COLOR = "#7148EC";

type HslColor = {
  h: number;
  s: number;
  l: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function normalizeHex(hex: string) {
  const cleaned = hex.trim().replace("#", "");

  if (cleaned.length === 3) {
    return cleaned
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return cleaned.length === 6 ? cleaned : null;
}

function hexToHsl(hex: string): HslColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function toCssHsl(color: HslColor) {
  return `${color.h} ${color.s}% ${color.l}%`;
}

function shiftLightness(color: HslColor, delta: number): HslColor {
  return {
    ...color,
    l: clamp(color.l + delta, 0, 100),
  };
}

function softenColor(color: HslColor): HslColor {
  return {
    h: color.h,
    s: clamp(Math.round(color.s * 0.65), 0, 100),
    l: clamp(Math.round(color.l * 0.45), 0, 100),
  };
}

function getForegroundColor(color: HslColor) {
  return color.l >= 60 ? "0 0% 10%" : "0 0% 100%";
}

function applyThemeAccent(hexColor?: string | null) {
  const accent = hexToHsl(hexColor ?? DEFAULT_ACCENT_COLOR) ?? hexToHsl(DEFAULT_ACCENT_COLOR)!;
  const foreground = getForegroundColor(accent);
  const ring = shiftLightness(accent, 5);
  const softAccent = softenColor(accent);
  const root = document.documentElement;

  root.style.setProperty("--primary", toCssHsl(accent));
  root.style.setProperty("--primary-foreground", foreground);
  root.style.setProperty("--accent", toCssHsl(accent));
  root.style.setProperty("--accent-foreground", foreground);
  root.style.setProperty("--ring", toCssHsl(ring));
  root.style.setProperty("--sidebar-primary", toCssHsl(accent));
  root.style.setProperty("--sidebar-primary-foreground", foreground);
  root.style.setProperty("--sidebar-ring", toCssHsl(ring));
  root.style.setProperty("--purple-glow", toCssHsl(accent));
  root.style.setProperty("--purple-soft", toCssHsl(softAccent));
}

export default function AppThemeSync() {
  const { profile } = useAuth();
  const { data: gym } = useGymSettings();

  useEffect(() => {
    if (!profile?.gym_id) {
      applyThemeAccent(DEFAULT_ACCENT_COLOR);
      return;
    }

    applyThemeAccent(gym?.accent_color);
  }, [gym?.accent_color, profile?.gym_id]);

  return null;
}
