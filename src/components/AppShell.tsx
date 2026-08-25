import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Dumbbell, Flame, Home, Salad, UserRound, PersonStanding } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/run", label: "Run", icon: PersonStanding },
  { to: "/workout", label: "Lift", icon: Dumbbell },
  { to: "/nutrition", label: "Eat", icon: Salad },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/consistency", label: "OS", icon: Flame },
];

export function AppShell() {
  const location = useLocation();
  const isProfile = location.pathname === "/profile";

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#14301f_0%,#05070a_42%)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-ink shadow-[0_0_80px_rgba(62,224,127,0.08)]">
        <header className="flex items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-life">One Life</p>
            <h1 className="text-lg font-semibold leading-tight">Fitness OS</h1>
          </div>
          <NavLink
            to="/profile"
            className={`grid size-10 place-items-center rounded-full border ${
              isProfile ? "border-life bg-life/15 text-life" : "border-line bg-card text-fog"
            }`}
            aria-label="Profile"
          >
            <UserRound size={18} />
          </NavLink>
        </header>
        <main className="flex-1 overflow-y-auto px-4 pb-28">
          <Outlet />
        </main>
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line/80 bg-ink/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <div className="grid grid-cols-6">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] ${
                    isActive ? "text-life" : "text-fog"
                  }`
                }
              >
                <tab.icon size={18} />
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
