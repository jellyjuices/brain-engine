import {
  closeAllLayers,
  isLayerEntry,
  resetLayers,
  skipLayerEntry,
  takePop,
  whenSettled,
} from "./back-stack.ts";

export const DEFAULT_ROUTE = "todos";
export const HOME = `/${DEFAULT_ROUTE}`;
export const SCREEN_NAMES = [
  "todos",
  "goals",
  "goal",
  "today",
  "find",
  "add",
  "journal",
  "brain",
  "note",
  "settings",
  "inbox",
  "intake",
  "report",
  "person",
  "file",
] as const;
export type ScreenName = (typeof SCREEN_NAMES)[number];

export interface Route {
  name: ScreenName;
  params: URLSearchParams;
  rest: string;
  key: string;
}

const listeners = new Set<() => void>();
let pendingTab: string | null = null;

function here(): string {
  return location.pathname + location.search;
}

function isScreen(name: string): name is ScreenName {
  return (SCREEN_NAMES as readonly string[]).includes(name);
}

const OLD_NAMES: Record<string, ScreenName> = { areas: "brain", today: "todos", report: "goals" };

export function parse(url = here()): { name: ScreenName; params: URLSearchParams } {
  const [path = "", query = ""] = url.replace(/^#?\/?/, "").split("?");
  const first = path.split("/")[0] || DEFAULT_ROUTE;
  const name = OLD_NAMES[first] ?? first;
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

function storedDepth(): number | null {
  const value = (history.state as { depth?: unknown } | null)?.depth;
  return typeof value === "number" ? value : null;
}

function depth(): number {
  return storedDepth() ?? 0;
}

export function go(url: string, replace = false) {
  whenSettled(() => {
    const next = replace ? depth() : depth() + 1;
    history[replace ? "replaceState" : "pushState"]({ depth: next }, "", url);
    notify();
  });
}

export function navigate(name: ScreenName, params?: Record<string, string>) {
  go(`/${name}${params ? `?${new URLSearchParams(params)}` : ""}`);
}

export function back(fallback = HOME) {
  whenSettled(() => {
    if (depth() > 0) history.back();
    else go(fallback, true);
  });
}

export function goTab(url: string) {
  closeAllLayers();
  whenSettled(() => {
    const steps = depth();
    if (steps === 0) {
      if (url !== here()) go(url, url === HOME);
      return;
    }
    pendingTab = url;
    history.go(-steps);
  });
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

function isPlainClick(e: MouseEvent) {
  const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  return !e.defaultPrevented && e.button === 0 && !modified;
}

const SERVER_PATHS = ["//", "/api/", "/relay/"];

function isAppHref(href: string | null | undefined): href is string {
  return Boolean(href?.startsWith("/")) && !SERVER_PATHS.some((p) => href?.startsWith(p));
}

function appLink(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.("a");
  const href = a?.getAttribute("href");
  if (!a || a.target || a.hasAttribute("download") || !isAppHref(href)) return null;
  return href;
}

function onClick(e: MouseEvent) {
  const href = isPlainClick(e) ? appLink(e) : null;
  if (!href) return;
  e.preventDefault();
  go(href);
}

function onPop() {
  if (takePop()) return;
  if (isLayerEntry()) {
    skipLayerEntry();
    return;
  }
  const tab = pendingTab;
  pendingTab = null;
  if (tab !== null && tab !== here()) history.pushState({ depth: depth() + 1 }, "", tab);
  notify();
}

function seedHistory() {
  if (storedDepth() !== null) return;
  const url = here();
  const atHome = parse(url).name === DEFAULT_ROUTE && !routeRest(url) && !location.search;
  history.replaceState({ depth: 0 }, "", atHome ? url : HOME);
  if (!atHome) history.pushState({ depth: 1 }, "", url);
}

export function startRouter() {
  if (location.hash.startsWith("#/")) history.replaceState(null, "", location.hash.slice(1));
  seedHistory();
  window.addEventListener("popstate", onPop);
  if (isLayerEntry()) skipLayerEntry();
  document.addEventListener("click", onClick);
}

export function stopRouter() {
  window.removeEventListener("popstate", onPop);
  document.removeEventListener("click", onClick);
  pendingTab = null;
  resetLayers();
}
