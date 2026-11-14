import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { applyTriage, brainDump, capture, newNote, ruleTags, saveAreaIntake, sortInbox, tagInbox } from "../src/capture/actions.ts";
import { dump, parse, titleOf } from "../src/core/notes.ts";
import { loadAll, readNote } from "../src/core/files.ts";
import { areaBrief, check, todayReport, weeklyReport } from "../src/reports/reports.ts";
import { backlinks, findNote } from "../src/reports/find.ts";
import { loadSchema } from "../src/core/schema.ts";
import { ftsQuery, list, nameTier, search, updateIndex } from "../src/core/search.ts";
import { BIN, STARTER, makeBrain as fixture } from "./fixture.ts";

afterEach(() => delete process.env.BRAIN_TODAY);

function write(root: string, rel: string, text: string) {
  writeFileSync(join(root, rel), text);
}

const proj = (title: string, extra = "") => `---\ntype: Project\ntitle: ${title}\ndescription: About ${title}.\ntags: [client-work]\n${extra}---\n\nBody of ${title}.\n`;

// ---- parsing -----------------------------------------------------------

test("parse and dump round-trip, with dates as strings", () => {
  const { meta, body } = parse("---\ntype: Project\ndue: 2026-12-01\ntags: [a, b]\n---\n\n# Hello\n");
  assert.equal(meta.due, "2026-12-01");
  assert.deepEqual(meta.tags, ["a", "b"]);
  assert.equal(body, "# Hello\n");
  assert.deepEqual(parse(dump(meta, body)).meta, meta);
});

test("parse reports bad frontmatter instead of throwing", () => {
  const r = parse("---\ntype: [oops\n---\nbody");
  assert.match(r.error ?? "", /bad frontmatter/);
});

test("a capture with no title uses its first line", () => {
  const root = fixture();
  const n = capture(root, { text: "Call the accountant\nabout HST" });
  assert.equal(titleOf(n), "Call the accountant");
});

// ---- check -------------------------------------------------------------

test("check finds missing type, unknown tag, missing description, broken link, duplicate title", () => {
  const root = fixture();
  write(root, "inbox/no-type.md", "---\ntitle: x\n---\nhi");
  write(root, "inbox/bad-tag.md", "---\ntype: Capture\ntags: [nope]\n---\nhi");
  write(root, "projects/a.md", "---\ntype: Project\ntitle: Same\n---\n[gone](missing.md)");
  write(root, "projects/b.md", proj("Same"));
  const byPath = Object.fromEntries(check(root).map((r) => [r.path, r.issues.map((i) => i.message).join(" | ")]));
  assert.match(byPath["inbox/no-type.md"], /missing `type`/);
  assert.match(byPath["inbox/bad-tag.md"], /unknown tag `nope`/);
  assert.match(byPath["projects/a.md"], /missing `description`/);
  assert.match(byPath["projects/a.md"], /broken link to projects\/missing.md/);
  assert.match(byPath["projects/b.md"], /same title as projects\/a.md/);
});

// ---- capture, intake ---------------------------------------------------

test("capture writes to inbox and ignores a repeat client id", () => {
  const root = fixture();
  const a = capture(root, { text: "one", clientId: "abc-123" });
  const b = capture(root, { text: "one again", clientId: "abc-123" });
  assert.equal(a.path, b.path);
  assert.equal(loadAll(root).filter((n) => n.path.startsWith("inbox/")).length, 1);
  assert.match(readFileSync(join(root, ".log.jsonl"), "utf8"), /"msg":"added inbox\//);
});

test("brain dump makes one note per line and strips bullets", () => {
  const root = fixture();
  const notes = brainDump(root, "- Book a dentist\n\n2. Renew passport\n  * Send invoice  \n");
  assert.deepEqual(notes.map((n) => n.body.trim()), ["Book a dentist", "Renew passport", "Send invoice"]);
  assert.ok(notes.every((n) => (n.meta.tags as string[]).includes("intake")));
});

test("area intake appends the 5 answers under a dated heading", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  const n = saveAreaIntake(root, "money", ["Saving for a condo", "", "Rates", "Me", "A plan"]);
  delete process.env.BRAIN_TODAY;
  assert.match(n.body, /## Intake 2026-11-04/);
  assert.match(n.body, /Saving for a condo/);
  assert.match(n.body, /_No answer._/);
  assert.equal(n.meta.type, "Area");
});

// ---- tag, sort, triage -------------------------------------------------

test("tag rules match whole words and only add known tags", () => {
  const root = fixture();
  writeFileSync(join(root, ".schema/rules.yaml"), "rules:\n  - match: [contentful, HST]\n    tags: [money, not-a-tag]\n");
  const schema = loadSchema(root);
  assert.deepEqual(ruleTags("ask the Contentful rep", schema), ["money"]);
  assert.deepEqual(ruleTags("contentfulness", schema), []);
  capture(root, { text: "Send the HST form" });
  const r = tagInbox(root);
  assert.equal(r.length, 1);
  assert.deepEqual(readNote(root, r[0].path).meta.tags, ["money"]);
});

test("sort files complete notes and leaves the rest", () => {
  const root = fixture();
  write(root, "inbox/ready.md", proj("Ready one"));
  write(root, "inbox/no-desc.md", "---\ntype: Note\ntitle: Half done\n---\nx");
  capture(root, { text: "still a capture" });
  const r = sortInbox(root);
  assert.equal(r.find((x) => x.path === "inbox/ready.md")?.to, "projects/ready-one.md");
  assert.match(r.find((x) => x.path === "inbox/no-desc.md")?.reason ?? "", /description/);
  assert.ok(existsSync(join(root, "projects/ready-one.md")));
  assert.ok(!existsSync(join(root, "inbox/ready.md")));
});

test("triage drop moves to archive, never deletes", () => {
  const root = fixture();
  const n = capture(root, { text: "Learn the banjo" });
  const r = applyTriage(root, n.path, { outcome: "drop" });
  assert.ok(r.to?.startsWith(".archive/"));
  assert.equal(readNote(root, r.to!).meta.outcome, "drop");
  assert.ok(!existsSync(join(root, n.path)));
});

test("triage with a type, title and description files the note", () => {
  const root = fixture();
  const n = capture(root, { text: "Book a dentist" });
  const r = applyTriage(root, n.path, { outcome: "date", type: "Note", area: "health", title: "Book a dentist", description: "Six-month check-up.", due: "2026-11-20" });
  assert.equal(r.to, "resources/book-a-dentist.md");
  const meta = readNote(root, r.to!).meta;
  assert.equal(meta.due, "2026-11-20");
  assert.equal(meta.area, "health");
  assert.deepEqual(check(root), []);
});

test("triage with no type keeps the note in inbox with its outcome", () => {
  const root = fixture();
  const n = capture(root, { text: "Think about a podcast" });
  const r = applyTriage(root, n.path, { outcome: "someday", area: "personal-projects" });
  assert.equal(r.to, undefined);
  assert.equal(readNote(root, n.path).meta.outcome, "someday");
});

test("new note uses the template and lands in the right folder", () => {
  const root = fixture();
  const n = newNote(root, "Person", "Sam Lee", { description: "Accountant." });
  assert.equal(n.path, "people/sam-lee.md");
  assert.match(n.body, /# How we know each other/);
  assert.equal(n.meta.description, "Accountant.");
  assert.match(n.body, /# People\n\n# Groups\n\n# Projects/);
});

for (const [type, path, heading] of [
  ["Group", "groups/test.md", "# Projects"],
  ["Place", "places/test.md", "# What"],
  ["Thing", "things/test.md", "# What"],
  ["Topic", "topics/test.md", "# Related"],
] as const) {
  test(`new ${type} uses its template and folder`, () => {
    const root = fixture();
    const n = newNote(root, type, "Test", { description: "x" });
    assert.equal(n.path, path);
    assert.equal(n.meta.type, type);
    assert.ok(n.body.includes(heading));
    assert.match(n.body, /# To-dos/);
    if (type === "Thing") assert.ok("renews" in n.meta && "from" in n.meta && "papers" in n.meta);
  });
}

// ---- search ------------------------------------------------------------

test("fts query escapes input and makes the last word a prefix", () => {
  assert.equal(ftsQuery(`hst "OR" (x`), `"hst" "OR" "x"*`);
  assert.equal(ftsQuery("  "), "");
});

test("search finds by word and prefix, filters, and follows changes", () => {
  const root = fixture();
  write(root, "projects/site.md", proj("Website 2.0", "area: client-work\n"));
  write(root, "projects/condo.md", proj("Condo search").replace("client-work", "home"));
  capture(root, { text: "Ask about the Contentful invoice", tags: ["business-admin"] });
  assert.equal(search(root, "website")[0].path, "projects/site.md");
  assert.equal(search(root, "contentf")[0].type, "Capture");
  assert.equal(search(root, "body", { tag: "home" }).length, 1);
  assert.equal(search(root, "", { type: "Project" }).length, 2);

  write(root, "projects/condo.md", proj("Condo search").replace("Body of", "Pre-construction in High Park,"));
  utimesSync(join(root, "projects/condo.md"), new Date(), new Date(Date.now() + 5000));
  assert.equal(search(root, "high park")[0].path, "projects/condo.md");
  assert.match(search(root, "park")[0].snippet, /\[Park\]/);
  assert.equal(updateIndex(root).updated, 0); // search already picked up the change
  assert.equal(list(root, { area: "client-work" }).some((s) => s.path === "projects/site.md"), true);
});

test("search puts the note named by the query first", () => {
  const root = fixture();
  const person = (title: string, body: string, extra = "") => `---\ntype: Person\ntitle: ${title}\ndescription: A person.\n${extra}---\n\n# Notes\n\n${body}\n`;
  write(root, "people/nadia-khan.md", person("Nadia", "Omar and Omar and Omar. Omar again, Omar."));
  write(root, "people/omar-haddad.md", person("Omar", "Friend."));
  write(root, "people/sam-lee.md", person("Sam", "Friend.", "aliases: [Sammy]\n"));
  assert.equal(search(root, "Omar")[0].path, "people/omar-haddad.md");
  assert.equal(search(root, "haddad")[0].path, "people/omar-haddad.md"); // file name counts as a name
  assert.equal(search(root, "oma")[0].path, "people/omar-haddad.md"); // prefix of a name
  assert.equal(search(root, "sammy")[0].path, "people/sam-lee.md"); // alias
  assert.equal(nameTier("Omar Haddad", "Omar", ["omar haddad"]), 0);

  // Filed captures (intake answers, sweeps) are raw copies: hidden unless all is set.
  write(root, ".archive/relations-sweep.md", "---\ntype: Capture\n---\n\nOmar sweep candidates.\n");
  assert.equal(search(root, "sweep").length, 0);
  assert.equal(search(root, "sweep", { all: true })[0].path, ".archive/relations-sweep.md");
});

// ---- reports -----------------------------------------------------------

test("today lists overdue, due soon, today and active projects", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  write(root, "projects/a.md", proj("Late", "due: 2026-11-01\n"));
  write(root, "projects/b.md", proj("Soon", "due: 2026-11-09\noutcome: today\n"));
  write(root, "projects/c.md", proj("Later", "due: 2026-12-25\n"));
  write(root, "projects/d.md", proj("Dropped", "due: 2026-11-02\nstatus: deprecated\n"));
  capture(root, { text: "x" });
  const r = todayReport(root);
  delete process.env.BRAIN_TODAY;
  assert.deepEqual(r.overdue.map((s) => s.title), ["Late"]);
  assert.deepEqual(r.dueSoon.map((s) => s.title), ["Soon"]);
  assert.deepEqual(r.activeProjects.map((s) => s.title), ["Late", "Later", "Soon"]);
  assert.equal(r.inboxCount, 1);
});

test("weekly lists stale notes, quiet projects, helper notes and parked items", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  write(root, "projects/old.md", proj("Old one", "stale_after: 2026-10-01\n"));
  utimesSync(join(root, "projects/old.md"), new Date("2026-10-01"), new Date("2026-10-01"));
  write(root, "resources/ai.md", "---\ntype: Note\ntitle: AI wrote this\ndescription: x\ngenerated: { by: claude, at: 2026-11-01 }\n---\nx");
  write(root, "resources/parked.md", "---\ntype: Note\ntitle: Parked idea\ndescription: x\noutcome: someday\n---\nx");
  const r = weeklyReport(root);
  delete process.env.BRAIN_TODAY;
  assert.deepEqual(r.stale.map((s) => s.title), ["Old one"]);
  assert.equal(r.quietProjects[0].title, "Old one");
  assert.ok(r.quietProjects[0].days >= 14);
  assert.deepEqual(r.unverified.map((s) => s.title), ["AI wrote this"]);
  assert.deepEqual(r.parked.map((s) => s.title), ["Parked idea"]);
});

test("area brief collects notes by area field or tag", () => {
  const root = fixture();
  write(root, "projects/site.md", proj("Website 2.0", "area: client-work\noutcome: today\n"));
  const b = areaBrief(root, "client-work");
  assert.equal(b.note?.title, "Client work");
  assert.deepEqual(b.projects.map((s) => s.title), ["Website 2.0"]);
  assert.deepEqual(b.open.map((s) => s.title), ["Website 2.0"]);
});

test("show finds a note by title and lists backlinks", () => {
  const root = fixture();
  write(root, "projects/site.md", proj("Website 2.0"));
  write(root, "resources/dec.md", "---\ntype: Note\ntitle: Use Astro\ndescription: x\n---\nFor [the site](../projects/site.md).");
  const notes = loadAll(root);
  assert.equal(findNote(notes, "website 2.0")?.path, "projects/site.md");
  assert.deepEqual(backlinks(notes, "projects/site.md").map((s) => s.title), ["Use Astro"]);
});

// ---- the command itself ------------------------------------------------

function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, ...args], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });
}

test("brain command: add, find --json, today, check exit codes", () => {
  const root = fixture();
  assert.equal(run(root, "add", "Pay the HST", "--tag", "business-admin").status, 0);
  const found = JSON.parse(run(root, "find", "hst", "--json").stdout);
  assert.equal(found[0].tags[0], "business-admin");
  assert.equal(run(root, "today").status, 0);
  assert.ok(existsSync(join(root, ".reports/today.md")));
  assert.equal(run(root, "check").status, 0);
  write(root, "inbox/bad.md", "no frontmatter");
  assert.equal(run(root, "check").status, 1);
  assert.equal(run(root, "nope").status, 1);
  assert.equal(run(root, "index").status, 0);
  assert.match(readFileSync(join(root, ".reports/index.md"), "utf8"), new RegExp(`## areas \\(${readdirSync(join(STARTER, "areas")).filter((f) => f.endsWith(".md")).length}\\)`));
  assert.match(readFileSync(join(root, ".reports/index.md"), "utf8"), /\]\(\.\.\/areas\/money\.md\)/);
  assert.ok(readdirSync(join(root, ".brain")).includes("index.db"));
});

// ---- SwiftBar ----------------------------------------------------------

test("swiftbar: the icon shows the inbox count and opens the web app in a popover", async () => {
  const { render, WEB_URL } = await import("../src/interface/swiftbar.ts");
  const root = fixture();
  assert.equal(render(root), ` | sfimage=scribble href=${WEB_URL}/today webview=true webvieww=400 webviewh=680`, "no number when the inbox is empty");
  capture(root, { text: "x" });
  capture(root, { text: "y" });
  const menu = render(root);
  assert.match(menu, /^2 \| sfimage=scribble href=http:\/\/127\.0\.0\.1:8787\/today webview=true /);
  assert.ok(!menu.includes("\n"), "one line: no dropdown menu");
});
