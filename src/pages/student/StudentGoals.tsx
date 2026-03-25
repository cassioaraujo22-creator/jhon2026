import { useState } from "react";
import { ArrowLeft, Plus, Target, Trophy, Edit2, Trash2, Check, Loader2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  type: string;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
}

const GOAL_TYPES = [
  { value: "weight_loss", label: "Perder Peso", icon: "🏃", unit: "kg" },
  { value: "muscle_gain", label: "Ganhar Massa", icon: "💪", unit: "kg" },
  { value: "strength", label: "Força", icon: "🏋️", unit: "kg" },
  { value: "endurance", label: "Resistência", icon: "❤️", unit: "min" },
  { value: "flexibility", label: "Flexibilidade", icon: "🧘", unit: "cm" },
  { value: "custom", label: "Personalizado", icon: "⭐", unit: "" },
];

const MILESTONES = [25, 50, 75, 100];

export default function StudentGoals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({ name: "", type: "weight_loss", target_value: "", unit: "kg", deadline: "" });

  const { data: goals, isLoading } = useQuery({
    queryKey: ["my-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["my-badges-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_badges")
        .select("*, badges(*)")
        .eq("member_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createGoal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_goals").insert({
        user_id: user!.id,
        name: form.name,
        type: form.type,
        target_value: form.target_value ? Number(form.target_value) : null,
        unit: form.unit || null,
        deadline: form.deadline || null,
        current_value: 0,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      setShowForm(false);
      setForm({ name: "", type: "weight_loss", target_value: "", unit: "kg", deadline: "" });
      toast.success("Meta criada! 🎯");
    },
    onError: () => toast.error("Erro ao criar meta"),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, current_value }: { id: string; current_value: number }) => {
      const goal = goals?.find(g => g.id === id);
      const newStatus = goal?.target_value && current_value >= goal.target_value ? "completed" : "active";
      const { error } = await supabase
        .from("user_goals")
        .update({ current_value, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return { newStatus, goalName: goal?.name };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      if (result?.newStatus === "completed") {
        toast.success(`🏆 Meta "${result.goalName}" concluída!`);
      } else {
        toast.success("Progresso atualizado!");
      }
      setEditingGoal(null);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-goals"] });
      toast.success("Meta removida");
    },
  });

  const getProgress = (goal: Goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100));
  };

  const getMilestone = (progress: number) => {
    return MILESTONES.filter(m => progress >= m).length;
  };

  const activeGoals = goals?.filter(g => g.status === "active") ?? [];
  const completedGoals = goals?.filter(g => g.status === "completed") ?? [];

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Meus Objetivos</h1>
        </div>
        <Button variant="glow" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Nova Meta
        </Button>
      </div>

      {/* New Goal Form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 glow-purple animate-slide-up">
          <h3 className="text-sm font-semibold text-foreground">Nova Meta</h3>
          
          {/* Goal Type Grid */}
          <div className="grid grid-cols-3 gap-2">
            {GOAL_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, type: t.value, unit: t.unit, name: form.name || t.label })}
                className={`rounded-xl border p-3 text-center text-xs transition-all ${
                  form.type === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-lg block mb-1">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <input
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="Nome da meta"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder={`Meta (${form.unit})`}
              value={form.target_value}
              onChange={(e) => setForm({ ...form, target_value: e.target.value })}
            />
            <input
              type="date"
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="glow" className="flex-1" onClick={() => createGoal.mutate()} disabled={!form.name || createGoal.isPending}>
              {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Meta"}
            </Button>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Metas Ativas</h2>
              {activeGoals.map((goal) => {
                const progress = getProgress(goal);
                const milestoneCount = getMilestone(progress);
                return (
                  <div key={goal.id} className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{goal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {goal.current_value ?? 0} / {goal.target_value ?? "∞"} {goal.unit}
                            {goal.deadline && ` · até ${new Date(goal.deadline).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingGoal(goal)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteGoal.mutate(goal.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-purple transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">{progress}%</span>
                        {/* Milestones */}
                        <div className="flex gap-1">
                          {MILESTONES.map((m, i) => (
                            <div
                              key={m}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all ${
                                i < milestoneCount
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-secondary text-muted-foreground border-border"
                              }`}
                            >
                              {i < milestoneCount ? <Check className="w-3 h-3" /> : m}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Update Progress Inline */}
                    {editingGoal?.id === goal.id && (
                      <div className="flex gap-2 pt-2 border-t border-border animate-slide-up">
                        <input
                          type="number"
                          className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                          placeholder={`Valor atual (${goal.unit})`}
                          defaultValue={goal.current_value ?? 0}
                          id={`goal-input-${goal.id}`}
                        />
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`goal-input-${goal.id}`) as HTMLInputElement;
                            updateGoal.mutate({ id: goal.id, current_value: Number(input.value) });
                          }}
                        >
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Trophy className="w-4 h-4 inline mr-1 text-warning" />
                Concluídas ({completedGoals.length})
              </h2>
              {completedGoals.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.target_value} {goal.unit} atingido
                    </p>
                  </div>
                  <Trophy className="w-5 h-5 text-warning" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {(goals?.length ?? 0) === 0 && !showForm && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma meta criada ainda</p>
              <Button variant="glow" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Criar Primeira Meta
              </Button>
            </div>
          )}

          {/* Badges Section */}
          {(badges?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Flame className="w-4 h-4 inline mr-1 text-primary" />
                Badges Conquistados
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {badges?.map((mb: any) => (
                  <div key={mb.id} className="rounded-2xl border border-primary/20 bg-card p-4 text-center space-y-2 glow-purple">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{mb.badges?.title ?? "Badge"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
