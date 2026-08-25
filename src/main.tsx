import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { ensureGithubPagesPath } from "./lib/githubPagesPath";
import { routerBasename } from "./lib/routerBasename";
import { initStore } from "./lib/store";
import "./index.css";

ensureGithubPagesPath();

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Pick up new deploys without manual cache clearing (especially iOS home screen).
      window.location.reload();
    },
  });
}

initStore();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
