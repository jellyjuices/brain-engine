import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

const script = join(import.meta.dirname, "..", "..", "ops", "scripts", "privacy-check.mjs");
const dirs: string[] = [];

function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "privacy-"));
  dirs.push(dir);
  execFileSync("git", ["init", "-q"], { cwd: dir });
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  execFileSync("git", ["add", "."], { cwd: dir });
  return dir;
}

function run(root: string, words: string | null) {
  const dir = mkdtempSync(join(tmpdir(), "privacy-words-"));
  dirs.push(dir);
  const list = join(dir, "words.txt");
  if (words !== null) writeFileSync(list, words);
  return spawnSync("node", [script], {
    encoding: "utf8",
    env: {
      ...process.env,
      BRAIN_PRIVACY_ROOT: root,
      BRAIN_PRIVACY_WORDS: list,
    },
  });
}

after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

describe("privacy-check", () => {
  it("fails with file:line on a hit, ignoring case", () => {
    const root = repo({ "a.md": "fine\nvisit Sample Street\n" });
    const result = run(root, "sample street\n");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /a\.md:2:/);
  });

  it("passes when nothing matches", () => {
    const root = repo({ "a.md": "all clean\n" });
    assert.equal(run(root, "secret\n").status, 0);
  });

  it("skips node_modules and lock files", () => {
    const root = repo({
      "node_modules/x.js": "secret\n",
      "package-lock.json": "secret\n",
    });
    assert.equal(run(root, "secret\n").status, 0);
  });

  it("warns and exits 0 when the word list is missing", () => {
    const root = repo({ "a.md": "secret\n" });
    const result = run(root, null);
    assert.equal(result.status, 0);
    assert.match(result.stderr, /no word list/);
  });
});
