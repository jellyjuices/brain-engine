import { describe, expect, it } from "vitest";
import { applyDecision } from "@/lib/sync/local-edit.ts";
import { computeToday, fromServer } from "@/lib/notes/today.ts";
import { fixture, NOW, note } from "../../helpers.ts";

describe("Today from the local copy", () => {
  const t = computeToday(fixture(), NOW);

  it("groups overdue, today and waiting in that order", () => {
    expect(t.items.map((i) => [i.group, i.text])).toEqual([
      ["overdue", "Follow up on the report"],
      ["today", "A sample event"],
      ["today", "Make a sample plan"],
      ["waiting", "Hear back about the quote"],
    ]);
  });

  it("keeps a stable ref: path::text for a to-do, the path for an event", () => {
    expect(t.items.find((i) => i.text === "Make a sample plan")!.ref).toBe(
      "areas/fitness.md::Make a sample plan",
    );
    expect(t.items.find((i) => i.kind === "event")).toMatchObject({
      text: "A sample event",
      ref: "events/checkup.md",
      group: "today",
    });
  });

  it("leaves out later dates, done events, archived notes and done to-dos", () => {
    const texts = t.items.map((i) => i.text);
    expect(texts).not.toContain("Buy a sample item");
    expect(texts).not.toContain("Old visit");
    expect(texts).not.toContain("Ghost");
    expect(texts).not.toContain("Book a sample visit");
  });

  it("counts done today but not dropped", () => {
    expect(t.doneToday).toBe(1);
  });

  it("is empty when nothing is due", () => {
    expect(
      computeToday([note("areas/x.md", "# To-dos\n\n- [ ] Later · due 2027-01-01")], NOW).items,
    ).toEqual([]);
  });

  it("reads the Mac's /api/today reply, and refuses a shape it does not know", () => {
    expect(
      fromServer({
        date: NOW,
        items: [
          {
            n: 1,
            group: "today",
            kind: "todo",
            text: "A",
            path: "a/b.md",
            subject: "B",
            due: NOW,
            ref: "a/b.md::A",
          },
        ],
      })?.items[0],
    ).toMatchObject({ text: "A", ref: "a/b.md::A" });
    expect(fromServer({ nope: 1 })).toBeNull();
  });
});

describe("what a change does to the local copy", () => {
  const area = fixture()[0]!;
  const todo = {
    text: "Make a sample plan",
    path: area.path,
    subject: "Fitness",
    kind: "todo" as const,
    ref: `${area.path}::Make a sample plan`,
  };

  it("done ticks the line, adds the dated answer and the follow-up", () => {
    const out = applyDecision(
      area,
      todo,
      { kind: "done", happened: "Sent it to Sam", follow_up: "tomorrow: print it" },
      NOW,
    )!;
    expect(out.body).toContain(
      "- [x] Make a sample plan · due 2026-11-05 · today · done 2026-11-05\n- 2026-11-05 · Sent it to Sam",
    );
    expect(out.body).toContain("- [ ] print it · due 2026-11-06");
  });

  it("move changes the date, someday clears it", () => {
    expect(applyDecision(area, todo, { kind: "move", when: "2026-11-20" }, NOW)!.body).toContain(
      "- [ ] Make a sample plan · due 2026-11-20",
    );
    expect(applyDecision(area, todo, { kind: "move", when: "someday" }, NOW)!.body).toContain(
      "- [ ] Make a sample plan · someday\n",
    );
  });

  it("drop ticks it as dropped with the reason", () => {
    const out = applyDecision(area, todo, { kind: "drop", why: "No time" }, NOW)!;
    expect(out.body).toContain("done 2026-11-05 · dropped\n- 2026-11-05 · No time");
  });

  it("a line with only the old today mark is not in Today", () => {
    expect(computeToday(fixture(), NOW).items.map((i) => i.text)).not.toContain("Call back");
  });

  it("moving to today writes due with today's date and no today mark", () => {
    const later = { ...area, body: "# To-dos\n\n- [ ] Make a sample plan · due 2026-11-20\n" };
    const body = applyDecision(later, todo, { kind: "move", when: "today" }, NOW)!.body;
    expect(body).toContain("- [ ] Make a sample plan · due 2026-11-05\n");
    expect(body).not.toContain("· today");
  });

  it("the change shows on Today at once", () => {
    const moved = applyDecision(area, todo, { kind: "move", when: "2026-11-20" }, NOW)!;
    const today = computeToday([moved, ...fixture().slice(1)], NOW);
    expect(today.items.map((i) => i.text)).not.toContain("Make a sample plan");
  });

  it("returns null when the to-do is gone, and changes an event's note fields", () => {
    expect(
      applyDecision(area, { ...todo, text: "Nothing like it" }, { kind: "done" }, NOW),
    ).toBeNull();
    const ev = fixture()[3]!;
    const e = {
      text: "A sample event",
      path: ev.path,
      subject: "A sample event",
      kind: "event" as const,
      ref: ev.path,
    };
    expect(applyDecision(ev, e, { kind: "done" }, NOW)!.meta.status).toBe("done");
    expect(applyDecision(ev, e, { kind: "move", when: "2026-11-09" }, NOW)!.meta.date).toBe(
      "2026-11-09",
    );
    expect(applyDecision(ev, e, { kind: "move", when: "someday" }, NOW)).toBeNull();
  });
});
