import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { TAKE_TRY } from "../src/auth.ts";

const WINDOW = 15 * 60;
const START = Date.UTC(2026, 10, 14, 9, 30) / 1000;

function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  return db;
}

function takeAt(db: DatabaseSync, ip: string, now: number) {
  return { ...db.prepare(TAKE_TRY).get(ip, now, WINDOW) };
}

test("the real SQL counts tries in one window and starts again once it lapses", () => {
  const db = freshDb();
  const seen = [START, START + 60, START + WINDOW - 1, START + WINDOW, START + WINDOW + 5].map(
    (now) => takeAt(db, "203.0.113.7", now),
  );
  assert.deepEqual(seen, [
    { count: 1, first_at: START },
    { count: 2, first_at: START },
    { count: 3, first_at: START },
    { count: 1, first_at: START + WINDOW },
    { count: 2, first_at: START + WINDOW },
  ]);
});

test("the real SQL keeps one count per IP", () => {
  const db = freshDb();
  takeAt(db, "203.0.113.7", START);
  assert.deepEqual(takeAt(db, "198.51.100.4", START), { count: 1, first_at: START });
});
