import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Upload, ImageIcon, X, Bell, Smartphone, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { useUpdateGym } from "@/hooks/use-admin-mutations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePwaPush } from "@/hooks/use-pwa-push";

export default function AdminSettings() {
  const { profile } = useAuth();
  const { data: gym, isLoading } = useGymSettings();
  const updateGym = useUpdateGym();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [accentColor, setAccentColor] = useState("#7148EC");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [settings, setSettings] = useState<any>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const noPlanBannerFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const pwaIconFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const promoBannerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gym) {
      setName(gym.name ?? "");
      setAccentColor(gym.accent_color ?? "#7148EC");
      setTimezone(gym.timezone ?? "America/Sao_Paulo");
      setSettings(gym.settings ?? {});
      setLogoUrl(gym.logo_url ?? null);
    }
  }, [gym]);

  const heroImageUrl = settings?.hero_image_url as string | undefined;
  const noPlanBannerImageUrl = settings?.no_plan_banner_image_url as string | undefined;
  const pwaIconUrl = (settings?.pwa_icon_url as string | undefined) ?? logoUrl ?? undefined;
  const faviconUrl = (settings?.favicon_url as string | undefined) ?? pwaIconUrl ?? logoUrl ?? undefined;
  const homePromoBanner = (settings?.home_promo_banner as any) ?? {};
  const pushEnabled = Boolean(settings?.push_enabled);
  const vapidPublicKey = (settings?.push_vapid_public_key as string | undefined) ?? "";
  const appDisplayName = (settings?.app_display_name as string | undefined) ?? name ?? "";

  const {
    supported: pushSupported,
    supportReason,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isSubscribing: pushBusy,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePwaPush(vapidPublicKey, pushEnabled);

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/hero.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setSettings((prev: any) => ({ ...prev, hero_image_url: url }));
      toast({ title: "Imagem carregada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleNoPlanBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/no-plan-banner.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setSettings((prev: any) => ({ ...prev, no_plan_banner_image_url: url }));
      toast({ title: "Banner sem plano carregado!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeHero = () => {
    setSettings((prev: any) => ({ ...prev, hero_image_url: null }));
  };

  const removeNoPlanBanner = () => {
    setSettings((prev: any) => ({ ...prev, no_plan_banner_image_url: null }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setLogoUrl(url);
      setSettings((prev: any) => ({
        ...prev,
        app_logo_url: url,
      }));
      toast({ title: "Logo carregada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar logo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    setSettings((prev: any) => ({ ...prev, app_logo_url: null }));
  };

  const handlePwaIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/pwa-icon.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setSettings((prev: any) => ({ ...prev, pwa_icon_url: url }));
      toast({ title: "Ícone do app carregado!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar ícone", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removePwaIcon = () => {
    setSettings((prev: any) => ({ ...prev, pwa_icon_url: null }));
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/favicon.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      setSettings((prev: any) => ({ ...prev, favicon_url: url }));
      toast({ title: "Favicon carregado!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar favicon", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeFavicon = () => {
    setSettings((prev: any) => ({ ...prev, favicon_url: null }));
  };

  const updateHomePromoBanner = (updates: Record<string, any>) => {
    setSettings((prev: any) => ({
      ...prev,
      home_promo_banner: {
        id: prev?.home_promo_banner?.id ?? crypto.randomUUID(),
        created_at: prev?.home_promo_banner?.created_at ?? new Date().toISOString(),
        is_active: false,
        priority: 1,
        overlay_color: "#0b0b12",
        overlay_opacity: 0.42,
        ...prev?.home_promo_banner,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    }));
  };

  const handlePromoBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym || !profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/gym/${gym.id}/home-promo-banner.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      updateHomePromoBanner({ image_url: imageUrl });
      toast({ title: "Imagem do banner carregada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar banner", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removePromoBannerImage = () => {
    updateHomePromoBanner({ image_url: null });
  };

  const handleSave = async () => {
    const banner = (settings?.home_promo_banner as any) ?? {};
    if (banner?.is_active && !banner?.image_url) {
      toast({
        title: "Banner ativo sem imagem",
        description: "Envie uma imagem ou desative o banner antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    if (!!banner?.button_text !== !!banner?.button_link) {
      toast({
        title: "Campos do botão incompletos",
        description: "Preencha texto e link do botão, ou deixe ambos vazios.",
        variant: "destructive",
      });
      return;
    }

    await updateGym.mutateAsync({ name, accent_color: accentColor, timezone, logo_url: logoUrl, settings });
    try {
      localStorage.setItem("gym_display_name", name.trim());
      localStorage.setItem("force_update_required", String(Boolean(settings?.force_update_required)));
      localStorage.setItem("app_primary_icon_url", String(faviconUrl ?? ""));
    } catch (_error) {
      // Ignore localStorage access failures.
    }
  };

  const toggleSetting = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSettingValue = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Configurações</h2>
        <Button size="sm" onClick={handleSave} disabled={updateGym.isPending}>
          {updateGym.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar</>}
        </Button>
      </div>

      {/* Hero Image */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Branding do App</h3>
        <p className="text-xs text-muted-foreground">Defina nome, logo e identidade visual para PWA e aplicativo</p>
        <input type="file" ref={logoFileRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
        <input type="file" ref={pwaIconFileRef} accept="image/*" onChange={handlePwaIconUpload} className="hidden" />
        <input type="file" ref={faviconFileRef} accept="image/*" onChange={handleFaviconUpload} className="hidden" />

        {logoUrl ? (
          <div className="relative rounded-xl overflow-hidden h-32 bg-secondary/40 border border-border">
            <img src={logoUrl} alt="Logo do app" className="w-full h-full object-contain p-3" />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-lg"
                onClick={() => logoFileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removeLogo}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => logoFileRef.current?.click()}
            disabled={uploading}
            className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Enviar logo do aplicativo</span>
          </button>
        )}

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Ícone do app (PWA)</label>
          {pwaIconUrl ? (
            <div className="relative rounded-xl overflow-hidden h-24 bg-secondary/40 border border-border">
              <img src={pwaIconUrl} alt="Ícone do app" className="w-full h-full object-contain p-2" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => pwaIconFileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removePwaIcon}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => pwaIconFileRef.current?.click()}
              disabled={uploading}
              className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {uploading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">Enviar ícone do app (recomendado 512x512)</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Favicon (ícone principal)</label>
          {faviconUrl ? (
            <div className="relative rounded-xl overflow-hidden h-20 bg-secondary/40 border border-border">
              <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain p-2" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => faviconFileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removeFavicon}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => faviconFileRef.current?.click()}
              disabled={uploading}
              className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {uploading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">Enviar favicon (preferência 512x512 ou 192x192)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Nome exibido no app</label>
            <input
              value={appDisplayName}
              onChange={(e) => updateSettingValue("app_display_name", e.target.value)}
              placeholder="Ex.: App Fitness"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Nome curto do PWA</label>
            <input
              value={(settings?.pwa_short_name as string | undefined) ?? ""}
              onChange={(e) => updateSettingValue("pwa_short_name", e.target.value)}
              placeholder="Ex.: FitApp"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-muted-foreground">Descrição do aplicativo</label>
            <input
              value={(settings?.pwa_description as string | undefined) ?? ""}
              onChange={(e) => updateSettingValue("pwa_description", e.target.value)}
              placeholder="Descrição exibida no manifest e metadados"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Cor de tema (PWA)</label>
            <input
              value={(settings?.pwa_theme_color as string | undefined) ?? accentColor}
              onChange={(e) => updateSettingValue("pwa_theme_color", e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Cor de fundo (PWA)</label>
            <input
              value={(settings?.pwa_background_color as string | undefined) ?? "#0b0b12"}
              onChange={(e) => updateSettingValue("pwa_background_color", e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">PWA e Push Notifications</h3>
        <p className="text-xs text-muted-foreground">
          Configure instalação do app e envio de notificações para dispositivos com permissão.
        </p>

        <div className="space-y-3">
          {[
            { key: "push_enabled", label: "Ativar push notifications no app" },
            { key: "push_auto_prompt", label: "Solicitar permissão de push automaticamente" },
            { key: "pwa_install_enabled", label: "Exibir incentivo de instalação (PWA)" },
            { key: "force_update_required", label: "Exigir atualização quando houver nova versão" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer" onClick={() => toggleSetting(key)}>
              <span className="text-sm text-foreground">{label}</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${settings[key] ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 bg-primary-foreground rounded-full absolute top-1 transition-all ${settings[key] ? "right-1" : "left-1"}`} />
              </div>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">VAPID Public Key (Web Push)</label>
          <input
            value={vapidPublicKey}
            onChange={(e) => updateSettingValue("push_vapid_public_key", e.target.value)}
            placeholder="Cole a chave pública VAPID aqui"
            className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Suporte: {pushSupported ? "disponível" : "não suportado neste navegador"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Bell className="w-4 h-4 text-primary" />
            <span>Permissão: {pushPermission}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Status da assinatura: {pushSubscribed ? "conectado" : "não conectado"}
          </div>
          {!pushSupported && supportReason ? (
            <div className="text-xs text-warning">{supportReason}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const result = await requestPermission();
              toast({ title: `Permissão de notificação: ${result}` });
            }}
            disabled={!pushSupported}
          >
            Solicitar permissão
          </Button>
          <Button
            type="button"
            onClick={async () => {
              try {
                await subscribe();
                toast({ title: "Push conectado com sucesso!" });
              } catch (err: any) {
                toast({ title: "Falha ao conectar push", description: err.message, variant: "destructive" });
              }
            }}
            disabled={!pushSupported || pushBusy || !pushEnabled || !vapidPublicKey}
          >
            {pushBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Conectar push"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                await unsubscribe();
                toast({ title: "Push desconectado" });
              } catch (err: any) {
                toast({ title: "Falha ao desconectar", description: err.message, variant: "destructive" });
              }
            }}
            disabled={!pushSupported || pushBusy || !pushSubscribed}
          >
            Desconectar push
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!("Notification" in window) || Notification.permission !== "granted") {
                toast({ title: "Permissão de notificação não concedida", variant: "destructive" });
                return;
              }
              const registration = await navigator.serviceWorker.ready;
              const notificationIcon = pwaIconUrl || logoUrl || "";
              const iconOptions = notificationIcon
                ? { icon: notificationIcon, badge: notificationIcon }
                : {};
              await registration.showNotification("Push de teste", {
                body: "Configuração de notificações funcionando.",
                ...iconOptions,
                data: { url: "/app" },
              });
              toast({ title: "Notificação de teste enviada" });
            }}
            disabled={!pushSupported}
          >
            Testar notificação
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Imagem de Fundo (Home)</h3>
        <p className="text-xs text-muted-foreground">Imagem exibida no topo da página inicial dos alunos</p>
        <input type="file" ref={fileRef} accept="image/*" onChange={handleHeroUpload} className="hidden" />
        {heroImageUrl ? (
          <div className="relative rounded-xl overflow-hidden h-40">
            <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button size="icon" variant="secondary" className="w-8 h-8 rounded-lg" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removeHero}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
          </button>
        )}
      </div>

      {/* No Plan Banner Image */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Banner "Sem plano" (Home)</h3>
        <p className="text-xs text-muted-foreground">Imagem exibida no banner para alunos sem plano ativo</p>
        <input type="file" ref={noPlanBannerFileRef} accept="image/*" onChange={handleNoPlanBannerUpload} className="hidden" />
        {noPlanBannerImageUrl ? (
          <div className="relative rounded-xl overflow-hidden h-40">
            <img src={noPlanBannerImageUrl} alt="Banner sem plano" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-lg"
                onClick={() => noPlanBannerFileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removeNoPlanBanner}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => noPlanBannerFileRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Clique para enviar uma imagem</span>
          </button>
        )}
      </div>

      {/* Home Promotional Banner */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Banner Promocional da Home</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure um banner promocional com imagem, texto e botão para aparecer automaticamente na Home.
        </p>

        <input type="file" ref={promoBannerFileRef} accept="image/*" onChange={handlePromoBannerUpload} className="hidden" />

        {homePromoBanner?.image_url ? (
          <div className="relative rounded-xl overflow-hidden h-40 border border-border">
            <img src={homePromoBanner.image_url} alt="Banner promocional" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-lg"
                onClick={() => promoBannerFileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="w-8 h-8 rounded-lg" onClick={removePromoBannerImage}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => promoBannerFileRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Clique para enviar a imagem do banner</span>
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-muted-foreground">Título</label>
            <input
              value={(homePromoBanner?.title as string | undefined) ?? ""}
              onChange={(e) => updateHomePromoBanner({ title: e.target.value })}
              placeholder="Ex.: Transforme seu treino hoje"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-muted-foreground">Subtítulo</label>
            <input
              value={(homePromoBanner?.subtitle as string | undefined) ?? ""}
              onChange={(e) => updateHomePromoBanner({ subtitle: e.target.value })}
              placeholder="Texto curto para destacar a promoção"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Texto do botão</label>
            <input
              value={(homePromoBanner?.button_text as string | undefined) ?? ""}
              onChange={(e) => updateHomePromoBanner({ button_text: e.target.value })}
              placeholder="Ex.: Quero aproveitar"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Link / Rota do botão</label>
            <input
              value={(homePromoBanner?.button_link as string | undefined) ?? ""}
              onChange={(e) => updateHomePromoBanner({ button_link: e.target.value })}
              placeholder="Ex.: /app/store ou https://..."
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Prioridade</label>
            <input
              type="number"
              min={1}
              value={Number(homePromoBanner?.priority ?? 1)}
              onChange={(e) => updateHomePromoBanner({ priority: Number(e.target.value || 1) })}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Cor do overlay</label>
            <input
              value={(homePromoBanner?.overlay_color as string | undefined) ?? "#0b0b12"}
              onChange={(e) => updateHomePromoBanner({ overlay_color: e.target.value })}
              placeholder="#0b0b12"
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-muted-foreground">
              Intensidade do overlay ({Math.round(Number(homePromoBanner?.overlay_opacity ?? 0.42) * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={Number(homePromoBanner?.overlay_opacity ?? 0.42)}
              onChange={(e) => updateHomePromoBanner({ overlay_opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer pt-1" onClick={() => updateHomePromoBanner({ is_active: !homePromoBanner?.is_active })}>
          <span className="text-sm text-foreground">Ativar banner promocional na Home</span>
          <div className={`w-10 h-6 rounded-full relative transition-colors ${homePromoBanner?.is_active ? "bg-primary" : "bg-muted"}`}>
            <div className={`w-4 h-4 bg-primary-foreground rounded-full absolute top-1 transition-all ${homePromoBanner?.is_active ? "right-1" : "left-1"}`} />
          </div>
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Dados da Academia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Fuso horário</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all">
              <option value="America/Sao_Paulo">São Paulo (BRT)</option>
              <option value="America/Manaus">Manaus (AMT)</option>
              <option value="America/Fortaleza">Fortaleza (BRT)</option>
              <option value="America/Cuiaba">Cuiabá (AMT)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Cor do tema</label>
            <div className="flex items-center gap-3">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              <input value={accentColor} onChange={e => setAccentColor(e.target.value)}
                className="flex-1 h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Slug</label>
            <input value={gym?.slug ?? ""} disabled
              className="w-full h-10 rounded-xl bg-secondary border border-border px-4 text-sm text-muted-foreground cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Regras de Acesso</h3>
        <div className="space-y-3">
          {[
            { key: "block_defaulters", label: "Bloquear catraca para inadimplentes" },
            { key: "restrict_hours", label: "Restringir acesso fora do horário" },
            { key: "require_checkin", label: "Exigir check-in no app" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer" onClick={() => toggleSetting(key)}>
              <span className="text-sm text-foreground">{label}</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${settings[key] ? "bg-primary" : "bg-muted"}`}>
                <div className={`w-4 h-4 bg-primary-foreground rounded-full absolute top-1 transition-all ${settings[key] ? "right-1" : "left-1"}`} />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
