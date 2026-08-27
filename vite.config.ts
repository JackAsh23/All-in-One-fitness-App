import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { createReadStream, cpSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const workoutAssets = fileURLToPath(new URL("./node_modules/@bryllim/workout-guide/assets", import.meta.url));
const isGithubPages = process.env.GITHUB_PAGES === "true";
const isCapacitor = process.env.CAPACITOR === "true";
const GITHUB_PAGES_BASE = "/All-in-One-fitness-App/";
const GITHUB_PAGES_ORIGIN = "https://jackash23.github.io";
const pagesStartUrl = `${GITHUB_PAGES_ORIGIN}${GITHUB_PAGES_BASE}`;

function githubPagesSpaFallback(): Plugin {
  return {
    name: "github-pages-spa-fallback",
    transformIndexHtml(html) {
      if (!isGithubPages) return html;
      return html.replace("<head>", `<head>\n    <base href="${GITHUB_PAGES_BASE}" />`);
    },
    closeBundle() {
      if (!isGithubPages) return;
      const distDir = path.resolve("dist");
      const indexHtml = readFileSync(path.join(distDir, "index.html"), "utf-8");
      writeFileSync(path.join(distDir, "404.html"), indexHtml);
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

const plugins = [react(), tailwindcss(), workoutGuideAssets()];

if (!isCapacitor) {
  plugins.push(
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      includeAssets: ["favicon.svg", "icon-166.png", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png", "logo.png"],
      manifest: {
        name: "One Life — Fitness OS",
        short_name: "One Life",
        description: "Move. Train. Eat. See your consistency.",
        theme_color: "#07090c",
        background_color: "#07090c",
        display: "standalone",
        orientation: "portrait",
        ...(isGithubPages
          ? { id: pagesStartUrl, start_url: pagesStartUrl, scope: pagesStartUrl }
          : { start_url: "/", scope: "/" }),
        icons: [
          { src: "icon-166.png", sizes: "180x180", type: "image/png" },
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cacheId: "one-life-1.6.6",
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: isGithubPages ? `${GITHUB_PAGES_BASE}index.html` : "/index.html",
        navigateFallbackDenylist: [/^\/wg\//, /^\/All-in-One-fitness-App\/wg\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
        globIgnores: ["**/wg/**"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  );
}

if (isGithubPages) {
  plugins.push(githubPagesSpaFallback());
}

export default defineConfig({
  base: isGithubPages ? GITHUB_PAGES_BASE : isCapacitor ? "./" : "/",
  plugins,
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
