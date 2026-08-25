import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createReadStream, cpSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const workoutAssets = fileURLToPath(new URL("./node_modules/@bryllim/workout-guide/assets", import.meta.url));

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
  base:
    process.env.GITHUB_PAGES === "true"
      ? "/All-in-One-fitness-App/"
      : process.env.CAPACITOR === "true"
        ? "./"
        : "/",
  plugins: [react(), tailwindcss(), workoutGuideAssets()],
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
