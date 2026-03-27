import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Loader2,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
  UserPlus,
  Pencil,
  Clock3,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGymMemberships } from "@/hooks/use-supabase-data";
import { useDietRecipes, useGymDiets, useGymRecipes, useGymStudentDietAssignments } from "@/hooks/use-nutrition-data";
import { useQuery } from "@tanstack/react-query";
import {
  useAssignDietToStudent,
  useCreateDiet,
  useCreateRecipe,
  useDeleteDiet,
  useDeleteRecipe,
  useUpdateDiet,
  useUpdateRecipe,
  useUpdateStudentDietStatus,
} from "@/hooks/use-nutrition-mutations";

const MEAL_OPTIONS = [
  { value: "cafe_da_manha", label: "Café da manhã" },
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
  { value: "lanche", label: "Lanche" },
  { value: "ceia", label: "Ceia" },
];

type RecipeForm = {
  id?: string;
  title: string;
  description: string;
  meal_type: string;
  prep_time_minutes: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  ingredients: string;
  steps: string;
  image_url: string;
  is_active: boolean;
};

type DietFormRecipe = {
  recipe_id: string;
  meal_order: number;
  scheduled_time: string;
};

export default function AdminNutrition() {
  const { profile, roles } = useAuth();
  const { toast } = useToast();

  const { data: recipes, isLoading: recipesLoading } = useGymRecipes();
  const { data: diets, isLoading: dietsLoading } = useGymDiets();
  const { data: assignments, isLoading: assignmentsLoading } = useGymStudentDietAssignments();
  const { data: memberships } = useGymMemberships();

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const createDiet = useCreateDiet();
  const updateDiet = useUpdateDiet();
  const deleteDiet = useDeleteDiet();

  const assignDiet = useAssignDietToStudent();
  const updateAssignmentStatus = useUpdateStudentDietStatus();

  const [activeTab, setActiveTab] = useState<"recipes" | "diets" | "assignments">("recipes");

  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [dietDialogOpen, setDietDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const [recipeForm, setRecipeForm] = useState<RecipeForm>({
    title: "",
    description: "",
    meal_type: "almoco",
    prep_time_minutes: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    ingredients: "",
    steps: "",
    image_url: "",
    is_active: true,
  });

  const [dietForm, setDietForm] = useState({
    id: "",
    name: "",
    description: "",
    is_active: true,
    recipes: [] as DietFormRecipe[],
  });

  const [assignmentForm, setAssignmentForm] = useState({
    student_id: "",
    diet_id: "",
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "",
    status: "active" as "active" | "paused" | "finished",
    notes: "",
  });

  const [selectedDietForEdit, setSelectedDietForEdit] = useState<string>("");
  const { data: selectedDietRecipes } = useDietRecipes(selectedDietForEdit || undefined);

  const { data: allDietRecipes } = useQuery({
    queryKey: ["all-diet-recipes", profile?.gym_id, diets?.length],
    enabled: !!profile?.gym_id && !!diets && diets.length > 0,
    queryFn: async () => {
      const dietIds = (diets ?? []).map((d: any) => d.id);
      if (dietIds.length === 0) return [];
      const { data, error } = await supabase
        .from("diet_recipes" as any)
        .select("diet_id")
        .in("diet_id", dietIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const recipeFileRef = useRef<HTMLInputElement>(null);
  const [uploadingRecipeImage, setUploadingRecipeImage] = useState(false);

  const members = useMemo(() => {
    const list = (memberships ?? []).map((m: any) => ({
      id: m.member_id as string,
      name: m.profiles?.name ?? "Aluno",
      email: m.profiles?.email ?? "",
    }));
    return Array.from(new Map(list.map((m) => [m.id, m])).values());
  }, [memberships]);

  const recipeCountByDiet = useMemo(() => {
    const map = new Map<string, number>();
    (allDietRecipes ?? []).forEach((item: any) => {
      map.set(item.diet_id, (map.get(item.diet_id) ?? 0) + 1);
    });
    return map;
  }, [allDietRecipes]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.name));
    return map;
  }, [members]);

  const dietNameById = useMemo(() => {
    const map = new Map<string, string>();
    (diets ?? []).forEach((d: any) => map.set(d.id, d.name));
    return map;
  }, [diets]);

  useEffect(() => {
    if (!dietDialogOpen || !dietForm.id || !selectedDietRecipes) return;
    setDietForm((prev) => {
      if (prev.recipes.length > 0) return prev;
      return {
        ...prev,
        recipes: selectedDietRecipes.map((item: any) => ({
          recipe_id: item.recipe_id,
          meal_order: item.meal_order,
          scheduled_time: item.scheduled_time ?? "",
        })),
      };
    });
  }, [dietDialogOpen, dietForm.id, selectedDietRecipes]);

  const resetRecipeForm = () => {
    setRecipeForm({
      title: "",
      description: "",
      meal_type: "almoco",
      prep_time_minutes: "",
      calories: "",
      protein_g: "",
      carbs_g: "",
      fat_g: "",
      ingredients: "",
      steps: "",
      image_url: "",
      is_active: true,
    });
  };

  const openCreateRecipe = () => {
    resetRecipeForm();
    setRecipeDialogOpen(true);
  };

  const openEditRecipe = (recipe: any) => {
    setRecipeForm({
      id: recipe.id,
      title: recipe.title ?? "",
      description: recipe.description ?? "",
      meal_type: recipe.meal_type ?? "almoco",
      prep_time_minutes: String(recipe.prep_time_minutes ?? ""),
      calories: String(recipe.calories ?? ""),
      protein_g: String(recipe.protein_g ?? ""),
      carbs_g: String(recipe.carbs_g ?? ""),
      fat_g: String(recipe.fat_g ?? ""),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join("\n") : "",
      steps: Array.isArray(recipe.steps) ? recipe.steps.join("\n") : "",
      image_url: recipe.image_url ?? "",
      is_active: !!recipe.is_active,
    });
    setRecipeDialogOpen(true);
  };

  const handleRecipeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploadingRecipeImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/recipes/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setRecipeForm((prev) => ({ ...prev, image_url: data.publicUrl }));
      toast({ title: "Imagem da receita enviada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploadingRecipeImage(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipeForm.title.trim()) {
      toast({ title: "Informe o título da receita", variant: "destructive" });
      return;
    }
    const payload = {
      title: recipeForm.title.trim(),
      description: recipeForm.description.trim() || null,
      meal_type: recipeForm.meal_type,
      prep_time_minutes: recipeForm.prep_time_minutes ? Number(recipeForm.prep_time_minutes) : null,
      calories: Number(recipeForm.calories || 0),
      protein_g: Number(recipeForm.protein_g || 0),
      carbs_g: Number(recipeForm.carbs_g || 0),
      fat_g: Number(recipeForm.fat_g || 0),
      ingredients: recipeForm.ingredients.split("\n").map((v) => v.trim()).filter(Boolean),
      steps: recipeForm.steps.split("\n").map((v) => v.trim()).filter(Boolean),
      image_url: recipeForm.image_url || null,
      is_active: recipeForm.is_active,
    };

    if (recipeForm.id) {
      await updateRecipe.mutateAsync({ id: recipeForm.id, ...payload });
    } else {
      await createRecipe.mutateAsync(payload);
    }
    setRecipeDialogOpen(false);
  };

  const openCreateDiet = () => {
    setSelectedDietForEdit("");
    setDietForm({ id: "", name: "", description: "", is_active: true, recipes: [] });
    setDietDialogOpen(true);
  };

  const openEditDiet = (diet: any) => {
    setSelectedDietForEdit(diet.id);
    setDietForm({
      id: diet.id,
      name: diet.name ?? "",
      description: diet.description ?? "",
      is_active: !!diet.is_active,
      recipes: [],
    });
    setDietDialogOpen(true);
  };

  const addRecipeToDiet = (recipeId: string) => {
    if (dietForm.recipes.some((r) => r.recipe_id === recipeId)) return;
    setDietForm((prev) => ({
      ...prev,
      recipes: [...prev.recipes, { recipe_id: recipeId, meal_order: prev.recipes.length + 1, scheduled_time: "" }],
    }));
  };

  const removeRecipeFromDiet = (recipeId: string) => {
    setDietForm((prev) => ({ ...prev, recipes: prev.recipes.filter((r) => r.recipe_id !== recipeId) }));
  };

  const saveDiet = async () => {
    if (!dietForm.name.trim()) {
      toast({ title: "Informe o nome da dieta", variant: "destructive" });
      return;
    }
    if (dietForm.recipes.length === 0) {
      toast({ title: "Adicione ao menos uma receita", variant: "destructive" });
      return;
    }
    const payload = {
      name: dietForm.name.trim(),
      description: dietForm.description.trim() || null,
      is_active: dietForm.is_active,
      recipes: dietForm.recipes.map((r, i) => ({
        recipe_id: r.recipe_id,
        meal_order: r.meal_order || i + 1,
        scheduled_time: r.scheduled_time || null,
      })),
    };

    if (dietForm.id) {
      await updateDiet.mutateAsync({ id: dietForm.id, ...payload });
    } else {
      await createDiet.mutateAsync(payload);
    }
    setDietDialogOpen(false);
  };

  const openAssignmentDialog = () => {
    if (!members.length) {
      toast({
        title: "Nenhum aluno disponível",
        description: "Verifique se existem alunos ativos e permissão para visualizar membros.",
        variant: "destructive",
      });
      return;
    }
    if (!(diets ?? []).length) {
      toast({
        title: "Nenhuma dieta cadastrada",
        description: "Crie uma dieta antes de atribuir.",
        variant: "destructive",
      });
      return;
    }
    setAssignmentForm({
      student_id: members[0]?.id ?? "",
      diet_id: diets?.[0]?.id ?? "",
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: "",
      status: "active",
      notes: "",
    });
    setAssignmentDialogOpen(true);
  };

  const saveAssignment = async (forceDuplicate = false) => {
    if (!assignmentForm.student_id || !assignmentForm.diet_id) {
      toast({ title: "Selecione aluno e dieta", variant: "destructive" });
      return;
    }
    try {
      await assignDiet.mutateAsync({
        student_id: assignmentForm.student_id,
        diet_id: assignmentForm.diet_id,
        starts_at: new Date(assignmentForm.starts_at).toISOString(),
        ends_at: assignmentForm.ends_at ? new Date(assignmentForm.ends_at).toISOString() : null,
        status: assignmentForm.status,
        notes: assignmentForm.notes || null,
        skip_duplicate_check: forceDuplicate,
      });
      setAssignmentDialogOpen(false);
    } catch (e: any) {
      if (e.message === "duplicate_active_assignment") {
        if (confirm("Já existe atribuição ativa dessa dieta para esse aluno. Deseja duplicar mesmo assim?")) {
          await saveAssignment(true);
        }
        return;
      }
      toast({ title: "Erro ao atribuir dieta", description: e.message, variant: "destructive" });
    }
  };

  const loading = recipesLoading || dietsLoading || assignmentsLoading;
  const canManageNutrition = roles.includes("owner") || roles.includes("super_admin") || roles.includes("nutritionist");

  if (!canManageNutrition) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Apenas administradores e nutricionistas podem gerenciar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-bold text-foreground">Nutricionista</h2>

      <div className="flex gap-2 overflow-auto">
        <Button variant={activeTab === "recipes" ? "pill-active" : "pill"} size="pill" onClick={() => setActiveTab("recipes")}>
          <BookOpen className="w-4 h-4" />
          Receitas
        </Button>
        <Button variant={activeTab === "diets" ? "pill-active" : "pill"} size="pill" onClick={() => setActiveTab("diets")}>
          <UtensilsCrossed className="w-4 h-4" />
          Dietas
        </Button>
        <Button variant={activeTab === "assignments" ? "pill-active" : "pill"} size="pill" onClick={() => setActiveTab("assignments")}>
          <UserPlus className="w-4 h-4" />
          Atribuições
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : null}

      {!loading && activeTab === "recipes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateRecipe}>
              <Plus className="w-4 h-4" />
              Nova Receita
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recipes ?? []).map((recipe: any) => (
              <div key={recipe.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="h-36 w-full rounded-xl overflow-hidden bg-secondary">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{recipe.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{recipe.description || "Sem descrição"}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {MEAL_OPTIONS.find((m) => m.value === recipe.meal_type)?.label ?? recipe.meal_type} · {recipe.calories} kcal
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditRecipe(recipe)}>
                    <Pencil className="w-4 h-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Remover esta receita?")) deleteRecipe.mutate(recipe.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === "diets" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateDiet}>
              <Plus className="w-4 h-4" />
              Nova Dieta
            </Button>
          </div>
          <div className="space-y-3">
            {(diets ?? []).map((diet: any) => (
              <div key={diet.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{diet.name}</p>
                  <p className="text-xs text-muted-foreground">{diet.description || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {diet.is_active ? "Ativa" : "Inativa"} · Receitas: {recipeCountByDiet.get(diet.id) ?? "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDiet(diet)}>
                    <Pencil className="w-4 h-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Remover esta dieta?")) deleteDiet.mutate(diet.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAssignmentDialog}>
              <Plus className="w-4 h-4" />
              Atribuir Dieta
            </Button>
          </div>
          <div className="space-y-3">
            {(assignments ?? []).map((assignment: any) => (
              <div key={assignment.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {memberNameById.get(assignment.student_id) ?? "Aluno"} · {dietNameById.get(assignment.diet_id) ?? "Dieta"}
                  </p>
                  <select
                    value={assignment.status}
                    onChange={(e) => updateAssignmentStatus.mutate({ id: assignment.id, status: e.target.value as any })}
                    className="h-8 rounded-lg bg-secondary border border-border px-2 text-xs"
                  >
                    <option value="active">Ativa</option>
                    <option value="paused">Pausada</option>
                    <option value="finished">Finalizada</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Início: {new Date(assignment.starts_at).toLocaleString("pt-BR")}
                  {assignment.ends_at ? ` · Fim: ${new Date(assignment.ends_at).toLocaleString("pt-BR")}` : ""}
                </p>
                {assignment.notes && <p className="text-xs text-muted-foreground">Obs: {assignment.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe dialog */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{recipeForm.id ? "Editar Receita" : "Nova Receita"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            <Input value={recipeForm.title} onChange={(e) => setRecipeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título da receita" />
            <textarea value={recipeForm.description} onChange={(e) => setRecipeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição"
              className="w-full min-h-20 rounded-xl bg-secondary border border-border px-4 py-3 text-sm" />

            <div className="grid grid-cols-2 gap-2">
              <select value={recipeForm.meal_type} onChange={(e) => setRecipeForm((p) => ({ ...p, meal_type: e.target.value }))}
                className="h-10 rounded-xl bg-secondary border border-border px-3 text-sm">
                {MEAL_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <Input value={recipeForm.prep_time_minutes} onChange={(e) => setRecipeForm((p) => ({ ...p, prep_time_minutes: e.target.value }))} placeholder="Tempo preparo (min)" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Input value={recipeForm.calories} onChange={(e) => setRecipeForm((p) => ({ ...p, calories: e.target.value }))} placeholder="kcal" />
              <Input value={recipeForm.protein_g} onChange={(e) => setRecipeForm((p) => ({ ...p, protein_g: e.target.value }))} placeholder="Prot g" />
              <Input value={recipeForm.carbs_g} onChange={(e) => setRecipeForm((p) => ({ ...p, carbs_g: e.target.value }))} placeholder="Carbs g" />
              <Input value={recipeForm.fat_g} onChange={(e) => setRecipeForm((p) => ({ ...p, fat_g: e.target.value }))} placeholder="Gord g" />
            </div>

            <textarea value={recipeForm.ingredients} onChange={(e) => setRecipeForm((p) => ({ ...p, ingredients: e.target.value }))}
              placeholder="Ingredientes (1 por linha)" className="w-full min-h-24 rounded-xl bg-secondary border border-border px-4 py-3 text-sm" />
            <textarea value={recipeForm.steps} onChange={(e) => setRecipeForm((p) => ({ ...p, steps: e.target.value }))}
              placeholder="Passos (1 por linha)" className="w-full min-h-24 rounded-xl bg-secondary border border-border px-4 py-3 text-sm" />

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={recipeForm.image_url} onChange={(e) => setRecipeForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="URL da imagem" />
                <input type="file" ref={recipeFileRef} className="hidden" accept="image/*" onChange={handleRecipeImageUpload} />
                <Button type="button" variant="outline" onClick={() => recipeFileRef.current?.click()} disabled={uploadingRecipeImage}>
                  {uploadingRecipeImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={recipeForm.is_active} onChange={(e) => setRecipeForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Receita ativa
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveRecipe} disabled={createRecipe.isPending || updateRecipe.isPending}>
              {(createRecipe.isPending || updateRecipe.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diet dialog */}
      <Dialog open={dietDialogOpen} onOpenChange={setDietDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{dietForm.id ? "Editar Dieta" : "Nova Dieta"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            <Input value={dietForm.name} onChange={(e) => setDietForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome da dieta" />
            <textarea value={dietForm.description} onChange={(e) => setDietForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição"
              className="w-full min-h-20 rounded-xl bg-secondary border border-border px-4 py-3 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dietForm.is_active} onChange={(e) => setDietForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Dieta ativa
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Receitas disponíveis</p>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {(recipes ?? []).filter((r: any) => r.is_active).map((recipe: any) => (
                    <button key={recipe.id} type="button" onClick={() => addRecipeToDiet(recipe.id)}
                      className="w-full text-left rounded-xl border border-border bg-secondary/40 p-2 hover:border-primary/30">
                      <p className="text-sm text-foreground">{recipe.title}</p>
                      <p className="text-xs text-muted-foreground">{recipe.calories} kcal</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Receitas da dieta</p>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {dietForm.recipes.map((item, idx) => {
                    const recipe = (recipes ?? []).find((r: any) => r.id === item.recipe_id);
                    return (
                      <div key={`${item.recipe_id}-${idx}`} className="rounded-xl border border-border p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-foreground">{recipe?.title ?? "Receita"}</p>
                          <button type="button" onClick={() => removeRecipeFromDiet(item.recipe_id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={String(item.meal_order)}
                            onChange={(e) => {
                              const value = Number(e.target.value || 0);
                              setDietForm((prev) => ({
                                ...prev,
                                recipes: prev.recipes.map((r) => r.recipe_id === item.recipe_id ? { ...r, meal_order: value } : r),
                              }));
                            }}
                            placeholder="Ordem"
                          />
                          <div className="relative">
                            <Clock3 className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input
                              className="pl-8"
                              value={item.scheduled_time}
                              onChange={(e) => {
                                setDietForm((prev) => ({
                                  ...prev,
                                  recipes: prev.recipes.map((r) => r.recipe_id === item.recipe_id ? { ...r, scheduled_time: e.target.value } : r),
                                }));
                              }}
                              placeholder="Horário (07:30)"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {dietForm.recipes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma receita adicionada.</p>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDietDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveDiet} disabled={createDiet.isPending || updateDiet.isPending}>
              {(createDiet.isPending || updateDiet.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar dieta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir Dieta ao Aluno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select value={assignmentForm.student_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, student_id: e.target.value }))}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm">
              <option value="">Selecione o aluno</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </select>
            <select value={assignmentForm.diet_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, diet_id: e.target.value }))}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm">
              <option value="">Selecione a dieta</option>
              {(diets ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={assignmentForm.starts_at} onChange={(e) => setAssignmentForm((p) => ({ ...p, starts_at: e.target.value }))} />
              <Input type="datetime-local" value={assignmentForm.ends_at} onChange={(e) => setAssignmentForm((p) => ({ ...p, ends_at: e.target.value }))} />
            </div>
            <select value={assignmentForm.status} onChange={(e) => setAssignmentForm((p) => ({ ...p, status: e.target.value as any }))}
              className="w-full h-10 rounded-xl bg-secondary border border-border px-3 text-sm">
              <option value="active">Ativa</option>
              <option value="paused">Pausada</option>
              <option value="finished">Finalizada</option>
            </select>
            <textarea value={assignmentForm.notes} onChange={(e) => setAssignmentForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Observações" className="w-full min-h-20 rounded-xl bg-secondary border border-border px-4 py-3 text-sm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveAssignment()} disabled={assignDiet.isPending}>
              {assignDiet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar atribuição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
