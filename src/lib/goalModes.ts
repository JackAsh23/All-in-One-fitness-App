import type { GoalMode, Priorities } from "./types";

export type GoalModeMeta = {
  id: GoalMode;
  label: string;
  emoji: string;
  blurb: string;
  priorities: Priorities;
};

export const GOAL_MODES: GoalModeMeta[] = [
  {
    id: "balanced",
    label: "Balanced",
    emoji: "⚖️",
    blurb: "Run, lift, eat, and move — the full One Life stack.",
    priorities: { running: true, strength: true, nutrition: true, steps: true, mobility: false },
  },
  {
    id: "marathon",
    label: "Marathon block",
    emoji: "🏃",
    blurb: "Mileage and recovery matter. Bench days won't tank your score.",
    priorities: { running: true, strength: false, nutrition: true, steps: true, mobility: false },
  },
  {
    id: "strength",
    label: "Strength focus",
    emoji: "💪",
    blurb: "Hypertrophy season. Running optional — training and protein lead.",
    priorities: { running: false, strength: true, nutrition: true, steps: false, mobility: false },
  },
  {
    id: "cut",
    label: "Cut phase",
    emoji: "🍱",
    blurb: "Nutrition first. Light cardio and steps keep the deficit honest.",
    priorities: { running: true, strength: true, nutrition: true, steps: true, mobility: false },
  },
];

export function goalModeMeta(id: GoalMode) {
  return GOAL_MODES.find((mode) => mode.id === id) ?? GOAL_MODES[0];
}
