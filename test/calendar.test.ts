import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { calendarEntries, calendarFeed, foldLine, icsText } from "../src/todos/calendar.ts";
import { createServer } from "../src/interface/server.ts";
import { makeBrain } from "./fixture.ts";

function brain(): string {
  const root = makeBrain();
  writeFileSync(join(root, "projects/visit.md"), `---\ntype: Project\ntitle: Doctor visit\ndescription: A visit.\n---\n\n# To-dos\n\n- [ ] Ask about pills, sleep · due 2026-11-20\n- [ ] No date here\n- [x] Old one · due 2026-11-01\n`);
  writeFileSync(join(root, "events/checkup.md"), `---\ntype: Event\ntitle: Checkup\ndescription: A checkup.\ndate: 2026-11-18\nstatus: upcoming\n---\n\n# Prep\n`);
  return root;
}

test("entries hold open to-dos with a date and open events, by date", () => {
  const entries = calendarEntries(brain());
  assert.deepEqual(entries.map((e) => [e.date, e.title]), [["2026-11-18", "Checkup"], ["2026-11-20", "Ask about pills, sleep"]]);
  assert.equal(entries[1]!.about, "Doctor visit");
});

test("the feed is all-day iCalendar with stable ids", () => {
  const root = brain();
  const feed = calendarFeed(root, "20261114T000000Z");
  assert.match(feed, /^BEGIN:VCALENDAR\r\n/);
  assert.match(feed, /DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261121\r\n/);
  assert.match(feed, /SUMMARY:Ask about pills\\, sleep\r\n/);
  assert.match(feed, /DESCRIPTION:About what: Doctor visit\r\n/);
  assert.equal(feed.match(/BEGIN:VEVENT/g)!.length, 2);
  assert.equal(calendarFeed(root, "20261114T000000Z"), feed);
});

test("text is escaped and long lines fold without breaking characters", () => {
  assert.equal(icsText("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne");
  const folded = foldLine("SUMMARY:" + "é".repeat(60));
  for (const part of folded.split("\r\n")) assert.ok(Buffer.byteLength(part) <= 75);
  assert.equal(folded.replaceAll("\r\n ", ""), "SUMMARY:" + "é".repeat(60));
});

test("brain serve sends the feed at /api/cal.ics with a token only", async () => {
  const server = createServer(brain(), "test-token");
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/cal.ics`;
  try {
    assert.equal((await fetch(base)).status, 401);
    const res = await fetch(base, { headers: { Authorization: "Bearer test-token" } });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type")!, /^text\/calendar/);
    assert.match(await res.text(), /SUMMARY:Checkup/);
  } finally {
    server.close();
  }
});
