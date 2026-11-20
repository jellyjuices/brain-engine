export const BUILD_KINDS = ["person", "place", "thing"] as const;
export type BuildKind = (typeof BUILD_KINDS)[number];

export function isBuildKind(name: string): name is BuildKind {
  return (BUILD_KINDS as readonly string[]).includes(name);
}

export const BUILD_TYPE = { person: "Person", place: "Place", thing: "Thing" } as const;
