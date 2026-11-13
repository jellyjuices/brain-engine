import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const GREEN = "#2F6B4F";
function mark(size, scale) {
  const fs = Math.round(size * 0.78 * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${GREEN}"/><text x="50%" y="${Math.round(size * (0.5 + 0.27 * scale))}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="600" font-size="${fs}" fill="#FFFDF9">b</text></svg>`;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", mark(512, 1));
for (const [name, size, scale] of [
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["maskable-512.png", 512, 0.72],
  ["apple-touch-icon.png", 180, 1],
]) {
  await sharp(Buffer.from(mark(size, scale)))
    .png()
    .toFile(`public/icons/${name}`);
}
