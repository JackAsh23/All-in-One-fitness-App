import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ensureGithubPagesPath } from "./lib/githubPagesPath";
import { routerBasename } from "./lib/routerBasename";
import { initStore } from "./lib/store";
import "./index.css";

ensureGithubPagesPath();

initStore();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
