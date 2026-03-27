import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Apple, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudentActiveDiet } from "@/hooks/use-nutrition-data";

const mealLabel: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
  ceia: "Ceia",
};

export default memo(function TodayDietBlock() {
  const navigate = useNavigate();
  const { data, isLoading } = useStudentActiveDiet();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Carregando dieta...</p>
      </div>
    );
  }

  if (!data || !data.diet?.is_active) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Apple className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Sua Dieta de Hoje</p>
        </div>
        <p className="text-xs text-muted-foreground">Você ainda não possui dieta atribuída.</p>
      </div>
    );
  }

  const meals = data.meals ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Sua Dieta de Hoje</p>
            <p className="text-[11px] text-muted-foreground">{data.diet.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/diet")}>
          Ver dieta completa <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {meals.slice(0, 4).map((item: any) => (
          <div key={item.id} className="rounded-xl border border-border bg-secondary/40 p-2.5 flex gap-2.5">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {item.recipe?.image_url ? (
                <img src={item.recipe.image_url} alt={item.recipe.title} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{item.recipe?.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {(item.scheduled_time ? `${item.scheduled_time} · ` : "") + (mealLabel[item.recipe?.meal_type] ?? item.recipe?.meal_type ?? "")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.recipe?.calories ?? 0} kcal · P {item.recipe?.protein_g ?? 0}g · C {item.recipe?.carbs_g ?? 0}g · G {item.recipe?.fat_g ?? 0}g
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
