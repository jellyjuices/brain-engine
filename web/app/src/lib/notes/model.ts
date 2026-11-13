export interface StoredNote {
  path: string;
  type?: string;
  title: string;
  description: string;
  tags: string[];
  area?: string;
  status: string;
  due?: string;
  outcome?: string;
  modified: string;
  meta: Record<string, unknown>;
  body: string;
  hash: string;
}

export const ARCHIVE = ".archive";
export function isArchived(n: { path: string }) {
  return n.path.startsWith(`${ARCHIVE}/`);
}
export function folderOf(n: { path: string }) {
  return n.path.split("/")[0]!;
}
export function slugOf(path: string) {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "");
}
export function isLive(n: StoredNote) {
  return !isArchived(n) && n.status !== "deprecated";
}

export function toStored(raw: Record<string, unknown>): StoredNote {
  const r = raw as Partial<StoredNote>;
  return {
    path: String(r.path),
    ...(r.type && { type: r.type }),
    title: r.title ?? slugOf(String(r.path)),
    description: r.description ?? "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    ...(r.area && { area: r.area }),
    status: r.status ?? "stable",
    ...(r.due && { due: r.due }),
    ...(r.outcome && { outcome: r.outcome }),
    modified: r.modified ?? "",
    meta: r.meta ?? {},
    body: r.body ?? "",
    hash: r.hash ?? "",
  };
}

export function eventDue(n: StoredNote): string | undefined {
  if (n.type !== "Event" || ["done", "cancelled"].includes(String(n.meta.status))) return undefined;
  const d = n.meta.date;
  return typeof d === "string" && d ? d.slice(0, 10) : undefined;
}

export function normalizePath(path: string): string {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function dirname(path: string) {
  return path.slice(0, Math.max(0, path.lastIndexOf("/")));
}

export function resolveLink(from: string, target: string): string | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#") || target.startsWith("//"))
    return null;
  let t = target.split("#")[0]!;
  try {
    t = decodeURI(t);
  } catch {}
  if (!t) return null;
  return normalizePath(t.startsWith("/") ? t.slice(1) : `${dirname(from)}/${t}`);
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;

export function extractLinks(path: string, body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(LINK_RE)) {
    const r = resolveLink(path, m[1]!);
    if (r) out.push(r);
  }
  return out;
}

export function noteHref(path: string) {
  return `/note/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function todayIso() {
  return isoDate(new Date());
}

function at(iso: string) {
  return new Date(`${iso}T12:00:00`);
}
export function addDays(iso: string, n: number): string {
  const d = at(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function niceDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(at(iso));
}
export function longDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" })
    .format(at(iso))
    .replace(/,/g, "");
}
