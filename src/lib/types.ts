export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";

export type IntegrationId = "apple-health" | "health-connect" | "strava" | "garmin";

export type ActivitySource = "manual" | IntegrationId;

export type Integration = {
  id: IntegrationId;
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
};

export type SyncEvent = {
  id: string;
  at: string;
  source: IntegrationId | "system";
  kind: "steps" | "run" | "info" | "error";
  message: string;
};

export type Priorities = {
  running: boolean;
  strength: boolean;
  nutrition: boolean;
  steps: boolean;
  mobility: boolean;
};

export type GoalMode = "balanced" | "marathon" | "strength" | "cut";

export type Profile = {
  name: string;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  stepGoal: number;
  goalMode: GoalMode;
  priorities: Priorities;
  startWeightKg?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
};

export type SportKind = "run" | "walk";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type RoutePlan = {
  id: string;
  name: string;
  kind: SportKind;
  points: GeoPoint[];
  distanceKm: number;
  preset?: boolean;
};

export type RunLog = {
  id: string;
  date: string;
  time: string;
  distanceKm: number;
  durationSec: number;
  calories: number;
  notes?: string;
  source?: ActivitySource;
  externalId?: string;
  kind?: SportKind;
  routeId?: string;
  path?: GeoPoint[];
};

export type WorkoutSet = {
  reps: number;
  kg: number;
};

export type WorkoutExercise = {
  name: string;
  sets: WorkoutSet[];
  targetSets?: number;
  targetReps?: string;
};

export type WorkoutLog = {
  id: string;
  date: string;
  time: string;
  template: string;
  durationMin: number;
  exercises: WorkoutExercise[];
};

export type FoodLog = {
  id: string;
  date: string;
  time: string;
  meal: MealType;
  name: string;
  foodId?: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type SavedMealItem = {
  foodId: string;
  grams: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  emoji: string;
  items: SavedMealItem[];
};

export type RecentFood = {
  foodId: string;
  grams: number;
  at: string;
};

export type StepLog = {
  date: string;
  steps: number;
};

export type WeightLog = {
  date: string;
  kg: number;
};

export type StravaAuth = {
  athleteId: number;
  athleteName?: string;
  accessToken: string;
  refreshToken: string;
  /** Unix seconds */
  expiresAt: number;
};

export type AppState = {
  profile: Profile;
  runs: RunLog[];
  workouts: WorkoutLog[];
  foods: FoodLog[];
  steps: StepLog[];
  weightLogs: WeightLog[];
  integrations: Integration[];
  autoSync: boolean;
  syncLog: SyncEvent[];
  favoriteFoodIds: string[];
  recentFoods: RecentFood[];
  savedMeals: SavedMeal[];
  savedRoutes: RoutePlan[];
  strava?: StravaAuth;
};

export type DayParts = {
  movement: number;
  training: number;
  nutrition: number;
  activity: number;
};

export type DayPartsMax = DayParts;

export type DaySummary = {
  date: string;
  runKm: number;
  runDurationSec: number;
  workoutCount: number;
  workoutSets: number;
  workoutMinutes: number;
  workoutName?: string;
  mealsLogged: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
  score: number;
  parts: DayParts;
  partsMax: DayPartsMax;
  max: number;
};
