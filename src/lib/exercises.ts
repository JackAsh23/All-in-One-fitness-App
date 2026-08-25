export type WorkoutTemplate = {
  id: string;
  name: string;
  blurb: string;
  exercises: string[];
};

export const TEMPLATES: WorkoutTemplate[] = [
  {
    id: "upper",
    name: "Upper Body",
    blurb: "Push + pull for chest, back, and arms",
    exercises: [
      "Dumbbell Bench Press",
      "One Arm Dumbbell Row",
      "Overhead Press",
      "Lat Pulldown",
      "Dumbbell Curl",
      "Tricep Pushdown",
    ],
  },
  {
    id: "lower",
    name: "Lower Body",
    blurb: "Squats, hinges, and legs",
    exercises: ["Back Squat", "Romanian Deadlift", "Walking Lunge", "Leg Press", "Calf Raise"],
  },
  {
    id: "push",
    name: "Push",
    blurb: "Chest, shoulders, triceps",
    exercises: ["Barbell Bench Press", "Incline Dumbbell Press", "Overhead Press", "Cable Fly", "Lateral Raise", "Skull Crusher"],
  },
  {
    id: "pull",
    name: "Pull",
    blurb: "Back, rear delts, biceps",
    exercises: ["Deadlift", "Barbell Row", "Lat Pulldown", "Face Pull", "Hammer Curl"],
  },
  {
    id: "full",
    name: "Full Body",
    blurb: "One of everything, done well",
    exercises: ["Back Squat", "Dumbbell Bench Press", "One Arm Dumbbell Row", "Romanian Deadlift", "Overhead Press"],
  },
  {
    id: "calisthenics",
    name: "Calisthenics",
    blurb: "No machines required",
    exercises: ["Pull-up", "Push-up", "Dip", "Bodyweight Squat", "Plank"],
  },
  {
    id: "custom",
    name: "Custom Workout",
    blurb: "Build it as you go",
    exercises: [],
  },
];

export const EXERCISE_CATALOG = [
  "Dumbbell Bench Press",
  "Barbell Bench Press",
  "Incline Dumbbell Press",
  "One Arm Dumbbell Row",
  "Barbell Row",
  "Lat Pulldown",
  "Pull-up",
  "Overhead Press",
  "Lateral Raise",
  "Face Pull",
  "Dumbbell Curl",
  "Hammer Curl",
  "Tricep Pushdown",
  "Skull Crusher",
  "Dip",
  "Push-up",
  "Back Squat",
  "Bodyweight Squat",
  "Romanian Deadlift",
  "Deadlift",
  "Walking Lunge",
  "Leg Press",
  "Calf Raise",
  "Plank",
  "Cable Fly",
];
