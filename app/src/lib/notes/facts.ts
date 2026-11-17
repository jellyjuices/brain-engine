import { resolveLink, todayIso, type StoredNote } from "./model.ts";
import { copy } from "@/content/index.ts";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v instanceof Date ? v.toISOString().slice(0, 10) : "";
}
export function sentence(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function daysTo(iso: string): number {
  return Math.round(
    (new Date(`${iso}T12:00:00`).getTime() - new Date(`${todayIso()}T12:00:00`).getTime()) /
      86_400_000,
  );
}

export function relative(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 0)
    return n < 14
      ? `in ${n} days`
      : n < 60
        ? `in ${Math.round(n / 7)} weeks`
        : `in ${Math.round(n / 30)} months`;
  const m = -n;
  return m < 14
    ? `${m} days ago`
    : m < 60
      ? `${Math.round(m / 7)} weeks ago`
      : `${Math.round(m / 30)} months ago`;
}

export function birthdayFact(
  raw: string,
  today = todayIso(),
): { main: string; sub: string } | null {
  const m = /^(\d{4}|-)-?(\d{2})-(\d{2})/.exec(raw);
  if (!m) return null;
  const year = m[1] === "-" ? undefined : Number(m[1]);
  const month = Number(m[2]),
    day = Number(m[3]);
  if (!MONTHS[month - 1]) return null;
  const ty = Number(today.slice(0, 4));
  const md = `${m[2]}-${m[3]}`;
  const thisYear = `${ty}-${md}`;
  const past = daysTo(thisYear);
  const nextYear = past < -7 ? ty + 1 : ty;
  const next = `${nextYear}-${md}`;
  const gap = daysTo(next);
  const age = year ? nextYear - year : undefined;
  const sub =
    gap === 0
      ? age
        ? copy.notes.turnsToday(age)
        : copy.common.today
      : gap < 0
        ? age
          ? copy.notes.turned(age, relative(gap))
          : relative(gap)
        : age
          ? `Turns ${age} ${relative(gap)}`
          : sentence(relative(gap));
  return { main: `${MONTHS[month - 1]} ${day}${year ? `, ${year}` : ""}`, sub };
}

const PARTNER_RE = /\b(partner|wife|husband|spouse|girlfriend|boyfriend|fianc[eé]e?)\b/i;

export function findPartner(
  note: StoredNote,
  notes: StoredNote[],
): { name: string; path?: string; role: string } | null {
  let section = "";
  for (const line of note.body.split("\n")) {
    const head = /^#\s+(.+)/.exec(line);
    if (head) {
      section = head[1]!.trim();
      continue;
    }
    if (section !== "People") continue;
    const m = /^-\s+(?:\[([^\]]+)\]\(([^)\s]+)\)|([^·]+?))\s*·\s*(.+)$/.exec(line.trim());
    if (!m) continue;
    const role = m[4]!.split("·")[0]!.trim();
    if (!PARTNER_RE.test(role)) continue;
    const path = m[2] ? (resolveLink(note.path, m[2]) ?? undefined) : undefined;
    return {
      name: (m[1] ?? m[3])!.trim(),
      ...(path && { path }),
      role: role.replace(/^(his|her|their)\s+/i, ""),
    };
  }
  for (const other of notes) {
    if (other.path === note.path || other.type !== "Person") continue;
    for (const line of other.body.split("\n")) {
      const m = /^-\s+\[[^\]]+\]\(([^)\s]+)\)\s*·\s*([^·]+)/.exec(line.trim());
      if (m && resolveLink(other.path, m[1]!) === note.path && PARTNER_RE.test(m[2]!)) {
        return {
          name: str(other.meta.full_name) || other.title,
          path: other.path,
          role: m[2]!.trim().replace(/^(his|her|their)\s+/i, ""),
        };
      }
    }
  }
  return null;
}
