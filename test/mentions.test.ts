import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { check } from "../src/reports/reports.ts";
import { secondMentions } from "../src/reports/mentions.ts";
import { makeBrain } from "./fixture.ts";

const note = (root: string, rel: string, type: string, title: string, body: string, extra = "") =>
  writeFileSync(join(root, rel), `---\ntype: ${type}\ntitle: ${title}\ndescription: Test note.\n${extra}---\n\n${body}\n`);

function brain(): string {
  const root = makeBrain();
  note(root, "people/omar.md", "Person", "Omar", "# Notes\n");
  note(root, "projects/acme.md", "Project", "Acme", "# Notes\n\n- 2026-11-01 · Omar is the co-founder.\n");
  note(root, "projects/linked.md", "Project", "Linked", "# Notes\n\n- 2026-11-01 · [Omar](../people/omar.md) said yes, and Omar again.\n");
  note(root, "projects/code.md", "Project", "Code", "# Notes\n\nSee `Omar` and [Omar](https://x.test).\n\n```\nOmar\n```\n");
  note(root, "projects/one.md", "Project", "One", "# Notes\n\n- 2026-11-01 · Lunch with Tessa soon. Tessa Park is kind.\n- Mon · talked to Priya.\n");
  note(root, "projects/two.md", "Project", "Two", "# Notes\n\n- 2026-11-02 · we saw Tessa today.\n\nThe Weather was nice. we called Priya\n");
  return root;
}
const warns = (root: string) => Object.fromEntries(check(root).map((r) => [r.path, r.issues.filter((i) => i.level === "warn").map((i) => i.message)]));

test("check warns when a subject title is plain text and not linked", () => {
  const w = warns(brain());
  assert.deepEqual(w["projects/acme.md"], ["acme.md mentions Omar, not linked."]);
  assert.equal(w["projects/linked.md"], undefined); // already links to Omar
  assert.equal(w["projects/code.md"], undefined); // code and link text are skipped
  assert.equal(w["people/omar.md"], undefined); // the note itself
});

test("check ignores the inbox and the archive for plain mentions", () => {
  const root = brain();
  writeFileSync(join(root, "inbox/c.md"), "---\ntype: Capture\n---\nOmar came by");
  writeFileSync(join(root, ".archive/old.md"), "---\ntype: Note\ntitle: Old\ndescription: x.\n---\nOmar");
  const w = warns(root);
  assert.equal(w["inbox/c.md"], undefined);
  assert.equal(w[".archive/old.md"], undefined);
});

test("check warns once for a name with no note in 2+ subjects, and guesses the kind", () => {
  const all = Object.values(warns(brain())).flat();
  assert.ok(all.some((m) => m === "Priya shows in 2 notes, no note. Make a Person?"));
  assert.ok(all.some((m) => /^Tessa shows in 2 notes, no note\. Make a Person\?/.test(m)));
  assert.ok(!all.some((m) => /^Tessa Park/.test(m))); // only 1 note
  assert.ok(!all.some((m) => /^(Omar|The|Weather|Mon)\b.*no note/.test(m)));
});

test("a name that is more than a first name asks who, where, doing, have, or know", () => {
  const root = brain();
  note(root, "projects/three.md", "Project", "Three", "# Notes\n\n- 2026-11-03 · we visit Art Fundamentals.\n");
  note(root, "projects/four.md", "Project", "Four", "# Notes\n\n- 2026-11-03 · we joined Art Fundamentals.\n");
  const all = Object.values(warns(root)).flat();
  assert.ok(all.includes("Art Fundamentals shows in 2 notes, no note. Make one? Who, where, doing, have, or know?"));
});

test("each warning kind is capped at 10 lines", () => {
  const root = makeBrain();
  const names = "Alma Boris Cedric Dagny Elias Fiona Gwen Hugo Ines Jorah Kira Lenny".split(" ");
  for (const n of ["a", "b"]) note(root, `projects/${n}.md`, "Project", `P${n}`, `# Notes\n\n- 2026-11-01 · Met ${names.join(", ")}.\n`);
  assert.equal(Object.values(warns(root)).flat().filter((m) => /no note/.test(m)).length, 10);
});

test("secondMentions finds a name in new text that already shows in a note", () => {
  const root = brain();
  const m = secondMentions(root, "Ask Priya about Friday. Omar agreed.");
  assert.deepEqual(m.map((x) => [x.name, x.suggest, x.notes]), [["Priya", "Person", ["projects/one.md", "projects/two.md"]]]);
  assert.deepEqual(secondMentions(root, "Ask Zed about Friday"), []);
  assert.deepEqual(secondMentions(root, "Nothing here"), []);
});

test("languages and place words are not guessed as a Person", () => {
  const root = makeBrain();
  for (const n of ["a", "b"]) note(root, `projects/${n}.md`, "Project", `P${n}`, "# Notes\n\n- 2026-11-01 · Talk to Mac and Toronto folks, my English is fine, French too.\n");
  const all = Object.values(warns(root)).flat();
  assert.ok(!all.some((m) => /^(Mac|English|French)\b/.test(m)));
  assert.ok(all.includes("Toronto shows in 2 notes, no note. Make one? Who, where, doing, have, or know?"));
});
