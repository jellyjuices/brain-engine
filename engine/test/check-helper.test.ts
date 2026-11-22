import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { check } from "../src/reports/reports.ts";
import { makeBrain, TEST_CONFIG } from "./fixture.ts";

const helperWarns = (lines: string) => {
  mkdirSync(TEST_CONFIG, { recursive: true });
  writeFileSync(join(TEST_CONFIG, "env"), lines);
  return check(makeBrain()).filter((r) => r.path === "BRAIN_HELPER_URL");
};

test("check says why the home helper is off when the address is not on this home server", () => {
  const found = helperWarns("BRAIN_HELPER_URL=http://192.168.1.20:11434\nBRAIN_HELPER_MODEL=qwen3.6:35b-mlx\n");
  assert.equal(found.length, 1);
  assert.equal(found[0].issues[0].level, "warn");
  assert.match(found[0].issues[0].message, /home helper is off/);
});

test("check is quiet when the home helper address is on this home server", () => {
  assert.deepEqual(helperWarns("BRAIN_HELPER_URL=http://127.0.0.1:11434\nBRAIN_HELPER_MODEL=qwen3.6:35b-mlx\n"), []);
});

test("check is quiet when the home helper is not set", () => {
  assert.deepEqual(helperWarns("NODE=x\n"), []);
});
