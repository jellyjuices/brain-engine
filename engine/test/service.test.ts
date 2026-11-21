import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { startService, stopService, type Run } from "../src/interface/service.ts";

function fakeLaunchd(loaded = new Set<string>()) {
  const calls: string[] = [];
  const run: Run = ([cmd, a, b]) => {
    calls.push([cmd, a, b].filter(Boolean).join(" "));
    const label = (s: string) => s.split("/").pop()!.replace(/\.plist$/, "");
    if (cmd === "print") return { ok: loaded.has(label(a)), out: "" };
    if (cmd === "bootstrap") return loaded.add(label(b)), { ok: true, out: "" };
    if (cmd === "bootout") return loaded.delete(label(a)), { ok: true, out: "" };
    return { ok: true, out: "" };
  };
  return { run, calls, loaded };
}

function agents(...jobs: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "brain-agents-"));
  for (const j of jobs) writeFileSync(join(dir, `${j}.plist`), "<plist/>");
  return dir;
}

const base = { uid: 501, sleep: async () => {} };

test("serve enables and loads both jobs, then says it is on", async () => {
  const l = fakeLaunchd();
  const r = await startService({ ...base, run: l.run, agentsDir: agents("com.brain.serve", "com.brain.tunnel"), health: async () => true });
  assert.equal(r.ok, true);
  assert.deepEqual(r.lines, ["Device access is on."]);
  assert.deepEqual(["enable gui/501/com.brain.serve"].filter((v) => !l.calls.includes(v)), []);
  assert.deepEqual(["enable gui/501/com.brain.tunnel"].filter((v) => !l.calls.includes(v)), []);
  assert.deepEqual([...l.loaded].sort(), ["com.brain.serve", "com.brain.tunnel"]);
});

test("serve leaves a job that is already running alone", async () => {
  const l = fakeLaunchd(new Set(["com.brain.serve"]));
  await startService({ ...base, run: l.run, agentsDir: agents("com.brain.serve", "com.brain.tunnel"), health: async () => true });
  assert.deepEqual(l.calls.filter((c) => c.startsWith("bootstrap") && c.includes("com.brain.serve")), []);
});

test("serve without setup says to run setup.sh", async () => {
  const l = fakeLaunchd();
  const r = await startService({ ...base, run: l.run, agentsDir: agents(), health: async () => true });
  assert.equal(r.ok, false);
  assert.match(r.lines[0], /setup\.sh/);
  assert.equal(l.calls.length, 0);
});

test("serve without a tunnel still starts the server and says so", async () => {
  const l = fakeLaunchd();
  const r = await startService({ ...base, run: l.run, agentsDir: agents("com.brain.serve"), health: async () => true });
  assert.equal(r.ok, false);
  assert.equal(r.lines[0], "Device access is on.");
  assert.match(r.lines[1], /tunnel is not set up/);
});

test("kill unloads and disables both jobs", async () => {
  const l = fakeLaunchd(new Set(["com.brain.serve", "com.brain.tunnel"]));
  const r = await stopService({ ...base, run: l.run });
  assert.equal(r.ok, true);
  assert.equal(l.loaded.size, 0);
  assert.deepEqual(["disable gui/501/com.brain.serve"].filter((v) => !l.calls.includes(v)), []);
  assert.deepEqual(["disable gui/501/com.brain.tunnel"].filter((v) => !l.calls.includes(v)), []);
  assert.match(r.lines[0], /off/);
});
