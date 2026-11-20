import { color, font, layout, motion, radius, shape, size, space } from "./primitives.ts";

type Tree = { [key: string]: string | Tree };

const flatten = (prefix: string, tree: Tree, out: Record<string, string>) => {
  for (const [key, value] of Object.entries(tree)) {
    const name = prefix ? `${prefix}-${key}` : key;
    if (typeof value === "string") out[name] = value;
    else flatten(name, value, out);
  }
  return out;
};

const { family, ...fontScales } = font;

export const primitiveNames: Record<string, string> = flatten(
  "",
  {
    color,
    font: { ...family, ...fontScales },
    space,
    radius,
    shape,
    size,
    layout,
    motion,
  } as unknown as Tree,
  {},
);

export { themed, reducedMotion, contrastPairs } from "./semantic.ts";
export { color, font, space, radius, shape } from "./primitives.ts";
