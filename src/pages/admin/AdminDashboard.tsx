import { Users, DollarSign, TrendingDown, ArrowUpRight, UserPlus, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useGymStats, useGymMemberships, useGymPayments, useGymAccessLogs } from "@/hooks/use-supabase-data";

export default function AdminDashboard() {
  const { data: gymStats, isLoading } = useGymStats();
  const { data: memberships } = useGymMemberships();
  const { data: payments } = useGymPayments();
  const { data: accessLogs } = useGymAccessLogs();

  // Compute revenue chart from payments
  const revenueByMonth: Record<string, number> = {};
  (payments ?? []).filter(p => p.status === "paid").forEach(p => {
    const month = p.created_at?.slice(0, 7) ?? "";
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + (p.amount_cents ?? 0);
  });
  const revenueData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, value]) => ({
      month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
      value: value / 100,
    }));

  // Access logs by weekday
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const accessByDay = weekdays.map(day => ({ day, entries: 0 }));
  (accessLogs ?? []).forEach(log => {
    const d = new Date(log.event_time).getDay();
    if (log.decision === "allow") accessByDay[d].entries++;
  });

  // Plans breakdown
  const planCounts: Record<string, number> = {};
  (memberships ?? []).forEach(m => {
    const name = (m as any).plans?.name ?? "Outro";
    planCounts[name] = (planCounts[name] ?? 0) + 1;
  });
  const maxPlan = Math.max(...Object.values(planCounts), 1);
  const planColors = ["hsl(258, 82%, 60%)", "hsl(152, 60%, 50%)", "hsl(210, 90%, 60%)", "hsl(38, 92%, 60%)", "hsl(225, 15%, 55%)"];

  // Recent members
  const recentMembers = (memberships ?? [])
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  const stats = [
    { label: "Alunos Ativos", value: String(gymStats?.activeMembers ?? 0), icon: Users },
    { label: "Receita Mensal", value: `R$ ${((gymStats?.revenue ?? 0) / 100).toLocaleString("pt-BR")}`, icon: DollarSign },
    { label: "Novos Cadastros", value: String(gymStats?.newThisMonth ?? 0), icon: UserPlus },
    { label: "Total Membros", value: String(gymStats?.totalMemberships ?? 0), icon: TrendingDown },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Receita</h3>
            <span className="text-xs text-muted-foreground">Últimos meses</span>
          </div>
          <div className="h-64">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(258, 82%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(258, 82%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" />
                  <XAxis dataKey="month" stroke="hsl(225, 15%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(225, 15%, 55%)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(225, 25%, 9%)", border: "1px solid hsl(225, 20%, 16%)", borderRadius: "12px", color: "hsl(220, 20%, 95%)" }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, "Receita"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(258, 82%, 60%)" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados de receita</div>
            )}
          </div>
        </div>

        {/* Access Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Acessos na Catraca</h3>
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accessByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" />
                <XAxis dataKey="day" stroke="hsl(225, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(225, 15%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(225, 25%, 9%)", border: "1px solid hsl(225, 20%, 16%)", borderRadius: "12px", color: "hsl(220, 20%, 95%)" }}
                />
                <Bar dataKey="entries" fill="hsl(258, 82%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plans Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Alunos por Plano</h3>
          <div className="space-y-3">
            {Object.entries(planCounts).map(([name, count], i) => (
              <div key={name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxPlan) * 100}%`, backgroundColor: planColors[i % planColors.length] }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(planCounts).length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados</p>
            )}
          </div>
        </div>

        {/* Recent Members */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Membros Recentes</h3>
          <div className="space-y-3">
            {recentMembers.map((member: any) => {
              const name = member.profiles?.name ?? "—";
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{member.plans?.name ?? "—"}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    member.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}>
                    {member.status === "active" ? "Ativo" : "Pendente"}
                  </span>
                </div>
              );
            })}
            {recentMembers.length === 0 && <p className="text-sm text-muted-foreground">Sem membros</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
