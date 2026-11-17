import { color, font, mix, motion, opacity, radius, shadow, shape, size, space, texture } from './primitives.ts'

type Tree = { [key: string]: string | Tree }

const flatten = (prefix: string, tree: Tree, out: Record<string, string>) => {
  for (const [key, value] of Object.entries(tree)) {
    const name = `${prefix}-${key}`
    if (typeof value === 'string') out[name] = value
    else flatten(name, value, out)
  }
  return out
}

export const primitives: Record<string, string> = flatten(
  '',
  { color, font, space, radius, shape, size, shadow, opacity, mix, motion, texture } as unknown as Tree,
  {},
)

export const primitiveNames = Object.fromEntries(
  Object.entries(primitives).map(([name, value]) => [name.slice(1), value]),
)

export { themed, shared, composed, reducedMotion, contrastPairs } from './semantic.ts'
export { color, font, space, radius, shape, size, shadow, motion } from './primitives.ts'
