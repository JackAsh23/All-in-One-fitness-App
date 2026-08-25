import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createReadStream, cpSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const workoutAssets = fileURLToPath(new URL("./node_modules/@bryllim/workout-guide/assets", import.meta.url));
const GITHUB_PAGES_BASE = "/All-in-One-fitness-App/";
const GITHUB_PAGES_ORIGIN = "https://jackash23.github.io";

function githubPagesPwa(): Plugin {
  return {
    name: "github-pages-pwa",
    transformIndexHtml(html) {
      if (process.env.GITHUB_PAGES !== "true") return html;
      return html.replace(
        "<head>",
        `<head>\n    <base href="${GITHUB_PAGES_BASE}" />`,
      ).replace(
        "</head>",
        `    <link rel="manifest" href="${GITHUB_PAGES_BASE}manifest.webmanifest" />\n</head>`,
      );
    },
    closeBundle() {
      if (process.env.GITHUB_PAGES !== "true") return;

      const distDir = path.resolve("dist");
      const indexPath = path.join(distDir, "index.html");
      const indexHtml = readFileSync(indexPath, "utf-8");

      // GitHub Pages serves 404.html for unknown paths — required for SPA deep links & iOS home screen.
      writeFileSync(path.join(distDir, "404.html"), indexHtml);

      const startUrl = `${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE}`;
      const manifest = {
        name: "One Life — Fitness OS",
        short_name: "One Life",
        id: startUrl,
        start_url: startUrl,
        scope: startUrl,
        display: "standalone",
        theme_color: "#07090c",
        background_color: "#07090c",
        icons: [
          {
            src: `${GITHUB_PAGES_BASE}favicon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      };
      writeFileSync(path.join(distDir, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));
    },
  };
}

function workoutGuideAssets(): Plugin {
  return {
    name: "workout-guide-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/wg/")) return next();
        const rel = decodeURIComponent(url.slice("/wg/".length));
        const file = path.resolve(workoutAssets, rel);
        if (!file.startsWith(workoutAssets) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end();
          return;
        }
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      cpSync(workoutAssets, path.resolve("dist/wg"), { recursive: true });
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/All-in-One-fitness-App/" : "/",
  plugins: [react(), tailwindcss(), workoutGuideAssets(), githubPagesPwa()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
