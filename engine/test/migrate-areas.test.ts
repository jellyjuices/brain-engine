import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { migrateAreasGeneral } from "../migrations/2026-11-14-areas-general.ts";
import { BIN, makeBrain } from "./fixture.ts";

const git = (root: string, ...args: string[]) => execFileSync("git", ["-C", root, ...args], { stdio: "ignore" });

function put(root: string, rel: string, text: string) {
  writeFileSync(join(root, rel), text);
}

function brain(): string {
  const root = makeBrain();
  unlinkSync(join(root, "areas/general.md"));
  put(root, "people/sam-rivers.md", "---\ntype: Person\ntitle: Sam Rivers\ndescription: A sample friend.\n---\n\n# Who\n\n# To-dos\n");
  put(root, "projects/garden.md", "---\ntype: Project\ntitle: Garden Beds\ndescription: A sample project.\narea: home\nstatus: active\n---\n\n# Open loops\n\n- [ ] Buy soil · today\n- [ ] Water beds · park · zz-custom thing\n- [ ] Call shop · hand-off · due 2026-12-01\n- [ ] Plant seeds · schedule · due 2026-12-02\n\n# Open threads\n\n- [ ] Which plants? · parked\n");
  put(root, "goals/run.md", "---\ntype: Goal\ntitle: Run far\ndescription: A sample goal.\nstatus: active\n---\n\n# Why\n\n# Targets\n\n# Wins\n\n# Notes\n");
  put(root, ".archive/old.md", "---\ntype: Project\ntitle: Old\ndescription: An old project.\n---\n\n# Open loops\n\n- [ ] Old task · do-now\n");
  put(root, "inbox/2026-11-01-sam.md", "---\ntype: Capture\ncreated: 2026-11-01T10:00\n---\n\nAsk Sam Rivers about the bikes\n");
  put(root, "inbox/2026-11-02-tagged.md", "---\ntype: Capture\ncreated: 2026-11-02T10:00\ntags: [home]\n---\n\nAsk Sam Rivers about the garden\n");
  git(root, "init", "-q");
  git(root, "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=T", "commit", "-qm", "start");
  return root;
}

const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

test("T6: the dry run lists changes and writes nothing", () => {
  const root = brain();
  const before = read(root, "projects/garden.md");
  const r = migrateAreasGeneral(root);
  assert.equal(r.wrote, false);
  assert.equal(read(root, "projects/garden.md"), before);
  assert.equal(existsSync(join(root, "areas/general.md")), false);
  assert.equal(existsSync(join(root, "inbox/2026-11-01-sam.md")), true);
  const kinds = [...new Set(r.changes.map((c) => c.kind))].sort();
  assert.deepEqual(kinds, ["area", "capture", "general", "heading", "token"]);
});

test("T6: --write applies the 4 changes and keeps unknown tokens", () => {
  const root = brain();
  const r = migrateAreasGeneral(root, { write: true });
  assert.equal(r.wrote, true);
  const garden = read(root, "projects/garden.md");
  assert.match(garden, /^areas: \[home\]$/m);
  assert.doesNotMatch(garden, /^area:/m);
  assert.match(garden, /^# To-dos$/m);
  assert.doesNotMatch(garden, /# Open loops/);
  assert.match(garden, /^- \[ \] Buy soil$/m);
  assert.match(garden, /^- \[ \] Water beds · someday · zz-custom thing$/m);
  assert.match(garden, /^- \[ \] Call shop · waiting · due 2026-12-01$/m);
  assert.match(garden, /^- \[ \] Plant seeds · due 2026-12-02$/m);
  assert.match(garden, /^- \[ \] Which plants\? · parked$/m);
  assert.match(read(root, ".archive/old.md"), /^# To-dos\n\n- \[ \] Old task$/m);
  const general = read(root, "areas/general.md");
  assert.match(general, /^title: General$/m);
  assert.match(general, /^- \[ \] Ask Sam Rivers about the bikes · with \[Sam Rivers\]\(\.\.\/people\/sam-rivers\.md\)$/m);
  assert.equal(existsSync(join(root, "inbox/2026-11-01-sam.md")), false);
  assert.equal(existsSync(join(root, "inbox/2026-11-02-tagged.md")), true);
});

test("T6: the owner lists name a goal with no areas and undated to-dos", () => {
  const root = brain();
  const { lists } = migrateAreasGeneral(root);
  assert.deepEqual(lists.needsAreas, ["goals/run.md"]);
  assert.deepEqual(lists.undated.sort(), [".archive/old.md:9", "projects/garden.md:11"]);
});

test("T6: a second --write run changes nothing", () => {
  const root = brain();
  migrateAreasGeneral(root, { write: true });
  git(root, "add", "-A");
  git(root, "-c", "user.email=t@example.com", "-c", "user.name=T", "commit", "-qm", "migrated");
  const again = migrateAreasGeneral(root, { write: true });
  assert.deepEqual(again.changes, []);
  assert.equal(spawnSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8" }).stdout, "");
});

test("T6: --write refuses a dirty notes folder", () => {
  const root = brain();
  put(root, "people/new.md", "---\ntype: Person\ntitle: New\ndescription: x\n---\n");
  const before = read(root, "projects/garden.md");
  const r = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "migrate", "areas-general", "--write"], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Did not write/);
  assert.equal(read(root, "projects/garden.md"), before);
});
