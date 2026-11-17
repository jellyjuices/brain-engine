export type Loaded<T> =
  { kind: "loading" } | { kind: "offline" } | { kind: "missing" } | { kind: "ready"; data: T };
