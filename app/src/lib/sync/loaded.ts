export type Loaded<T> =
  | { kind: "loading" }
  | { kind: "offline" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; data: T };

export function failed(res: { offline: boolean; status?: number }): {
  kind: "offline" | "missing" | "error";
} {
  if (res.offline) return { kind: "offline" };
  return { kind: res.status === 404 ? "missing" : "error" };
}
