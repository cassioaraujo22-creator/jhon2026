import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Save, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGymSettings } from "@/hooks/use-supabase-data";
import { useUpdateGym } from "@/hooks/use-admin-mutations";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import onboarding1 from "@/assets/onboarding-1.jpg";
import onboarding2 from "@/assets/onboarding-2.jpg";
import onboarding3 from "@/assets/onboarding-3.jpg";

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  image_url: string;
};

const defaultSlides: OnboardingSlide[] = [
  {
    id: "slide-1",
    title: "Treinos que evoluem com você",
    description: "Alcance seus objetivos com programas personalizados e acompanhamento profissional.",
    image_url: onboarding1,
  },
  {
    id: "slide-2",
    title: "Encontre o mentor ideal",
    description: "Conecte-se com coaches especializados que entendem suas necessidades e motivam cada passo.",
    image_url: onboarding2,
  },
  {
    id: "slide-3",
    title: "Sem limites. Sua academia sempre com você.",
    description: "Acompanhe treinos, progresso e agenda de qualquer lugar, a qualquer hora.",
    image_url: onboarding3,
  },
];

export default function AdminOnboarding() {
  const { profile } = useAuth();
  const { data: gym, isLoading } = useGymSettings();
  const updateGym = useUpdateGym();
  const { toast } = useToast();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [slides, setSlides] = useState<OnboardingSlide[]>(defaultSlides);
  const [skipLabel, setSkipLabel] = useState("Pular");
  const [nextLabel, setNextLabel] = useState("Próximo");
  const [startLabel, setStartLabel] = useState("Começar");

  useEffect(() => {
    const config = (gym?.settings as any)?.onboarding_config ?? {};
    const configuredSlides = Array.isArray(config.slides) ? config.slides : [];

    if (configuredSlides.length > 0) {
      setSlides(
        configuredSlides.slice(0, 5).map((slide: any, idx: number) => ({
          id: String(slide.id ?? `slide-${idx + 1}`),
          title: String(slide.title ?? ""),
          description: String(slide.description ?? ""),
          image_url: String(slide.image_url ?? ""),
        }))
      );
    } else {
      setSlides(defaultSlides);
    }

    setSkipLabel(String(config?.labels?.skip ?? "Pular"));
    setNextLabel(String(config?.labels?.next ?? "Próximo"));
    setStartLabel(String(config?.labels?.start ?? "Começar"));
  }, [gym?.id, gym?.settings]);

  const previewSlide = useMemo(() => slides[0] ?? defaultSlides[0], [slides]);

  const updateSlide = (id: string, updates: Partial<OnboardingSlide>) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide)));
  };

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "Novo slide",
        description: "Descreva este passo do onboarding.",
        image_url: "",
      },
    ]);
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== id));
  };

  const handleUploadSlideImage = async (slideId: string, file: File) => {
    if (!gym?.id || !profile?.id) return;
    setUploadingSlideId(slideId);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}/gym/${gym.id}/onboarding/${slideId}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const imageUrl = `${data.publicUrl}?t=${Date.now()}`;
      updateSlide(slideId, { image_url: imageUrl });
      toast({ title: "Imagem do slide carregada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploadingSlideId(null);
    }
  };

  const handleSave = async () => {
    const trimmed = slides.map((slide) => ({
      ...slide,
      title: slide.title.trim(),
      description: slide.description.trim(),
      image_url: slide.image_url.trim(),
    }));

    if (trimmed.length === 0) {
      toast({ title: "Adicione ao menos um slide", variant: "destructive" });
      return;
    }

    const invalidSlide = trimmed.find((slide) => !slide.title || !slide.description || !slide.image_url);
    if (invalidSlide) {
      toast({
        title: "Slide incompleto",
        description: "Todos os slides precisam de título, descrição e imagem.",
        variant: "destructive",
      });
      return;
    }

    const currentSettings = (gym?.settings as any) ?? {};
    await updateGym.mutateAsync({
      settings: {
        ...currentSettings,
        onboarding_config: {
          slides: trimmed,
          labels: {
            skip: skipLabel.trim() || "Pular",
            next: nextLabel.trim() || "Próximo",
            start: startLabel.trim() || "Começar",
          },
          updated_at: new Date().toISOString(),
        },
      },
    });

    try {
      localStorage.setItem(
        "onboarding_config",
        JSON.stringify({
          slides: trimmed.map((slide) => ({
            id: slide.id,
            title: slide.title,
            description: slide.description,
            image_url: slide.image_url,
          })),
          labels: {
            skip: skipLabel.trim() || "Pular",
            next: nextLabel.trim() || "Próximo",
            start: startLabel.trim() || "Começar",
          },
        })
      );
    } catch (_error) {
      // ignore local cache failures
    }
  };

  const handleRestoreDefaults = () => {
    setSlides(defaultSlides);
    setSkipLabel("Pular");
    setNextLabel("Próximo");
    setStartLabel("Começar");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Onboarding</h2>
          <p className="text-sm text-muted-foreground">Edite os slides e textos da experiência inicial</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRestoreDefaults}>
            Restaurar padrão
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateGym.isPending}>
            {updateGym.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Slides</h3>
            <Button size="sm" variant="outline" onClick={addSlide}>
              <Plus className="w-4 h-4" />
              Adicionar slide
            </Button>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {slides.map((slide, index) => (
              <div key={slide.id} className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Slide {index + 1}</p>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="w-8 h-8"
                    onClick={() => removeSlide(slide.id)}
                    disabled={slides.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Título</label>
                  <input
                    value={slide.title}
                    onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                    className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Descrição</label>
                  <textarea
                    value={slide.description}
                    onChange={(e) => updateSlide(slide.id, { description: e.target.value })}
                    className="w-full min-h-20 rounded-xl bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Imagem</label>
                  <input
                    ref={(el) => {
                      fileRefs.current[slide.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadSlideImage(slide.id, file);
                    }}
                  />
                  {slide.image_url ? (
                    <div className="relative rounded-xl overflow-hidden h-28 border border-border">
                      <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="w-8 h-8"
                          onClick={() => fileRefs.current[slide.id]?.click()}
                        >
                          {uploadingSlideId === slide.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[slide.id]?.click()}
                      className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Enviar imagem</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Textos dos botões</h3>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Pular</label>
              <input
                value={skipLabel}
                onChange={(e) => setSkipLabel(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Próximo</label>
              <input
                value={nextLabel}
                onChange={(e) => setNextLabel(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Começar (último slide)</label>
              <input
                value={startLabel}
                onChange={(e) => setStartLabel(e.target.value)}
                className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Preview rápido</p>
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="h-44 relative">
                <img src={previewSlide?.image_url || onboarding1} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-bold text-white line-clamp-2">{previewSlide?.title}</p>
                  <p className="text-xs text-white/90 line-clamp-2">{previewSlide?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

