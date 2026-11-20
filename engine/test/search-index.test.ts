import { test } from "node:test";
import assert from "node:assert/strict";
import { unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { embedPending, loadEmbedder, type Embedder } from "../src/core/embed.ts";
import { find, findEntries, list, search, updateIndex } from "../src/core/search.ts";
import { makeBrain } from "./fixture.ts";

const CONCEPTS: Record<string, number> = {
  dentist: 0, teeth: 0, tooth: 0, molar: 0, cleaning: 0,
  car: 1, tires: 1, mechanic: 1, oil: 1,
  birthday: 2, party: 2, cake: 2, gift: 2,
  money: 3, rent: 3, invoice: 3, budget: 3,
};

const fake: Embedder = {
  model: "fake-model",
  async embed(texts) {
    return texts.map((text) => {
      const vector = new Array<number>(6).fill(0);
      for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
        const slot = CONCEPTS[word];
        if (slot !== undefined) vector[slot] = (vector[slot] ?? 0) + 1;
      }
      return vector;
    });
  },
};

const YEAR_2100 = 4_102_444_800;
let tick = 0;
function write(root: string, rel: string, title: string, body: string, extra = "") {
  const full = join(root, rel);
  writeFileSync(full, `---\ntype: Note\ntitle: ${title}\ndescription: A test note.\n${extra}---\n\n${body}\n`);
  const later = YEAR_2100 + tick++;
  utimesSync(full, later, later);
}

function brain(): string {
  const root = makeBrain();
  write(root, "resources/health.md", "Health", "# Notes\n\nMolar pain on the left side. Book a cleaning soon.\n\n# Doctor\n\nEl médico dijo que descanse.");
  write(root, "resources/garage.md", "Garage", "# Notes\n\nThe mechanic said the tires are worn.\n\n- [ ] Book an appointment for the oil change");
  write(root, "resources/japan.md", "Japan trip", "# Notes\n\n歯医者の予約は月曜日。\n\n東京で友達に会う。");
  write(root, "resources/party.md", "Party plan", "# Notes\n\nBuy a cake and a gift for the party.");
  write(root, "resources/flat.md", "Flat", "# Notes\n\nRent is due on the first. Keep a budget sheet.");
  write(root, "people/omar-haddad.md", "Omar", "# Notes\n\nFriend from the gym.");
  write(root, "people/nadia-khan.md", "Nadia", "# Notes\n\nOmar said the dentist is good. Omar again.");
  return root;
}

const paths = (hits: { path: string }[]) => hits.map((hit) => hit.path);

test("entries change only where the hash changed, and deleted entries go", async () => {
  const root = brain();
  const first = updateIndex(root);
  assert.ok(first.entries.added > 10, `got ${first.entries.added}`);
  assert.equal(await embedPending(root, fake), first.entries.added);

  write(root, "resources/flat.md", "Flat", "# Notes\n\nRent is due on the fifth. Keep a budget sheet.");
  const second = updateIndex(root);
  assert.deepEqual(second.entries, { added: 0, changed: 1, removed: 0 });
  assert.equal(await embedPending(root, fake), 1);
  assert.equal(await embedPending(root, fake), 0);

  unlinkSync(join(root, "resources/party.md"));
  const third = updateIndex(root);
  assert.equal(third.entries.removed, 2);
  const db = new DatabaseSync(join(root, ".brain", "index.db"));
  const orphans = db.prepare("SELECT count(*) AS n FROM vectors WHERE id NOT IN (SELECT id FROM entries)").get() as { n: number };
  db.close();
  assert.equal(orphans.n, 0);
});

test("words and strings find accents, typos and Japanese", () => {
  const root = brain();
  assert.equal(search(root, "medico")[0]?.path, "resources/health.md");
  assert.equal(search(root, "médico")[0]?.path, "resources/health.md");
  assert.equal(search(root, "apointment")[0]?.path, "resources/garage.md");
  assert.equal(search(root, "歯医者")[0]?.path, "resources/japan.md");
  assert.equal(search(root, "東京")[0]?.path, "resources/japan.md");
  assert.equal(search(root, "友達")[0]?.path, "resources/japan.md");
});

test("a meaning-only match joins the results, and the answer card cites it", async () => {
  const root = brain();
  updateIndex(root);
  await embedPending(root, fake);
  assert.deepEqual(paths(search(root, "teeth")).filter((w) => w === "resources/health.md"), []);
  const result = await find(root, "teeth", {}, fake);
  assert.equal(result.meaning, "query");
  assert.deepEqual(["resources/health.md"].filter((w) => !paths(result.notes).includes(w)), []);
  assert.equal(result.answer?.path, result.hits[0]?.entry.subject);
});

test("fused search beats words only on a small set", async () => {
  const root = brain();
  updateIndex(root);
  await embedPending(root, fake);
  const set: [string, string][] = [["tooth", "resources/health.md"], ["car", "resources/garage.md"], ["birthday", "resources/party.md"], ["money", "resources/flat.md"], ["mechanic", "resources/garage.md"]];
  const recall = async (fused: boolean) => {
    let found = 0;
    for (const [q, want] of set) {
      const result = fused ? await find(root, q, {}, fake) : findEntries(root, q, {}, { model: "none" });
      if (paths(result.notes).slice(0, 3).includes(want)) found++;
    }
    return found;
  };
  const words = await recall(false);
  const fused = await recall(true);
  assert.ok(fused > words, `fused ${fused} should beat words ${words}`);
  assert.equal(fused, set.length);
});

test("with no embedder, search still answers on words and strings", async () => {
  const root = brain();
  const result = await find(root, "tires", {}, null);
  assert.equal(result.meaning, "off");
  assert.equal(result.notes[0]?.path, "resources/garage.md");
  await embedPending(root, fake);
  const nearby = findEntries(root, "tires", {}, { model: fake.model });
  assert.equal(nearby.meaning, "nearby");
  assert.equal(nearby.notes[0]?.path, "resources/garage.md");
});

test("the name tier stays on top with meaning in play", async () => {
  const root = brain();
  updateIndex(root);
  await embedPending(root, fake);
  assert.equal((await find(root, "Omar", {}, fake)).notes[0]?.path, "people/omar-haddad.md");
  assert.equal((await find(root, "haddad", {}, fake)).notes[0]?.path, "people/omar-haddad.md");
});

test("the embedder is null when the package cannot be imported or the model cannot load", async () => {
  assert.equal(await loadEmbedder(async () => { throw new Error("Cannot find package"); }), null);
  const offline = { env: { cacheDir: null, allowRemoteModels: true }, pipeline: async () => { throw new Error("offline"); } };
  assert.equal(await loadEmbedder(async () => offline), null);
  assert.equal(offline.env.allowRemoteModels, process.env.BRAIN_MODEL_FETCH === "1");
});

test("a note with several areas is found by each area", () => {
  const root = brain();
  write(root, "resources/shared.md", "Shared plan", "# Notes\n\nPlan the shared garden.", "areas: [home, health]\n");
  for (const area of ["home", "health"]) {
    assert.deepEqual(["resources/shared.md"].filter((w) => !paths(search(root, "garden", { area })).includes(w)), [], `search --area ${area}`);
    assert.deepEqual(["resources/shared.md"].filter((w) => !paths(list(root, { area })).includes(w)), [], `list --area ${area}`);
  }
  assert.deepEqual(paths(search(root, "garden", { area: "money" })).filter((w) => w === "resources/shared.md"), []);
});

test("an old index rebuilds itself once, and --full rebuilds all", () => {
  const root = brain();
  const total = updateIndex(root).entries.added;
  const db = new DatabaseSync(join(root, ".brain", "index.db"));
  db.exec("PRAGMA user_version = 3; CREATE VIRTUAL TABLE IF NOT EXISTS fts USING fts5(path, body);");
  db.close();
  assert.equal(updateIndex(root).entries.added, total);
  assert.equal(updateIndex(root).entries.added, 0);
  assert.equal(updateIndex(root, true).entries.added, total);
  const check = new DatabaseSync(join(root, ".brain", "index.db"));
  const version = check.prepare("PRAGMA user_version").get() as { user_version: number };
  const old = check.prepare("SELECT name FROM sqlite_master WHERE name = 'fts'").get();
  check.close();
  assert.equal(version.user_version, 4);
  assert.equal(old, undefined);
});
