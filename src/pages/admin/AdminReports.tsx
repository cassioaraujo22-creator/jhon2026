import { Loader2, Users, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useGymMemberships, useGymPayments, useGymAccessLogs } from "@/hooks/use-supabase-data";

const COLORS = ["hsl(258, 82%, 60%)", "hsl(152, 60%, 50%)", "hsl(210, 90%, 60%)", "hsl(38, 92%, 60%)", "hsl(0, 70%, 55%)"];

export default function AdminReports() {
  const { data: memberships, isLoading: l1 } = useGymMemberships();
  const { data: payments, isLoading: l2 } = useGymPayments();
  const { data: accessLogs, isLoading: l3 } = useGymAccessLogs();

  if (l1 || l2 || l3) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  // Revenue by month
  const revenueByMonth: Record<string, number> = {};
  (payments ?? []).filter(p => p.status === "paid").forEach(p => {
    const month = p.created_at?.slice(0, 7) ?? "";
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + (p.amount_cents ?? 0);
  });
  const revenueData = Object.entries(revenueByMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, value]) => ({
    month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    value: value / 100,
  }));

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  (memberships ?? []).forEach(m => { statusCounts[m.status] = (statusCounts[m.status] ?? 0) + 1; });
  const statusLabels: Record<string, string> = { active: "Ativos", paused: "Pausados", cancelled: "Cancelados", expired: "Expirados" };
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({ name: statusLabels[status] ?? status, value: count }));

  // Plan distribution
  const planCounts: Record<string, number> = {};
  (memberships ?? []).forEach(m => { const name = (m as any).plans?.name ?? "Sem plano"; planCounts[name] = (planCounts[name] ?? 0) + 1; });
  const planData = Object.entries(planCounts).map(([name, count]) => ({ name, count }));

  // Summary
  const totalRevenue = (payments ?? []).filter(p => p.status === "paid").reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const activeCount = statusCounts["active"] ?? 0;
  const churnCount = (statusCounts["cancelled"] ?? 0) + (statusCounts["expired"] ?? 0);
  const totalAccess = accessLogs?.length ?? 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-bold text-foreground">Relatórios</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Total", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-success" },
          { label: "Membros Ativos", value: String(activeCount), icon: Users, color: "text-primary" },
          { label: "Churn", value: String(churnCount), icon: TrendingUp, color: "text-destructive" },
          { label: "Acessos Hoje", value: String(totalAccess), icon: Calendar, color: "text-info" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Receita Mensal</h3>
          <div className="h-64">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" />
                  <XAxis dataKey="month" stroke="hsl(225, 15%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(225, 15%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(225, 25%, 9%)", border: "1px solid hsl(225, 20%, 16%)", borderRadius: "12px", color: "hsl(220, 20%, 95%)" }} formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Receita"]} />
                  <Bar dataKey="value" fill="hsl(258, 82%, 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Status dos Membros</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(225, 25%, 9%)", border: "1px solid hsl(225, 20%, 16%)", borderRadius: "12px", color: "hsl(220, 20%, 95%)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>}
          </div>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Alunos por Plano</h3>
        <div className="h-48">
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" />
                <XAxis type="number" stroke="hsl(225, 15%, 55%)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(225, 15%, 55%)" fontSize={12} width={120} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(225, 25%, 9%)", border: "1px solid hsl(225, 20%, 16%)", borderRadius: "12px", color: "hsl(220, 20%, 95%)" }} />
                <Bar dataKey="count" fill="hsl(152, 60%, 50%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>}
        </div>
      </div>
    </div>
  );
}
