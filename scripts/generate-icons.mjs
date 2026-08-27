import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "../public");
const logoPng = path.join(publicDir, "logo.png");

for (const [name, size] of [
  ["pwa-192.png", 192],
  ["pwa-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["icon-166.png", 180],
]) {
  await sharp(logoPng)
    .flatten({ background: "#07090c" })
    .resize(size, size, {
      fit: "contain",
      background: { r: 7, g: 9, b: 12, alpha: 1 },
    })
    .png()
    .toFile(path.join(publicDir, name));
  console.log("wrote", name);
}
