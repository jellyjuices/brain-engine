import { primitiveNames, themed } from "./index.ts";
import type { Value } from "./semantic.ts";

export type Mode = "dark" | "light";
export type Rgba = { rgb: number[]; alpha: number };

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export const resolve = (token: Value, mode: Mode): Rgba => {
  const v: Value = (typeof token === "string" && themed[token]?.[mode]) || token;
  if (typeof v === "string") {
    if (themed[v]) return resolve(v, mode);
    return { rgb: hex(primitiveNames[v]), alpha: 1 };
  }
  const base = resolve(v.mix, mode);
  return { rgb: base.rgb, alpha: parseFloat(v.amount) / 100 };
};

export const flatten = (layers: Value[], mode: Mode) =>
  layers.reduce<number[]>(
    (under, token) => {
      const { rgb, alpha } = resolve(token, mode);
      return rgb.map((c, i) => c * alpha + under[i] * (1 - alpha));
    },
    [0, 0, 0],
  );

export const hexOf = (layers: Value[], mode: Mode) => toHex(flatten(layers, mode));

export const isColour = (token: string) => {
  const v = themed[token]?.dark;
  return typeof v !== "string" || primitiveNames[v]?.startsWith("#") || Boolean(themed[v]);
};
