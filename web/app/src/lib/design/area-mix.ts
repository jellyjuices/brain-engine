export type AreaRole = "accent" | "fill" | "text" | "surface" | "glow";

export const MAX_MIXED_AREAS = 3;

export const splitAreas = (areas: string[] = []) => {
  const unique = [...new Set(areas)];
  return {
    shown: unique.slice(0, MAX_MIXED_AREAS),
    extra: Math.max(0, unique.length - MAX_MIXED_AREAS),
  };
};

export const shownAreas = (areas: string[] = []) => splitAreas(areas).shown;

export const areaVar = (slug: string, role: AreaRole) => `var(--area-${slug}-${role})`;

const VIVID_CHROMA = 0.3;

const vivid = (colour: string) =>
  `color-mix(in oklch, ${colour}, oklch(from ${colour} l ${VIVID_CHROMA} h) var(--mix-vivid))`;

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

export const mixStops = (areas: string[], role: AreaRole = "fill", perSegment = 4) => {
  const list = colours(areas, role);
  const stops: { offset: number; colour: string }[] = [];
  const segments = list.length - 1;
  for (let s = 0; s < segments; s++) {
    for (let k = 0; k <= perSegment; k++) {
      if (s > 0 && k === 0) continue;
      const t = k / perSegment;
      stops.push({
        offset: ((s + t) / segments) * 100,
        colour: `color-mix(in oklch, ${list[s]} ${Math.round((1 - t) * 100)}%, ${list[s + 1]})`,
      });
    }
  }
  return stops;
};

export const smallPartRule =
  "Parts under the icon size show each area as its own dot or a hard split. Larger parts use the oklch gradient.";
