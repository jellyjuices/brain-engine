import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { loopsIn } from "../src/todos/todos.ts";
import { fieldsOf, formatTodoLine, parseTodoLine, tickTodo } from "../shared/line/index.ts";
import { readNote } from "../src/core/files.ts";
import { parseRelationLine, relationsIn } from "../src/core/relations.ts";
import { search } from "../src/core/search.ts";
import { relationsOf, todosNaming } from "../src/core/index-links.ts";
import { makeBrain } from "./fixture.ts";

function note(root: string, rel: string, type: string, title: string, body: string) {
  writeFileSync(join(root, rel), `---\ntype: ${type}\ntitle: ${title}\ndescription: ${title} note.\n---\n\n${body}\n`);
}

test("a relation line gives the link, role and time", () => {
  assert.deepEqual(parseRelationLine("projects/acme.md", "# People", "- [Omar](../people/omar.md) · co-founder · since 2025"), {
    from: "projects/acme.md", to: "people/omar.md", heading: "People", role: "co-founder", time: "since 2025",
  });
  assert.deepEqual(parseRelationLine("projects/acme.md", "# People", "- [Omar](../people/omar.md)"), { from: "projects/acme.md", to: "people/omar.md", heading: "People" });
  assert.equal(parseRelationLine("projects/x.md", "# People", "- Omar · co-founder"), null);
  assert.equal(parseRelationLine("projects/x.md", "# People", "- [Omar](../people/omar.md) said hi"), null);
});

test("relations are read only under relation headings", () => {
  const root = makeBrain();
  note(root, "projects/acme.md", "Project", "Acme", "# Summary\n\n- [Mom](../people/mom.md) · not a relation\n\n# People\n\n- [Omar](../people/omar.md) · co-founder\n\n# Groups\n\n- [Studio](../groups/studio.md)\n");
  const rels = relationsIn(readNote(root, "projects/acme.md"));
  assert.deepEqual(rels.map((r) => [r.to, r.heading, r.role]), [["people/omar.md", "People", "co-founder"], ["groups/studio.md", "Groups", undefined]]);
});

test("with and re parts are parsed and kept when a line is rewritten", () => {
  const line = "- [ ] Ask about Advil · with [Dr Lee](../people/dr-lee.md) · re [Advil](../topics/advil.md) · due 2026-11-20";
  const l = parseTodoLine(line)!;
  const fields = fieldsOf(l);
  assert.equal(fields.text, "Ask about Advil");
  assert.deepEqual(fields.with, ["[Dr Lee](../people/dr-lee.md)"]);
  assert.deepEqual(fields.re, ["[Advil](../topics/advil.md)"]);
  assert.equal(formatTodoLine(l), line);
  const done = formatTodoLine(tickTodo(l, "2026-11-21"));
  assert.match(done, /^- \[x\] Ask about Advil · with \[Dr Lee\]\(\.\.\/people\/dr-lee\.md\) · re \[Advil\]/);
});

test("the index finds relations both ways and to-dos that name a subject", async () => {
  const root = makeBrain();
  note(root, "people/omar.md", "Person", "Omar", "# Notes\n");
  note(root, "topics/advil.md", "Topic", "Advil", "# Summary\n");
  note(root, "projects/acme.md", "Project", "Acme", "# People\n\n- [Omar](../people/omar.md) · co-founder · since 2025\n");
  note(root, "areas/health.md", "Area", "Health", "# To-dos\n\n- [ ] Ask about Advil · re [Advil](../topics/advil.md)\n- [x] Old one · re [Advil](../topics/advil.md) · done 2026-01-01\n");
  assert.deepEqual(loopsIn(readNote(root, "areas/health.md"))[0].subjects, ["topics/advil.md"]);

  const omar = relationsOf(root, "people/omar.md");
  assert.equal(omar.out.length, 0);
  assert.deepEqual(omar.in.map((r) => [r.from, r.role, r.time]), [["projects/acme.md", "co-founder", "since 2025"]]);
  assert.deepEqual(relationsOf(root, "projects/acme.md").out.map((r) => r.to), ["people/omar.md"]);

  assert.deepEqual(todosNaming(root, "topics/advil.md", { done: false }), [{ path: "areas/health.md", text: "Ask about Advil", done: false }]);
  assert.equal(todosNaming(root, "topics/advil.md").length, 2);

  // A change to the file updates the index.
  note(root, "projects/acme.md", "Project", "Acme", "# People\n");
  const later = Date.now() / 1000 + 5;
  (await import("node:fs")).utimesSync(join(root, "projects/acme.md"), later, later);
  assert.equal(relationsOf(root, "people/omar.md").in.length, 0);
});

test("find ranks archived notes last", () => {
  const root = makeBrain();
  note(root, ".archive/old-dentist.md", "Note", "Dentist dentist dentist", "dentist dentist dentist");
  note(root, "resources/dentist.md", "Note", "Dentist plan", "Book a visit.");
  const hits = search(root, "dentist");
  assert.deepEqual(hits.map((h) => h.path), ["resources/dentist.md", ".archive/old-dentist.md"]);
  assert.deepEqual(search(root, "").map((h) => h.path).at(-1), ".archive/old-dentist.md");
});
