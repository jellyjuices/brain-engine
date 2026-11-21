import { lchToSrgb, toHex } from "./oklch.ts";

export type AreaKey = { hue: number; chroma?: number; label: string };

export const areaKeys: Record<string, AreaKey> = {
  health: { hue: 25, label: "Health" },
  "rest-and-fun": { hue: 55, label: "Rest and fun" },
  home: { hue: 85, label: "Home" },
  money: { hue: 115, label: "Money" },
  fitness: { hue: 145, label: "Fitness" },
  "personal-projects": { hue: 175, label: "Personal projects" },
  "client-work": { hue: 210, label: "Client work" },
  career: { hue: 240, label: "Career" },
  "business-admin": { hue: 270, label: "Business admin" },
  "life-admin": { hue: 300, label: "Life admin" },
  relationships: { hue: 328, label: "Relationships" },
  "love-life": { hue: 355, label: "Love life" },
  "sense-of-self": { hue: 10, label: "Sense of self" },
  general: { hue: 190, chroma: 0.12, label: "General" },
};

const lightness = [0.965, 0.915, 0.85, 0.77, 0.68, 0.58, 0.47, 0.37, 0.25];
const chroma = [0.03, 0.06, 0.09, 0.11, 0.12, 0.115, 0.1, 0.08, 0.045];

const areaRamp = ({ hue, chroma: scale = 1 }: AreaKey) =>
  Object.fromEntries(
    lightness.map((l, i) => [
      String((i + 1) * 100),
      toHex(lchToSrgb({ l, c: chroma[i] * scale, h: hue })),
    ]),
  ) as Record<string, string>;

export const areaColours = Object.fromEntries(
  Object.entries(areaKeys).map(([slug, key]) => [slug, areaRamp(key)]),
);

export const areaSlugs = Object.keys(areaKeys);
