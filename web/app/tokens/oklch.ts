export type Lch = { l: number; c: number; h: number };

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const lchToRgb = ({ l, c, h }: Lch) => {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
};

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

export const rgbToLch = (rgb: number[]): Lch => {
  const [r, g, b] = rgb.map((v) => toLinear(v / 255));
  const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S;
  const A = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S;
  const B = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S;
  return { l, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
};

export const lchToSrgb = (lch: Lch) => {
  let c = lch.c;
  let rgb = lchToRgb({ ...lch, c });
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.002);
    rgb = lchToRgb({ ...lch, c });
  }
  return rgb.map((v) => Math.round(Math.max(0, Math.min(1, toGamma(Math.max(0, v)))) * 255));
};

export const toHex = (rgb: number[]) =>
  `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export const mixLch = (a: Lch, b: Lch, t: number): Lch => {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { l: a.l + (b.l - a.l) * t, c: a.c + (b.c - a.c) * t, h: (a.h + dh * t + 360) % 360 };
};
