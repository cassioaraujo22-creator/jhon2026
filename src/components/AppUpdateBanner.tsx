import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";

type VersionPayload = {
  version?: string;
  buildId?: string;
  buildTime?: string;
};

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MIN_CHECK_GAP_MS = 30 * 1000;
const DISMISS_TTL_MS = 15 * 60 * 1000;
const FORCE_UPDATE_STORAGE_KEY = "force_update_required";

const CURRENT_VERSION: VersionPayload = {
  version: String(import.meta.env.VITE_APP_VERSION ?? "dev"),
  buildId: String(import.meta.env.VITE_APP_BUILD_ID ?? "dev"),
  buildTime: String(import.meta.env.VITE_APP_BUILD_TIME ?? ""),
};

function getDismissKey(targetBuildId: string) {
  return `app-update-dismissed:${targetBuildId}`;
}

export default function AppUpdateBanner() {
  const { data: gym } = useGymSettings();
  const [swNeedsRefresh, setSwNeedsRefresh] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<VersionPayload | null>(null);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const updateSwRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const lastCheckAtRef = useRef(0);

  const hasRemoteUpdate =
    !!remoteVersion?.buildId &&
    remoteVersion.buildId !== CURRENT_VERSION.buildId;

  const shouldShow =
    (swNeedsRefresh || hasRemoteUpdate) &&
    (forceUpdateRequired || !dismissed);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(FORCE_UPDATE_STORAGE_KEY);
      if (cached === "true" || cached === "false") {
        setForceUpdateRequired(cached === "true");
      }
    } catch (_error) {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    const settings = (gym?.settings as Record<string, unknown> | null) ?? null;
    if (!settings) return;
    const required = Boolean(settings.force_update_required);
    setForceUpdateRequired(required);
    try {
      localStorage.setItem(FORCE_UPDATE_STORAGE_KEY, String(required));
    } catch (_error) {
      // ignore localStorage errors
    }
  }, [gym?.id, gym?.settings]);

  useEffect(() => {
    if (gym?.id) return;
    let mounted = true;
    const loadPublicFlag = async () => {
      const { data, error } = await supabase.rpc("get_public_onboarding_config");
      if (error || !data || !mounted) return;
      const required = Boolean((data as any)?.settings?.force_update_required);
      setForceUpdateRequired(required);
      try {
        localStorage.setItem(FORCE_UPDATE_STORAGE_KEY, String(required));
      } catch (_error) {
        // ignore localStorage errors
      }
    };
    void loadPublicFlag();
    return () => {
      mounted = false;
    };
  }, [gym?.id]);

  const checkVersion = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return;
    lastCheckAtRef.current = now;

    try {
      const response = await fetch(`/version.json?t=${now}`, {
        cache: "no-store",
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      });
      if (!response.ok) return;
      const payload = (await response.json()) as VersionPayload;
      if (!payload?.buildId) return;

      setRemoteVersion(payload);
      if (payload.buildId !== CURRENT_VERSION.buildId) {
        const dismissRaw = sessionStorage.getItem(getDismissKey(payload.buildId));
        const dismissUntil = dismissRaw ? Number(dismissRaw) : 0;
        setDismissed(Number.isFinite(dismissUntil) && dismissUntil > Date.now());
      } else {
        setDismissed(false);
      }
    } catch (_error) {
      // Network errors are expected for some users; keep app stable.
    }
  }, []);

  useEffect(() => {
    updateSwRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setSwNeedsRefresh(true);
        setDismissed(false);
      },
    });
  }, []);

  useEffect(() => {
    void checkVersion(true);
    const interval = window.setInterval(() => {
      void checkVersion();
    }, CHECK_INTERVAL_MS);

    const handleFocus = () => {
      void checkVersion();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkVersion]);

  const handleDismiss = () => {
    if (forceUpdateRequired) return;
    if (remoteVersion?.buildId) {
      sessionStorage.setItem(
        getDismissKey(remoteVersion.buildId),
        String(Date.now() + DISMISS_TTL_MS)
      );
    }
    setDismissed(true);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (_cacheError) {
      // Continue with refresh flow even if cache cleanup fails.
    }

    try {
      if (updateSwRef.current) {
        await Promise.race([
          updateSwRef.current(true),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      }
    } catch (_swError) {
      // If SW update fails, fallback reload below.
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("v", String(Date.now()));
    window.location.replace(nextUrl.toString());
  };

  if (!shouldShow) return null;

  const bannerCard = (
    <div className="mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/25">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Nova versao disponivel</p>
            <p className="text-xs text-muted-foreground">
              {forceUpdateRequired
                ? "Esta atualização é obrigatória para continuar usando o app."
                : "Atualize para usar a versao mais recente do app."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!forceUpdateRequired ? (
            <Button variant="outline" size="sm" onClick={handleDismiss} disabled={updating}>
              Depois
            </Button>
          ) : null}
          <Button variant="glow" size="sm" onClick={handleUpdate} disabled={updating}>
            {updating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar agora
          </Button>
        </div>
      </div>
    </div>
  );

  if (forceUpdateRequired) {
    return (
      <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end px-4 pb-4 md:pb-6">
        {bannerCard}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[80] px-4 md:bottom-6">
      {bannerCard}
    </div>
  );
}

