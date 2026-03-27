import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Zap, X, Info, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useBodyFocusExercises } from "@/hooks/use-home-data";

const categories = [
  { key: "all", label: "Todos" },
  { key: "legs", label: "Pernas", match: ["perna", "leg", "quadríceps", "glúteo", "posterior"] },
  { key: "chest", label: "Peito", match: ["peito", "chest", "peitoral"] },
  { key: "back", label: "Costas", match: ["costa", "back", "dorsal", "trapézio"] },
  { key: "shoulder", label: "Ombro", match: ["ombro", "shoulder", "deltóide"] },
  { key: "cardio", label: "Cardio", match: ["cardio", "aeróbico", "corrida", "bike"] },
];

const ExerciseCard = memo(function ExerciseCard({ ex, i, onSelect }: { ex: any; i: number; onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: i * 0.05 }}
      onClick={onSelect}
      className="shrink-0 w-36 rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all group cursor-pointer"
    >
      <div className="h-24 bg-gradient-card flex items-center justify-center relative overflow-hidden">
        {ex.media_url ? (
          <img src={ex.media_url} alt={ex.name} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground truncate">{ex.name}</p>
        <p className="text-[10px] text-muted-foreground capitalize">{ex.muscle_group ?? "Geral"}</p>
        {ex.equipment && (
          <span className="inline-block text-[9px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full mt-1">
            {ex.equipment}
          </span>
        )}
      </div>
    </motion.div>
  );
});

const ExerciseDetail = memo(function ExerciseDetail({ ex, onClose }: { ex: any; onClose: () => void }) {
  const [showTips, setShowTips] = useState(false);

  // Parse instructions the same way as WorkoutExecution
  const parsedInstructions = useMemo(() => {
    if (!ex.instructions) return null;
    try {
      const parsed = JSON.parse(ex.instructions);
      if (parsed.steps || parsed.tips) return parsed;
    } catch {}
    // Plain text fallback: split by newlines or numbered items
    const lines = ex.instructions.split(/\n|(?=\d+\.\s)/).map((l: string) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    return lines.length > 0 ? { steps: lines, tips: null } : null;
  }, [ex.instructions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Media */}
        <div className="relative w-full aspect-video bg-secondary/40 overflow-hidden rounded-t-2xl">
          {ex.media_url ? (
            <img src={ex.media_url} alt={ex.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur border border-border text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{ex.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {ex.muscle_group && (
                <span className="text-[10px] font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">
                  {ex.muscle_group}
                </span>
              )}
              {ex.category && (
                <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2.5 py-1 rounded-full capitalize">
                  {ex.category}
                </span>
              )}
              {ex.equipment && (
                <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">
                  {ex.equipment}
                </span>
              )}
            </div>
          </div>

          {parsedInstructions && (
            <div className="border-t border-border pt-3">
              <button onClick={() => setShowTips(!showTips)} className="flex items-center gap-2 text-xs text-primary font-medium w-full justify-center">
                <Lightbulb className="w-3.5 h-3.5" />
                {showTips ? "Ocultar dicas" : "Ver como executar"}
                {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showTips && (
                <div className="mt-3 space-y-2 animate-slide-up text-left">
                  {parsedInstructions.steps?.map((step: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="text-primary font-semibold">{i + 1}.</span> {step}
                    </p>
                  ))}
                  {parsedInstructions.tips && (
                    <div className="pt-2 space-y-1">
                      {parsedInstructions.tips.map((tip: string, i: number) => (
                        <p key={i} className="text-xs text-warning/80">💡 {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

export default memo(function BodyFocusCarousel() {
  const { data: exercises } = useBodyFocusExercises();
  const [active, setActive] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() => {
    const all = exercises ?? [];
    if (active === "all") return all.slice(0, 10);
    const cat = categories.find(c => c.key === active);
    if (!cat || !cat.match) return [];
    return all.filter(ex => {
      const text = `${ex.muscle_group ?? ""} ${ex.category ?? ""}`.toLowerCase();
      return cat.match!.some(m => text.includes(m));
    }).slice(0, 10);
  }, [exercises, active]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Foco Muscular 🔥</h2>
          <Zap className="w-4 h-4 text-warning" />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                active === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {filtered.length === 0 ? (
            <div className="w-full text-center py-8 text-sm text-muted-foreground">Nenhum exercício encontrado</div>
          ) : (
            filtered.map((ex, i) => (
              <ExerciseCard key={ex.id} ex={ex} i={i} onSelect={() => setSelected(ex)} />
            ))
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selected && <ExerciseDetail ex={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
});
