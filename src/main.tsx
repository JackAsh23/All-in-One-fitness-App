import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import { initCapacitor } from "./lib/capacitor";
import { ensureGithubPagesPath } from "./lib/githubPagesPath";
import { routerBasename } from "./lib/routerBasename";
import { initStore } from "./lib/store";
import { lockViewportZoom } from "./lib/lockViewportZoom";
import "./index.css";

lockViewportZoom();
ensureGithubPagesPath();

if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true);
    },
    onRegistered(registration) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update();
      }, 60_000);
    },
  });
}

initStore()
  .catch(() => {
    /* IndexedDB / storage unavailable — render with in-memory state */
  })
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <BrowserRouter basename={routerBasename()}>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  });
void initCapacitor();
