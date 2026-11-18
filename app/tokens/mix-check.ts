import { areaSlugs } from "./areas.ts";
import { ratio } from "./contrast.ts";
import { mixLch, rgbToLch, lchToSrgb, toHex } from "./oklch.ts";
import { themed } from "./index.ts";
import { surface } from "./semantic.ts";
import { flatten, resolve, type Mode } from "./resolve.ts";

const noise = {
  dark: { rgb: [255, 255, 255], alpha: 0.18 },
  light: { rgb: [0, 0, 0], alpha: 0.12 },
};

const over = (under: number[], rgb: number[], alpha: number) =>
  rgb.map((v, i) => v * alpha + under[i] * (1 - alpha));

const path = (colours: number[][], steps = 10) => {
  const out: number[][] = [];
  for (let i = 0; i < colours.length - 1; i++) {
    const a = rgbToLch(colours[i]);
    const b = rgbToLch(colours[i + 1]);
    for (let s = 0; s <= steps; s++) out.push(lchToSrgb(mixLch(a, b, s / steps)));
  }
  return out;
};

export const combos = (
  size: number,
  list = areaSlugs.filter((a) => a !== "general"),
): string[][] =>
  size === 1
    ? list.map((a) => [a])
    : list.flatMap((a, i) => combos(size - 1, list.slice(i + 1)).map((rest) => [a, ...rest]));

export type MixResult = {
  areas: string[];
  mode: Mode;
  part: string;
  text: string;
  worst: number;
  at: string;
};

export const checkMix = (areas: string[], mode: Mode): MixResult[] => {
  const results: MixResult[] = [];
  const textNoise = 0.25;
  const glowAlpha = parseFloat(themed["glow-corner-opacity"][mode] as string);
  const parts = [
    { part: "surface", role: "surface", base: "background-secondary" },
    { part: "surface on page", role: "surface", base: "background-primary" },
    { part: "corner glow", role: "glow", base: "background-primary" },
  ];
  for (const { part, role, base } of parts) {
    const layers = areas.map((a) =>
      resolve(role === "surface" ? surface(a) : `area-${a}-${role}`, mode),
    );
    const alpha = role === "glow" ? glowAlpha : layers[0].alpha;
    const under = flatten([base], mode);
    for (const text of ["text-primary", "text-secondary"]) {
      const fg = resolve(text, mode).rgb;
      let worst = Infinity;
      let at = "";
      for (const sample of path(layers.map((l) => l.rgb))) {
        const bg = over(over(under, sample, alpha), noise[mode].rgb, noise[mode].alpha * textNoise);
        const r = ratio(toHex(fg.map(Math.round)), toHex(bg.map(Math.round)));
        if (r < worst) [worst, at] = [r, toHex(bg.map(Math.round))];
      }
      results.push({ areas, mode, part, text, worst, at });
    }
  }
  return results;
};
