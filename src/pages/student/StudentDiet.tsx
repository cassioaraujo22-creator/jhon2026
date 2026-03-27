import { ArrowLeft, Apple, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStudentActiveDiet } from "@/hooks/use-nutrition-data";

const mealLabel: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
  ceia: "Ceia",
};

export default function StudentDiet() {
  const navigate = useNavigate();
  const { data, isLoading } = useStudentActiveDiet();

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Minha Dieta</h1>
          <p className="text-sm text-muted-foreground">Planejamento alimentar</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
          <Apple className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Você ainda não possui dieta atribuída.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-base font-semibold text-foreground">{data.diet.name}</p>
            {data.diet.description && <p className="text-xs text-muted-foreground mt-1">{data.diet.description}</p>}
            {data.assignment?.notes && <p className="text-xs text-muted-foreground mt-2">Obs: {data.assignment.notes}</p>}
          </div>

          {(data.meals ?? []).map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-3 flex gap-3">
              <div className="w-24 h-24 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                {item.recipe?.image_url ? <img src={item.recipe.image_url} alt={item.recipe.title} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.recipe?.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.scheduled_time ? `${item.scheduled_time} · ` : "") + (mealLabel[item.recipe?.meal_type] ?? item.recipe?.meal_type ?? "")}
                </p>
                <p className="text-xs text-muted-foreground">{item.recipe?.description ?? ""}</p>
                <p className="text-xs text-muted-foreground">
                  {item.recipe?.calories ?? 0} kcal · P {item.recipe?.protein_g ?? 0}g · C {item.recipe?.carbs_g ?? 0}g · G {item.recipe?.fat_g ?? 0}g
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
