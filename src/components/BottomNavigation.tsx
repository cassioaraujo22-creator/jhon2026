import { NavLink, useLocation } from "react-router-dom";
import { Home, Dumbbell, ShoppingBag, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/app/workouts", icon: Dumbbell, label: "Treinos" },
  { to: "__store__", icon: ShoppingBag, label: "Loja", isCenter: true },
  { to: "/app/schedule", icon: Calendar, label: "Agenda" },
  { to: "/app/profile", icon: User, label: "Perfil" },
];

export default function BottomNavigation() {
  const location = useLocation();
  const [fabPressed, setFabPressed] = useState(false);

  const isActive = (to: string) => {
    if (to === "__store__") return location.pathname === "/app/store";
    if (to === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
      <div
        className="pointer-events-auto flex items-end justify-around w-full max-w-md mx-4 mb-3 rounded-3xl px-2 pt-2 pb-2"
        style={{
          background: "linear-gradient(145deg, hsl(225 25% 10% / 0.92), hsl(225 30% 6% / 0.96))",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid hsl(258 82% 60% / 0.12)",
          boxShadow: "0 -4px 32px hsl(225 30% 4% / 0.6), 0 0 0 1px hsl(258 82% 60% / 0.06)",
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.to);

          if (item.isCenter) {
            return (
              <NavLink
                key={item.to}
                to="/app/store"
                className="flex flex-col items-center -mt-6 relative"
                onClick={() => {
                  setFabPressed(true);
                  setTimeout(() => setFabPressed(false), 400);
                }}
              >
                {/* Glow ring behind */}
                <span
                  className={cn(
                    "absolute top-1 w-16 h-16 rounded-full transition-opacity duration-500",
                    active ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: "radial-gradient(circle, hsl(258 82% 60% / 0.35) 0%, transparent 70%)",
                  }}
                />

                {/* FAB button */}
                <span
                  className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                    fabPressed ? "scale-90" : "scale-100 hover:scale-105",
                    active ? "glow-purple-strong" : "glow-purple"
                  )}
                  style={{
                    background: "linear-gradient(135deg, hsl(258 82% 60%), hsl(280 80% 55%))",
                    boxShadow: active
                      ? "0 8px 32px hsl(258 82% 60% / 0.5), 0 0 0 2px hsl(258 82% 60% / 0.2)"
                      : "0 4px 20px hsl(258 82% 60% / 0.3)",
                  }}
                >
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </span>

                <span
                  className={cn(
                    "text-[10px] font-semibold mt-1 transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 relative group"
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary animate-scale-in" />
              )}

              <item.icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  active
                    ? "text-primary drop-shadow-[0_0_8px_hsl(258,82%,60%)]"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  active ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
