import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildCard, cardLines, matchSubject } from "../src/reports/card.ts";
import { addDays, today } from "../src/core/notes.ts";
import { loadAll } from "../src/core/files.ts";
import { BIN, makeBrain } from "./fixture.ts";

function note(root: string, rel: string, front: string, body: string) {
  writeFileSync(join(root, rel), `---\n${front}\n---\n\n${body}\n`);
}

function doctorBrain(): string {
  const root = makeBrain();
  const visit = addDays(today(), 3);
  note(root, "people/family-doctor.md", "type: Person\ntitle: Dr. Test, family doctor\ndescription: My GP.", "# Who\n\nMy GP.\n\n# Notes\n\n- 2026-01-02 · First visit.\n");
  note(root, `events/${visit}-family-doctor.md`, `type: Event\ntitle: Family doctor visit\ndescription: Advil and sleep.\ndate: ${visit}\nstatus: upcoming\nwith: people/family-doctor.md`,
    "With [Dr. Test](../people/family-doctor.md). Background: [Health history](../resources/health-history.md).\n\n# To-dos\n\n- [ ] Ask about Advil\n\n# Outcome\n");
  note(root, "resources/health-history.md", "type: Note\ntitle: Health history\ndescription: Tests and meds.", "- 2026-01-01 · Fog since 2022.\n");
  note(root, "topics/sleep.md", "type: Topic\ntitle: Sleep\ndescription: Sleep.", "# Related\n\n- [Dr. Test](../people/family-doctor.md) · treats it\n\n# To-dos\n\n- [ ] Book the sleep test · re [Dr. Test](../people/family-doctor.md)\n");
  note(root, "areas/health.md", "type: Area\ntitle: Health\ndescription: Health.", "- [Dr. Test](../people/family-doctor.md)\n\n# To-dos\n\n- [ ] An area to-do\n");
  note(root, ".archive/old-doctor.md", "type: Person\ntitle: Old family doctor\ndescription: Retired.", "");
  return root;
}

test("find doctor shows the family doctor's card with the to-do, the visit and the health history", () => {
  const root = doctorBrain();
  const notes = loadAll(root);
  const n = matchSubject(notes, "doctor")!;
  assert.equal(n.path, "people/family-doctor.md");
  const c = buildCard(root, notes, n);
  assert.deepEqual(c.todo.map((t) => t.text).sort(), ["Ask about Advil", "Book the sleep test"]);
  assert.equal(c.next?.text, "Family doctor visit");
  assert.deepEqual(c.history.map((h) => h.text), ["First visit."]);
  assert.deepEqual(c.relations.map((r) => [r.direction, r.title, r.role]), [["in", "Sleep", "treats it"]]);
  assert.ok(c.related.some((s) => s.path === "resources/health-history.md"));
  assert.ok(!c.todo.some((t) => t.text === "An area to-do"), "area to-dos stay off the card");

  const r = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "find", "doctor", "--json"], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });
  const j = JSON.parse(r.stdout);
  assert.equal(j.card.subject.path, "people/family-doctor.md");
  assert.ok(Array.isArray(j.hits));
  assert.match(cardLines(c).join("\n"), /To do\n {2}- Ask about Advil · Family doctor visit/);
});
