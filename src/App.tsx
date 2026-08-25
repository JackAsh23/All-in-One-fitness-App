import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ConsistencyPage } from "./pages/Consistency";
import { HomePage } from "./pages/Home";
import { NutritionPage } from "./pages/Nutrition";
import { AnalyticsPage } from "./pages/Analytics";
import { IntegrationsPage } from "./pages/Integrations";
import { ProfilePage } from "./pages/Profile";
import { RunPage } from "./pages/Run";
import { WorkoutPage } from "./pages/Workout";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="run" element={<RunPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="consistency" element={<ConsistencyPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
