export const DEFAULT_ROUTE = "today";
export const SCREEN_NAMES = [
  "today",
  "find",
  "add",
  "new",
  "write",
  "brain",
  "note",
  "settings",
  "inbox",
  "intake",
  "report",
] as const;
export type ScreenName = (typeof SCREEN_NAMES)[number];

export interface Route {
  name: ScreenName;
  params: URLSearchParams;
  rest: string;
  key: string;
}

const listeners = new Set<() => void>();

function here(): string {
  return location.pathname + location.search;
}

function isScreen(name: string): name is ScreenName {
  return (SCREEN_NAMES as readonly string[]).includes(name);
}

export function parse(url = here()): { name: ScreenName; params: URLSearchParams } {
  const [path = "", query = ""] = url.replace(/^#?\/?/, "").split("?");
  const first = path.split("/")[0] || DEFAULT_ROUTE;
  const name = first === "areas" ? "brain" : first;
  return { name: isScreen(name) ? name : DEFAULT_ROUTE, params: new URLSearchParams(query) };
}

export function routeRest(url = here()): string {
  const path = url.replace(/^#?\/?/, "").split("?")[0] ?? "";
  if (!path.includes("/")) return "";
  const rest = path.slice(path.indexOf("/") + 1);
  try {
    return rest.split("/").map(decodeURIComponent).join("/");
  } catch {
    return rest;
  }
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function go(url: string, replace = false) {
  history[replace ? "replaceState" : "pushState"](null, "", url);
  notify();
}

export function navigate(name: ScreenName, params?: Record<string, string>) {
  go(`/${name}${params ? `?${new URLSearchParams(params)}` : ""}`);
}

export function back(fallback = "/brain") {
  if (history.length > 1) history.back();
  else go(fallback);
}

export function subscribeRoute(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let cached: Route | null = null;

export function routeSnapshot(): Route {
  const url = here();
  if (cached && cached.key === url) return cached;
  const { name, params } = parse(url);
  cached = { name, params, rest: routeRest(url), key: url };
  return cached;
}

function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  const a = (e.target as Element | null)?.closest?.("a");
  const href = a?.getAttribute("href");
  if (!a || !href?.startsWith("/") || href.startsWith("//") || a.target) return;
  if (a.hasAttribute("download") || href.startsWith("/api/") || href.startsWith("/relay/")) return;
  e.preventDefault();
  go(href);
}

export function startRouter() {
  if (location.hash.startsWith("#/")) history.replaceState(null, "", location.hash.slice(1));
  window.addEventListener("popstate", notify);
  document.addEventListener("click", onClick);
}

export function stopRouter() {
  window.removeEventListener("popstate", notify);
  document.removeEventListener("click", onClick);
}
