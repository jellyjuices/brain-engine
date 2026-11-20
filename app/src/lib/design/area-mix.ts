export type AreaRole = "accent" | "fill" | "text" | "glow";

const MAX_MIXED_AREAS = 3;

export const splitAreas = (areas: string[] = []) => {
  const unique = [...new Set(areas)];
  return {
    shown: unique.slice(0, MAX_MIXED_AREAS),
    extra: Math.max(0, unique.length - MAX_MIXED_AREAS),
  };
};

const shownAreas = (areas: string[] = []) => splitAreas(areas).shown;

export const areaVar = (slug: string, role: AreaRole) => `var(--area-${slug}-${role})`;

export const areaSurface = (slug: string) =>
  `color-mix(in oklch, ${areaVar(slug, "accent")} 16%, transparent)`;

const VIVID_CHROMA = 0.3;

const vivid = (colour: string) =>
  `color-mix(in oklch, ${colour}, oklch(from ${colour} l ${VIVID_CHROMA} h) 35%)`;

const colours = (areas: string[], role: AreaRole) => {
  const list = shownAreas(areas).map((a) => areaVar(a, role));
  if (list.length === 1) return [list[0], list[0]];
  return role === "fill" ? list.map(vivid) : list;
};

export const mixGradient = (areas: string[], role: AreaRole = "fill", angle = 135) =>
  `linear-gradient(in oklch ${angle}deg, ${colours(areas, role).join(", ")})`;

export const mixGlow = (areas: string[]) => {
  const list = colours(areas, "glow");
  return `conic-gradient(in oklch from 200deg at 100% 0%, ${[...list, list[0]].join(", ")})`;
};

export const mixSplit = (areas: string[], role: AreaRole = "accent") => {
  const shown = shownAreas(areas);
  const share = 100 / shown.length;
  const stops = shown.map((a, i) => `${areaVar(a, role)} ${i * share}% ${(i + 1) * share}%`);
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
};

export const smallPartRule =
  "Parts under the icon size show each area as its own dot or a hard split. Larger parts use the oklch gradient.";
