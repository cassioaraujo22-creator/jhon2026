import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { usePwaPush } from "@/hooks/use-pwa-push";

const DEFAULT_APP_NAME = "App";
const DEFAULT_DESCRIPTION = "Seus treinos em alta performance";
const APP_NAME_STORAGE_KEY = "app_display_name";
const GYM_NAME_STORAGE_KEY = "gym_display_name";
const APP_ICON_STORAGE_KEY = "app_primary_icon_url";

function ensureMetaTag(name: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  return tag;
}

function ensureLinkTag(rel: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  return tag;
}

export default function PwaAndPushManager() {
  const { user, profile } = useAuth();
  const { data: gym } = useGymSettings();
  const manifestUrlRef = useRef<string | null>(null);
  const [publicGymName, setPublicGymName] = useState<string>("");

  useEffect(() => {
    try {
      const cachedGymName = localStorage.getItem(GYM_NAME_STORAGE_KEY)?.trim() ?? "";
      const cachedAppName = localStorage.getItem(APP_NAME_STORAGE_KEY)?.trim() ?? "";
      const cachedIcon = localStorage.getItem(APP_ICON_STORAGE_KEY)?.trim() ?? "";
      if (cachedGymName || cachedAppName) {
        setPublicGymName(cachedGymName || cachedAppName);
      }
      if (cachedIcon) {
        const favicon = ensureLinkTag("icon");
        favicon.href = cachedIcon;
      }
    } catch (_error) {
      // Ignore localStorage failures.
    }
  }, []);

  useEffect(() => {
    if (gym?.name) return;
    let mounted = true;

    const loadPublicGymName = async () => {
      const { data, error } = await supabase.rpc("get_public_onboarding_config");
      if (error || !data || !mounted) return;
      const gymName = String((data as any)?.gym_name ?? "").trim();
      if (!gymName) return;
      setPublicGymName(gymName);
      try {
        localStorage.setItem(GYM_NAME_STORAGE_KEY, gymName);
      } catch (_cacheError) {
        // Ignore localStorage failures.
      }
    };

    void loadPublicGymName();
    return () => {
      mounted = false;
    };
  }, [gym?.name]);

  const settings = (gym?.settings as Record<string, unknown> | null) ?? {};
  const appName = (settings.app_display_name as string) || gym?.name || publicGymName || DEFAULT_APP_NAME;
  const shortName = (settings.pwa_short_name as string) || appName;
  const description = (settings.pwa_description as string) || DEFAULT_DESCRIPTION;
  const themeColor = (settings.pwa_theme_color as string) || gym?.accent_color || "#7148EC";
  const backgroundColor = (settings.pwa_background_color as string) || "#0b0b12";
  const appIcon =
    (settings.favicon_url as string) ||
    (settings.pwa_icon_url as string) ||
    (settings.app_logo_url as string) ||
    gym?.logo_url ||
    "";
  const pushEnabled = Boolean(settings.push_enabled);
  const pushAutoPrompt = Boolean(settings.push_auto_prompt);
  const vapidPublicKey = (settings.push_vapid_public_key as string) || "";

  const {
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    supported: pushSupported,
  } = usePwaPush(vapidPublicKey, pushEnabled);

  useEffect(() => {
    document.title = appName;
    try {
      localStorage.setItem(APP_NAME_STORAGE_KEY, appName);
      if (gym?.name) {
        localStorage.setItem(GYM_NAME_STORAGE_KEY, gym.name);
      }
      if (appIcon) {
        localStorage.setItem(APP_ICON_STORAGE_KEY, appIcon);
      } else {
        localStorage.removeItem(APP_ICON_STORAGE_KEY);
      }
    } catch (_error) {
      // Ignore storage failures in private mode.
    }

    const ogTitle = ensureMetaTag("og:title", "property");
    ogTitle.content = appName;

    const twTitle = ensureMetaTag("twitter:title");
    twTitle.content = appName;

    const desc = ensureMetaTag("description");
    desc.content = description;

    const ogDesc = ensureMetaTag("og:description", "property");
    ogDesc.content = description;

    const twDesc = ensureMetaTag("twitter:description");
    twDesc.content = description;

    const theme = ensureMetaTag("theme-color");
    theme.content = themeColor;
  }, [appName, description, gym?.name, themeColor]);

  useEffect(() => {
    const favicon = ensureLinkTag("icon");
    const appleIcon = ensureLinkTag("apple-touch-icon");
    if (appIcon) {
      favicon.href = appIcon;
      appleIcon.href = appIcon;
      return;
    }
    favicon.removeAttribute("href");
    appleIcon.removeAttribute("href");
  }, [appIcon]);

  useEffect(() => {
    const manifest = {
      name: appName,
      short_name: shortName,
      description,
      theme_color: themeColor,
      background_color: backgroundColor,
      display: "standalone",
      start_url: "/",
      icons: appIcon
        ? [
            {
              src: appIcon,
              sizes: "192x192",
              type: appIcon.endsWith(".svg") ? "image/svg+xml" : "image/png",
              purpose: "any maskable",
            },
          ]
        : [],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const objectUrl = URL.createObjectURL(blob);
    const manifestTag = ensureLinkTag("manifest");
    manifestTag.href = objectUrl;

    if (manifestUrlRef.current) URL.revokeObjectURL(manifestUrlRef.current);
    manifestUrlRef.current = objectUrl;

    return () => {
      if (manifestUrlRef.current) {
        URL.revokeObjectURL(manifestUrlRef.current);
        manifestUrlRef.current = null;
      }
    };
  }, [appIcon, appName, backgroundColor, description, shortName, themeColor]);

  const canNotify = useMemo(
    () =>
      pushEnabled &&
      !!user &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      permission === "granted",
    [permission, pushEnabled, user]
  );

  useEffect(() => {
    if (!pushSupported || !pushEnabled || !pushAutoPrompt || permission !== "default") return;
    void requestPermission();
  }, [permission, pushAutoPrompt, pushEnabled, pushSupported, requestPermission]);

  useEffect(() => {
    if (!pushSupported || !pushEnabled || permission !== "granted" || !vapidPublicKey || isSubscribed) return;
    void subscribe().catch(() => null);
  }, [isSubscribed, permission, pushEnabled, pushSupported, subscribe, vapidPublicKey]);

  useEffect(() => {
    if (!user || !profile?.gym_id || !canNotify) return;

    const channel = supabase
      .channel("browser-push-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const row = payload.new as {
            title?: string;
            message?: string;
            action_url?: string | null;
            id?: string;
          };
          const registration = await navigator.serviceWorker.ready;
          const iconOptions = appIcon ? { icon: appIcon, badge: appIcon } : {};
          await registration.showNotification(row.title || "Nova notificação", {
            body: row.message || "Você recebeu uma atualização.",
            ...iconOptions,
            data: {
              url: row.action_url || "/app",
              notificationId: row.id || null,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appIcon, canNotify, profile?.gym_id, user, user?.id]);

  return null;
}
