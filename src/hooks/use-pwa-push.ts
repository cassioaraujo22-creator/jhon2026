import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PWA_STORAGE_KEY = "pwa-push-endpoint";

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

async function getActiveSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function usePwaPush(vapidPublicKey?: string | null, pushEnabled?: boolean) {
  const { profile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const supported = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.isSecureContext &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window,
    []
  );

  const supportReason = useMemo(() => {
    if (typeof window === "undefined") return "Ambiente sem suporte a navegador.";
    if (!window.isSecureContext) return "Push requer HTTPS (ou localhost no ambiente local).";
    if (!("serviceWorker" in navigator)) return "Service Worker não suportado neste navegador.";
    if (!("Notification" in window)) return "API de notificação não suportada neste navegador.";
    if (!("PushManager" in window)) return "Push API não suportada neste navegador.";
    return null;
  }, []);

  const refreshSubscriptionState = useCallback(async () => {
    if (!supported) return;
    const sub = await getActiveSubscription();
    const endpoint = sub?.endpoint ?? null;
    setSubscriptionEndpoint(endpoint);
    setIsSubscribed(!!endpoint);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    void refreshSubscriptionState();
  }, [supported, refreshSubscriptionState]);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) throw new Error(supportReason || "Push não suportado neste ambiente.");
    if (!profile?.gym_id || !profile?.id) throw new Error("Usuário/academia não identificados para registrar push.");
    if (!pushEnabled) throw new Error("Ative o push nas configurações antes de conectar.");
    if (!vapidPublicKey) throw new Error("Informe a chave VAPID pública para conectar push.");
    if (permission !== "granted") throw new Error("Permissão de notificação não concedida.");
    setIsSubscribing(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
      });

      const endpoint = sub.endpoint;
      const keys = sub.toJSON().keys ?? {};

      await (supabase as any).from("push_subscriptions").upsert(
        {
          gym_id: profile.gym_id,
          user_id: profile.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: navigator.userAgent,
          status: "active",
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

      localStorage.setItem(PWA_STORAGE_KEY, endpoint);
      await refreshSubscriptionState();
      return sub;
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.toLowerCase().includes("push service not available")) {
        throw new Error("Serviço de push indisponível. Verifique HTTPS válido, navegador compatível e permissão liberada.");
      }
      if (err?.name === "NotAllowedError") {
        throw new Error("Permissão de notificação negada no navegador.");
      }
      if (err?.name === "InvalidStateError") {
        throw new Error("Service Worker ainda não está pronto para assinatura de push. Atualize a página e tente novamente.");
      }
      if (err?.name === "InvalidCharacterError") {
        throw new Error("Chave VAPID inválida. Use a chave pública no formato URL-safe Base64.");
      }
      throw err;
    } finally {
      setIsSubscribing(false);
    }
  }, [
    permission,
    profile?.gym_id,
    profile?.id,
    pushEnabled,
    refreshSubscriptionState,
    supportReason,
    supported,
    vapidPublicKey,
  ]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !profile?.id) return;
    setIsSubscribing(true);

    try {
      const sub = await getActiveSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        localStorage.removeItem(PWA_STORAGE_KEY);

        await (supabase as any)
          .from("push_subscriptions")
          .update({ status: "inactive", last_seen_at: new Date().toISOString() })
          .eq("endpoint", endpoint)
          .eq("user_id", profile.id);
      }
      await refreshSubscriptionState();
    } finally {
      setIsSubscribing(false);
    }
  }, [profile?.id, refreshSubscriptionState, supported]);

  return {
    supported,
    permission,
    isSubscribing,
    isSubscribed,
    subscriptionEndpoint,
    requestPermission,
    subscribe,
    unsubscribe,
    refreshSubscriptionState,
    supportReason,
  };
}
