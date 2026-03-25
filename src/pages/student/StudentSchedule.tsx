import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Dumbbell } from "lucide-react";
import { useMyWorkoutSessions } from "@/hooks/use-supabase-data";

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
  planned: { bg: "bg-primary/10 border-primary/20 text-primary", dot: "bg-primary", label: "Agendado" },
  done: { bg: "bg-success/10 border-success/20 text-success", dot: "bg-success", label: "Concluído" },
  missed: { bg: "bg-destructive/10 border-destructive/20 text-destructive", dot: "bg-destructive", label: "Perdido" },
};

export default function StudentSchedule() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: sessions, isLoading } = useMyWorkoutSessions();

  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const days = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const events = (sessions ?? []).filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const getEventsForDay = (day: number) =>
    events.filter(e => new Date(e.date).getDate() === day);

  return (
    <div className="px-5 pt-12 pb-6 max-w-lg mx-auto space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">Seu calendário de treinos</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonthOffset(o => o - 1)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground capitalize">{monthName}</span>
          <button onClick={() => setMonthOffset(o => o + 1)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((d) => (
            <span key={d} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider py-2">{d}</span>
          ))}
          {days.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const hasEvent = dayEvents.length > 0;
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const eventStatus = dayEvents[0]?.status;
            return (
              <div
                key={i}
                className={`relative h-10 flex items-center justify-center rounded-xl text-sm transition-all ${
                  !day ? "" :
                  isToday ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" :
                  hasEvent && eventStatus === "done" ? "bg-success/10 text-success font-medium" :
                  hasEvent && eventStatus === "missed" ? "bg-destructive/10 text-destructive font-medium" :
                  hasEvent ? "bg-primary/10 text-primary font-medium" :
                  "text-foreground hover:bg-secondary cursor-pointer"
                }`}
              >
                {day}
                {hasEvent && !isToday && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    eventStatus === "done" ? "bg-success" :
                    eventStatus === "missed" ? "bg-destructive" :
                    "bg-primary"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Sessões do Mês</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : events.length > 0 ? (
          <div className="space-y-2">
            {events.map((session) => {
              const d = new Date(session.date);
              const cfg = statusConfig[session.status] ?? statusConfig.planned;
              return (
                <div key={session.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${cfg.bg}`}>
                  <div className="w-12 h-12 rounded-xl bg-card/50 flex flex-col items-center justify-center shrink-0">
                    <p className="text-base font-bold leading-none">{d.getDate()}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{session.assigned_workouts?.workout_templates?.name ?? "Treino"}</p>
                    <p className="text-xs opacity-70 mt-0.5">{cfg.label}</p>
                  </div>
                  <Dumbbell className="w-4 h-4 opacity-50 shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma sessão neste mês</p>
          </div>
        )}
      </div>
    </div>
  );
}
