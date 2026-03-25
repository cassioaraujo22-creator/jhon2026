import { NavLink, useLocation } from "react-router-dom";
import { Home, Dumbbell, ShoppingBag, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useCallback } from "react";

const NAV_ITEMS = [
  { to: "/app", icon: Home, label: "Home" },
  { to: "/app/workouts", icon: Dumbbell, label: "Treinos" },
  { to: "__store__", icon: ShoppingBag, label: "Loja", isCenter: true },
  { to: "/app/schedule", icon: Calendar, label: "Agenda" },
  { to: "/app/profile", icon: User, label: "Perfil" },
];

const spring = { type: "spring" as const, stiffness: 500, damping: 30 };
const smoothEase = [0.25, 0.1, 0.25, 1] as const;

function isItemActive(to: string, pathname: string) {
  if (to === "__store__") return pathname === "/app/store";
  if (to === "/app") return pathname === "/app";
  return pathname.startsWith(to);
}

function getActiveIndex(pathname: string) {
  return NAV_ITEMS.findIndex((item) => isItemActive(item.to, pathname));
}

/* Simulated haptic */
function haptic() {
  if ("vibrate" in navigator) navigator.vibrate(8);
}

/* ─── Ripple Effect ─── */
function useRipple() {
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;width:0;height:0;
      border-radius:50%;background:hsl(258 82% 60% / 0.25);
      transform:translate(-50%,-50%);pointer-events:none;
      animation:nav-ripple 500ms ease-out forwards;
    `;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 520);
  }, []);
  return { ref, trigger };
}

/* ─── Regular Nav Item ─── */
function NavItem({ item, active }: { item: typeof NAV_ITEMS[0]; active: boolean }) {
  const { ref, trigger } = useRipple();

  return (
    <NavLink
      to={item.to}
      onClick={haptic}
      className="relative flex flex-col items-center justify-center w-14 outline-none"
    >
      <div ref={ref} className="relative overflow-hidden rounded-2xl p-2" onPointerDown={trigger}>
        <motion.div
          className="flex flex-col items-center gap-0.5"
          animate={{
            y: active ? -4 : 0,
            scale: active ? 1.12 : 1,
          }}
          transition={{ ...spring, stiffness: 400 }}
        >
          <item.icon
            className="w-[22px] h-[22px] transition-colors duration-200"
            style={{
              color: active ? "hsl(258 82% 65%)" : "hsl(225 15% 45%)",
              filter: active ? "drop-shadow(0 0 6px hsl(258 82% 60% / 0.5))" : "none",
            }}
          />
          <motion.span
            className="text-[10px] font-semibold leading-none"
            animate={{ opacity: active ? 1 : 0.55 }}
            style={{ color: active ? "hsl(258 82% 65%)" : "hsl(225 15% 45%)" }}
          >
            {item.label}
          </motion.span>
        </motion.div>
      </div>
    </NavLink>
  );
}

/* ─── Center FAB ─── */
function CenterFab({ active }: { active: boolean }) {
  const { ref, trigger } = useRipple();

  return (
    <NavLink
      to="/app/store"
      onClick={haptic}
      className="relative flex flex-col items-center -mt-8 outline-none"
    >
      {/* Outer glow */}
      <motion.span
        className="absolute top-0 w-20 h-20 rounded-full pointer-events-none"
        animate={{ opacity: active ? 0.7 : 0.3 }}
        style={{
          background: "radial-gradient(circle, hsl(258 82% 60% / 0.3) 0%, transparent 70%)",
        }}
      />

      {/* FAB */}
      <motion.div
        ref={ref}
        onPointerDown={trigger}
        className="relative z-10 flex items-center justify-center w-[60px] h-[60px] rounded-[22px] overflow-hidden cursor-pointer"
        style={{
          background: "linear-gradient(135deg, hsl(258 82% 58%), hsl(280 75% 52%))",
          boxShadow: active
            ? "0 8px 30px hsl(258 82% 60% / 0.55), 0 0 0 2px hsl(258 82% 60% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.12)"
            : "0 6px 24px hsl(258 82% 60% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.1)",
        }}
        animate={{
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileTap={{ scale: [0.92, 1.08, 1], transition: { duration: 0.35, ease: smoothEase } }}
        whileHover={{ scale: 1.06, transition: { duration: 0.2 } }}
      >
        {/* Inner shine */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, hsl(0 0% 100% / 0.15) 0%, transparent 50%)",
            borderRadius: "inherit",
          }}
        />
        <ShoppingBag className="w-7 h-7 text-white relative z-10" />
      </motion.div>

      <motion.span
        className="text-[10px] font-bold mt-1"
        animate={{ opacity: active ? 1 : 0.6 }}
        style={{ color: active ? "hsl(258 82% 65%)" : "hsl(225 15% 45%)" }}
      >
        Loja
      </motion.span>
    </NavLink>
  );
}

/* ─── Sliding Active Pill ─── */
function ActivePill({ activeIndex }: { activeIndex: number }) {
  if (activeIndex === 2 || activeIndex < 0) return null;

  // 5 items with justify-around: centers at ~10%, 30%, 50%, 70%, 90%
  const percentages = [10, 30, 0, 70, 90];
  const pct = percentages[activeIndex];
  if (!pct) return null;

  return (
    <motion.div
      className="absolute -bottom-0.5 h-[3px] w-8 rounded-full pointer-events-none"
      style={{
        background: "linear-gradient(90deg, hsl(258 82% 60%), hsl(280 80% 55%))",
        boxShadow: "0 0 12px hsl(258 82% 60% / 0.6)",
      }}
      animate={{ left: `calc(${pct}% - 16px)` }}
      transition={{ ...spring, stiffness: 350 }}
    />
  );
}

/* ─── Main Component ─── */
export default function PremiumBottomNavigation() {
  const location = useLocation();
  const activeIndex = getActiveIndex(location.pathname);

  return (
    <>
      {/* Ripple animation keyframes (injected once) */}
      <style>{`
        @keyframes nav-ripple {
          to { width: 120px; height: 120px; opacity: 0; }
        }
      `}</style>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md px-3 pb-3 pb-safe">
          <motion.div
            className="relative flex items-end justify-around rounded-[28px] px-1 pt-3 pb-2.5"
            style={{
              background: "linear-gradient(135deg, hsl(225 28% 9% / 0.88) 0%, hsl(225 25% 7% / 0.94) 50%, hsl(230 22% 10% / 0.88) 100%)",
              backdropFilter: "blur(32px) saturate(1.6)",
              WebkitBackdropFilter: "blur(32px) saturate(1.6)",
              border: "1px solid hsl(258 82% 60% / 0.08)",
              boxShadow: `
                0 -2px 40px hsl(225 30% 4% / 0.7),
                0 0 0 0.5px hsl(0 0% 100% / 0.04),
                inset 0 1px 0 hsl(0 0% 100% / 0.04),
                inset 0 0 20px hsl(258 82% 60% / 0.03)
              `,
            }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
          >
            {/* Sliding pill indicator */}
            <ActivePill activeIndex={activeIndex} />

            {NAV_ITEMS.map((item, i) => {
              const active = isItemActive(item.to, location.pathname);

              if (item.isCenter) {
                return <CenterFab key="center" active={active} />;
              }

              return <NavItem key={item.to} item={item} active={active} />;
            })}
          </motion.div>
        </div>
      </nav>
    </>
  );
}
