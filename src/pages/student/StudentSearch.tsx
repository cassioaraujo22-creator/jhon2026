import { Search as SearchIcon, Star, Filter, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const categories = ["Todos", "Coaches"];

export default function StudentSearch() {
  const [active, setActive] = useState("Todos");
  const [query, setQuery] = useState("");
  const { profile } = useAuth();

  const { data: coaches, isLoading } = useQuery({
    queryKey: ["search-coaches", profile?.gym_id],
    enabled: !!profile?.gym_id,
    queryFn: async () => {
      // Get coach user_ids from user_roles for this gym
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("gym_id", profile!.gym_id!)
        .eq("role", "coach");

      if (!roles?.length) return [];

      const coachIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", coachIds);

      return profiles ?? [];
    },
  });

  const filteredCoaches = (coaches ?? []).filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-5 pt-14 pb-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Buscar</h1>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Coaches, aulas, unidades..."
          className="w-full h-12 rounded-xl bg-secondary border border-border pl-11 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 text-primary">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2">
        {categories.map((cat) => (
          <Button key={cat} variant={active === cat ? "pill-active" : "pill"} size="pill" onClick={() => setActive(cat)}>
            {cat}
          </Button>
        ))}
      </div>

      {/* Coaches */}
      {(active === "Todos" || active === "Coaches") && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Coaches</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : filteredCoaches.length > 0 ? (
            filteredCoaches.map((coach) => {
              const initials = coach.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?";
              return (
                <div key={coach.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{coach.name}</p>
                    <p className="text-xs text-muted-foreground">{coach.email}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum coach encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
