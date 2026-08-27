import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Dumbbell, Flame, Home, Plus, Salad, UserRound, PersonStanding } from "lucide-react";
import { BackButton } from "./BackButton";
import { ToastHost } from "./ToastHost";
import { publicAsset } from "../lib/githubPagesPath";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/run", label: "Run", icon: PersonStanding },
  { to: "/workout", label: "Lift", icon: Dumbbell },
  { to: "/nutrition", label: "Eat", icon: Salad },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/consistency", label: "OS", icon: Flame },
];

const NESTED: Record<string, { parent: string; title: string }> = {
  "/profile": { parent: "/", title: "Profile" },
  "/integrations": { parent: "/profile", title: "Integrations" },
  "/workout/gallery": { parent: "/workout", title: "Exercise Gallery" },
};

export function AppShell() {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isProfile = path === "/profile";
  const nested = NESTED[path];

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,#14301f_0%,#05070a_42%)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden bg-ink shadow-[0_0_80px_rgba(62,224,127,0.08)]">
        <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-3">
            {nested ? <BackButton fallback={nested.parent} iconOnly /> : null}
            <img
              src={publicAsset("logo.png")}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-xl object-contain"
            />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-life">One Life</p>
              <h1 className="text-lg font-semibold leading-tight">{nested?.title ?? "Fitness OS"}</h1>
            </div>
          </div>
          <NavLink
            to="/profile"
            className={`tap-scale grid size-10 place-items-center rounded-full border transition-colors ${
              isProfile ? "border-life bg-life/15 text-life" : "border-line bg-card text-snow"
            }`}
            aria-label="Profile"
          >
            <UserRound size={18} />
          </NavLink>
        </header>
        <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28">
          <div key={path} className="animate-page">
            <Outlet />
          </div>
        </main>
        <ToastHost />
        {path === "/nutrition" ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("one-life-log-food"))}
            className="fixed z-[45] grid size-16 place-items-center rounded-full bg-eat text-ink shadow-[0_10px_28px_rgba(255,200,87,0.55)]"
            style={{
              right: "max(1rem, calc(50% - 215px + 1rem))",
              bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
            }}
            aria-label="Log food"
          >
            <Plus size={30} strokeWidth={2.75} />
          </button>
        ) : null}
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-line/80 bg-ink/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <div className="grid grid-cols-6">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `tap-scale flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] transition-colors ${
                    isActive ? "bg-life/10 text-life" : "text-snow"
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
