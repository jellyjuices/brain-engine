import { parseEvery } from "@shared/line/index.ts";
import { whenStatus, type WhenStatus } from "@/lib/design/when.ts";
import { addDays, niceDate } from "./model.ts";
import { copy } from "@/content/index.ts";

export interface WhenLabel {
  label: string;
  status: WhenStatus;
}

export interface WhenSource {
  due?: string;
  every?: string;
  waiting?: boolean;
}

const WEEKDAY = new Intl.DateTimeFormat("en-CA", { weekday: "short", timeZone: "UTC" });

function weekdayName(index: number): string {
  return WEEKDAY.format(new Date(Date.UTC(2023, 0, 1 + index)));
}

export function dayLabel(iso: string, now: string): string {
  if (iso === now) return copy.common.today;
  if (iso > now && iso <= addDays(now, 7)) return WEEKDAY.format(new Date(`${iso}T00:00:00Z`));
  return niceDate(iso);
}

function ruleLabel(every: string): string {
  const rule = parseEvery(`every ${every}`);
  if (!rule || !("weekday" in rule)) return every;
  return every.replace(/^[a-z]+/i, weekdayName(rule.weekday));
}

function plainLabel(status: WhenStatus, due: string | undefined, now: string): string {
  if (status === "someday") return copy.common.someday;
  if (status === "waiting") return copy.todos.waiting;
  if (status === "today") return copy.common.today;
  return niceDate(due ?? now);
}

export function whenLabel({ due, every, waiting }: WhenSource, now: string): WhenLabel | undefined {
  const someday = due === "someday";
  const status = whenStatus({ due: someday ? undefined : due, someday, waiting }, now);
  if (every && !status) return { label: copy.todos.every(ruleLabel(every)), status: "due" };
  if (!status) return undefined;
  if (!every || !due || someday) return { label: plainLabel(status, due, now), status };
  return { label: copy.todos.everyOn(ruleLabel(every), dayLabel(due, now)), status };
}
