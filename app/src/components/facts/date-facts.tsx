import { CalendarBlankIcon, ClockIcon, UsersIcon } from "@phosphor-icons/react";
import { Fact } from "./fact.tsx";
import { FactValue } from "./fact-value.tsx";
import { daysTo, relative, sentence } from "@/lib/notes/facts.ts";
import { longDate } from "@/lib/notes/model.ts";
import type { IntroDates } from "@/lib/notes/note-intro.ts";
import { copy } from "@/content/index.ts";

function whenSub(date: string, status: string) {
  return status && status !== "upcoming" ? sentence(status) : sentence(relative(daysTo(date)));
}

export function DateFacts({ from, dates }: { from: string; dates: IntroDates }) {
  const { date, due, status } = dates;
  return (
    <>
      {date && (
        <Fact icon={CalendarBlankIcon} label={copy.notes.when} sub={whenSub(date, status)}>
          {longDate(date)}
        </Fact>
      )}
      {due && (
        <Fact icon={ClockIcon} label={copy.notes.due} sub={sentence(relative(daysTo(due)))}>
          {longDate(due)}
        </Fact>
      )}
      {dates.with.length > 0 && (
        <Fact icon={UsersIcon} label={copy.notes.with}>
          <span>
            {dates.with.map((w, i) => (
              <span key={w}>
                {i > 0 && ", "}
                <FactValue from={from} value={w} />
              </span>
            ))}
          </span>
        </Fact>
      )}
    </>
  );
}
