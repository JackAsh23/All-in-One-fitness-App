import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(path.join(root, "../public/favicon.svg"));

for (const [name, size] of [
  ["pwa-192.png", 192],
  ["pwa-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(svg).resize(size, size).png().toFile(path.join(root, "../public", name));
  console.log("wrote", name);
}
