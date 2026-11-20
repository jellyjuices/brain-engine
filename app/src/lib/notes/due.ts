import { addDays, longDate } from "./model.ts";
import { copy } from "@/content/index.ts";

function quickDays(now: string): { fri: string; nextWeek: string } {
  const dow = new Date(`${now}T12:00:00`).getDay();
  return {
    fri: addDays(now, (5 - dow + 7) % 7 || 7),
    nextWeek: addDays(now, (1 - dow + 7) % 7 || 7),
  };
}

export type QuickId =
  "today" | "tomorrow" | "friday" | "nextWeek" | "inAMonth" | "someday" | "waiting";

export interface QuickChoice {
  id: QuickId;
  label: string;
  sub: string;
  value: string;
}

export function quickChoices(now: string, ids: QuickId[]): QuickChoice[] {
  const { fri, nextWeek } = quickDays(now);
  const dated: Record<string, [string, string]> = {
    today: [copy.common.today, "today"],
    tomorrow: [copy.common.tomorrow, addDays(now, 1)],
    friday: [copy.common.thisFriday, fri],
    nextWeek: [copy.common.nextWeek, nextWeek],
    inAMonth: [copy.common.inAMonth, addDays(now, 30)],
  };
  return ids.map((id) => {
    if (id === "someday")
      return { id, label: copy.common.someday, sub: copy.common.noDate, value: "someday" };
    if (id === "waiting")
      return { id, label: copy.common.waiting, sub: copy.common.onSomeone, value: "waiting" };
    const [label, value] = dated[id]!;
    return { id, label, sub: longDate(value === "today" ? now : value), value };
  });
}

export function dueText(due: string | undefined, now: string): string {
  if (!due) return copy.today.noDateYet;
  if (due === "someday") return copy.common.someday;
  const days = Math.round(
    (new Date(`${due}T12:00:00`).getTime() - new Date(`${now}T12:00:00`).getTime()) / 86_400_000,
  );
  if (days === 0) return copy.today.dueToday;
  if (days === 1) return copy.today.dueTomorrow;
  if (days < 0)
    return copy.today.dueLate(
      longDate(due),
      -days === 1 ? copy.today.oneDay : copy.today.manyDays(-days),
    );
  return copy.today.dueOn(longDate(due));
}
