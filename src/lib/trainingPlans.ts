export type PlanExercise = {
  name: string;
  sets: number;
  reps: string;
};

export type PlanDay = {
  weekday: number;
  label: string;
  title: string;
  focus: string;
  exercises: PlanExercise[];
};

export type TrainingPlan = {
  id: string;
  name: string;
  blurb: string;
  daysPerWeek: number;
  days: PlanDay[];
  custom?: boolean;
};

export const WEEKDAYS = [
  { weekday: 1, label: "Mon" },
  { weekday: 2, label: "Tue" },
  { weekday: 3, label: "Wed" },
  { weekday: 4, label: "Thu" },
  { weekday: 5, label: "Fri" },
  { weekday: 6, label: "Sat" },
  { weekday: 0, label: "Sun" },
] as const;

export function resolvePlan(id: string | undefined, custom: TrainingPlan[] = []): TrainingPlan | null {
  if (!id) return null;
  return custom.find((item) => item.id === id) ?? TRAINING_PLANS.find((item) => item.id === id) ?? null;
}

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    blurb: "Six days. Classic hypertrophy split with prescribed sets.",
    daysPerWeek: 6,
    days: [
      {
        weekday: 1,
        label: "Mon",
        title: "Pull A",
        focus: "Back & biceps",
        exercises: [
          { name: "Pull-up", sets: 3, reps: "5" },
          { name: "Barbell Row", sets: 4, reps: "8" },
          { name: "Lat Pulldown", sets: 3, reps: "10" },
          { name: "Face Pull", sets: 3, reps: "15" },
          { name: "Hammer Curl", sets: 3, reps: "10" },
        ],
      },
      {
        weekday: 2,
        label: "Tue",
        title: "Push A",
        focus: "Chest, shoulders, triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "6" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "10" },
          { name: "Overhead Press", sets: 3, reps: "8" },
          { name: "Lateral Raise", sets: 3, reps: "15" },
          { name: "Tricep Pushdown", sets: 3, reps: "12" },
        ],
      },
      {
        weekday: 3,
        label: "Wed",
        title: "Legs A",
        focus: "Quads, glutes, hamstrings",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "6" },
          { name: "Romanian Deadlift", sets: 3, reps: "8" },
          { name: "Walking Lunge", sets: 3, reps: "10" },
          { name: "Leg Press", sets: 3, reps: "12" },
          { name: "Calf Raise", sets: 4, reps: "12" },
        ],
      },
      {
        weekday: 4,
        label: "Thu",
        title: "Pull B",
        focus: "Width & arms",
        exercises: [
          { name: "Deadlift", sets: 3, reps: "5" },
          { name: "One Arm Dumbbell Row", sets: 3, reps: "10" },
          { name: "Lat Pulldown", sets: 3, reps: "12" },
          { name: "Face Pull", sets: 3, reps: "15" },
          { name: "Dumbbell Curl", sets: 3, reps: "12" },
        ],
      },
      {
        weekday: 5,
        label: "Fri",
        title: "Push B",
        focus: "Pressing volume",
        exercises: [
          { name: "Overhead Press", sets: 4, reps: "6" },
          { name: "Dumbbell Bench Press", sets: 3, reps: "10" },
          { name: "Cable Fly", sets: 3, reps: "12" },
          { name: "Lateral Raise", sets: 3, reps: "15" },
          { name: "Skull Crusher", sets: 3, reps: "10" },
        ],
      },
      {
        weekday: 6,
        label: "Sat",
        title: "Legs B",
        focus: "Posterior chain",
        exercises: [
          { name: "Romanian Deadlift", sets: 4, reps: "6" },
          { name: "Back Squat", sets: 3, reps: "8" },
          { name: "Walking Lunge", sets: 3, reps: "12" },
          { name: "Calf Raise", sets: 4, reps: "15" },
          { name: "Plank", sets: 3, reps: "45s" },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    blurb: "Four days. Strength first, accessories after.",
    daysPerWeek: 4,
    days: [
      {
        weekday: 1,
        label: "Mon",
        title: "Upper A",
        focus: "Press & pull",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "5" },
          { name: "Barbell Row", sets: 4, reps: "6" },
          { name: "Overhead Press", sets: 3, reps: "8" },
          { name: "Lat Pulldown", sets: 3, reps: "10" },
          { name: "Dumbbell Curl", sets: 2, reps: "12" },
        ],
      },
      {
        weekday: 2,
        label: "Tue",
        title: "Lower A",
        focus: "Squat day",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "5" },
          { name: "Romanian Deadlift", sets: 3, reps: "8" },
          { name: "Walking Lunge", sets: 3, reps: "10" },
          { name: "Calf Raise", sets: 3, reps: "12" },
        ],
      },
      {
        weekday: 4,
        label: "Thu",
        title: "Upper B",
        focus: "Volume upper",
        exercises: [
          { name: "Pull-up", sets: 3, reps: "6" },
          { name: "Dumbbell Bench Press", sets: 3, reps: "10" },
          { name: "One Arm Dumbbell Row", sets: 3, reps: "10" },
          { name: "Lateral Raise", sets: 3, reps: "15" },
          { name: "Tricep Pushdown", sets: 3, reps: "12" },
        ],
      },
      {
        weekday: 5,
        label: "Fri",
        title: "Lower B",
        focus: "Hinge day",
        exercises: [
          { name: "Deadlift", sets: 3, reps: "5" },
          { name: "Back Squat", sets: 3, reps: "8" },
          { name: "Leg Press", sets: 3, reps: "12" },
          { name: "Calf Raise", sets: 4, reps: "12" },
        ],
      },
    ],
  },
  {
    id: "full-body",
    name: "Full body 3×",
    blurb: "Monday / Wednesday / Friday. One compound per pattern.",
    daysPerWeek: 3,
    days: [
      {
        weekday: 1,
        label: "Mon",
        title: "Full A",
        focus: "Squat + press",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "5" },
          { name: "Barbell Bench Press", sets: 3, reps: "8" },
          { name: "Barbell Row", sets: 3, reps: "8" },
          { name: "Plank", sets: 3, reps: "45s" },
        ],
      },
      {
        weekday: 3,
        label: "Wed",
        title: "Full B",
        focus: "Hinge + pull",
        exercises: [
          { name: "Deadlift", sets: 3, reps: "5" },
          { name: "Overhead Press", sets: 3, reps: "8" },
          { name: "Pull-up", sets: 3, reps: "6" },
          { name: "Walking Lunge", sets: 3, reps: "10" },
        ],
      },
      {
        weekday: 5,
        label: "Fri",
        title: "Full C",
        focus: "Accessories",
        exercises: [
          { name: "Dumbbell Bench Press", sets: 3, reps: "10" },
          { name: "One Arm Dumbbell Row", sets: 3, reps: "10" },
          { name: "Romanian Deadlift", sets: 3, reps: "8" },
          { name: "Lateral Raise", sets: 3, reps: "15" },
        ],
      },
    ],
  },
];

export function planDayForDate(plan: TrainingPlan, iso: string) {
  const weekday = new Date(`${iso}T12:00:00`).getDay();
  return plan.days.find((day) => day.weekday === weekday) ?? null;
}

export function todayPlanDay(plan: TrainingPlan, iso: string) {
  return planDayForDate(plan, iso);
}
