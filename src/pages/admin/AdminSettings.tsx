import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { useUpdateGym } from "@/hooks/use-admin-mutations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { data: gym, isLoading } = useGymSettings();
  const updateGym = useUpdateGym();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [accentColor, setAccentColor] = useState("#7148EC");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [settings, setSettings] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gym) {
      setName(gym.name ?? "");
      setAccentColor(gym.accent_color ?? "#7148EC");
      setTimezone(gym.timezone ?? "America/Sao_Paulo");
      setSettings(gym.settings ?? {});
    }
  }, [gym]);

  const heroImageUrl = settings?.hero_image_url as string | undefined;

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${gym.id}/hero.${ext}`;
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

  const removeHero = () => {
    setSettings((prev: any) => ({ ...prev, hero_image_url: null }));
  };

  const handleSave = async () => {
    await updateGym.mutateAsync({ name, accent_color: accentColor, timezone, settings });
  };

  const toggleSetting = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
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
