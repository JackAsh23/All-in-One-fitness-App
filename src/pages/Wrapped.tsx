import { Link } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { buildYearWrapped } from "../lib/consistency";
import { formatLongDate } from "../lib/dates";
import { useAppState } from "../lib/store";

export function WrappedPage() {
  const state = useAppState();
  const year = new Date().getFullYear();
  const wrapped = buildYearWrapped(state, year);

  const slides = [
    {
      bg: "from-life/30 to-ink",
      title: `${year} in One Life`,
      body: `${state.profile.name}'s fitness year — the GitHub graph for your body.`,
    },
    {
      bg: "from-run/25 to-ink",
      title: `${wrapped.totalKm} km ran`,
      body: "Every morning jog, every synced Strava effort — mileage adds up.",
    },
    {
      bg: "from-lift/25 to-ink",
      title: `${wrapped.totalWorkouts} workouts`,
      body: "Sessions logged, sets counted, progressive overload tracked.",
    },
    {
      bg: "from-step/20 to-ink",
      title: `${wrapped.totalSteps.toLocaleString()} steps`,
      body: "Walking meetings, commute strides, and wearable sync combined.",
    },
    {
      bg: "from-eat/25 to-ink",
      title: `${wrapped.daysLogged} days of food logged`,
      body: `Protein goal hit ${wrapped.proteinGoalDays} times. Top fuel: ${wrapped.topFood}.`,
    },
    {
      bg: "from-life/20 to-ink",
      title: `${wrapped.avgScore}% avg consistency`,
      body: `Strongest month: ${wrapped.bestMonth} (${wrapped.bestMonthScore}%). Longest streak: ${wrapped.longestStreak} days.`,
    },
    {
      bg: "from-heat-4/30 to-ink",
      title: `Best day: ${wrapped.hottestScore}%`,
      body: formatLongDate(wrapped.hottestDay) + " — everything clicked.",
    },
    {
      bg: "from-card to-ink-2",
      title: "Keep the streak alive",
      body: "Your heatmap is your identity. See you tomorrow on the graph.",
    },
  ];

  return (
    <div className="min-h-dvh bg-ink">
      <div className="mx-auto max-w-[430px]">
        <div className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2">
            <BackButton fallback="/consistency" />
            <p className="text-xs uppercase tracking-[0.2em] text-life">One Life Wrapped</p>
          </div>
        </div>
        <div className="space-y-4 px-4 pb-10 pt-2">
          {slides.map((slide, index) => (
            <section
              key={index}
              className={`animate-pop min-h-[420px] rounded-3xl bg-gradient-to-br ${slide.bg} border border-line/50 p-6 flex flex-col justify-end`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-fog">#{index + 1}</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">{slide.title}</h2>
              <p className="mt-3 text-sm text-fog leading-relaxed">{slide.body}</p>
            </section>
          ))}
          <Link
            to="/consistency"
            className="block rounded-3xl bg-life py-3 text-center font-semibold text-ink"
          >
            Back to Consistency OS
          </Link>
        </div>
      </div>
    </div>
  );
}
