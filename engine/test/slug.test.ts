import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { withApi } from "./api-helpers.ts";
import { slugify } from "../src/core/files.ts";

test("slugify keeps Japanese letters", () => {
  assert.equal(slugify("日本語の勉強"), "日本語の勉強");
  assert.equal(slugify("東京 旅行 2027"), "東京-旅行-2027");
});

test("slugify keeps Japanese dakuten and stays stable", () => {
  const slug = slugify("がっこう ぱん");
  assert.equal(slug, "がっこう-ぱん");
  assert.equal(slug, slug.normalize("NFC"));
  assert.equal(slugify("がっこう"), slugify("がっこう"));
});

test("slugify folds Latin accents", () => {
  assert.equal(slugify("Canción de la Mañana"), "cancion-de-la-manana");
  assert.equal(slugify("Crème brûlée"), "creme-brulee");
});

test("slugify keeps mixed scripts", () => {
  assert.equal(slugify("Tokyo 東京 trip"), "tokyo-東京-trip");
  assert.equal(slugify("Привет, мир"), "привет-мир");
});

test("slugify falls back to note when no letter or digit is left", () => {
  assert.equal(slugify("🎉🎉"), "note");
  assert.equal(slugify("  --  "), "note");
});

test("slugify cuts on whole characters", () => {
  const slug = slugify("あ".repeat(100), 10);
  assert.equal(Array.from(slug).length, 10);
});

test("a Japanese note can be made, read, linked and found by its path", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/notes", { type: "Topic", title: "日本語の勉強", description: "Study notes." });
  assert.equal(made.data.path, "topics/日本語の勉強.md");
  assert.equal(existsSync(join(a.root, made.data.path)), true, `${made.data.path} is missing`);
  const read = await a.call("GET", `/api/notes/${encodeURIComponent(made.data.path).replace(/%2F/g, "/")}`);
  assert.equal(read.status, 200);
  assert.equal(read.data.path, made.data.path);
  const link = await a.call("POST", "/api/relations", { from: "projects/garden-shed.md", to: made.data.path });
  assert.equal(link.data.created, true);
  const back = await a.call("GET", `/api/relations?path=${encodeURIComponent(made.data.path)}`);
  assert.equal(back.data.in.length, 1);
  const twice = await a.call("POST", "/api/notes", { type: "Topic", title: "日本語の勉強" });
  assert.equal(twice.data.created, false);
}));
