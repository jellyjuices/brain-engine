import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { apiBrain, startApi, type Api } from "./api-helpers.ts";
import { addThread, listThreads } from "../src/intake/threads.ts";

const JOURNAL = "journal/2026-11-19-2312-i-don-t-know-how-to-feel.md";
const QUESTION = "What made weeks feel lighter in the past?";
const LENS = "me/wellbeing.md";
const ANSWER = "Long walks after work with no phone.";

async function withBrain(fn: (a: Api) => Promise<void>) {
  const root = apiBrain();
  addThread(root, { question: QUESTION, lens: "wellbeing" });
  const api = await startApi({}, root);
  try {
    await fn(api);
  } finally {
    api.close();
  }
}

const saveJournal = (a: Api) => a.call("POST", "/api/journal", { date: "2026-11-19", title: "", text: "I don't know how to feel about today.", created_at: "2026-11-19T23:12:01" });
const saveIntake = (a: Api) => a.call("POST", "/api/intake/save", { lens: "wellbeing", question: QUESTION, line: ANSWER });
const lensText = (a: Api) => readFileSync(join(a.root, LENS), "utf8");
const threadStatus = (a: Api) => listThreads(a.root).find((t) => t.question === QUESTION)?.status;

test("undo after a journal save and an intake save reverses the intake save, not the journal note", () => withBrain(async (a) => {
  await saveJournal(a);
  await saveIntake(a);

  const undone = await a.call("POST", "/api/undo", {});

  assert.equal(undone.status, 200, JSON.stringify(undone.data));
  assert.deepEqual({ journal: existsSync(join(a.root, JOURNAL)), answer: lensText(a).includes(ANSWER), thread: threadStatus(a) }, { journal: true, answer: false, thread: "open" });
}));

test("undo refuses when the newest change cannot be undone, and the older journal note stays", () => withBrain(async (a) => {
  await saveJournal(a);
  addThread(a.root, { question: "Who do you call when things go wrong?", lens: "wellbeing" });

  const undone = await a.call("POST", "/api/undo", {});

  assert.equal(undone.status, 400);
  assert.match(undone.data.error, /cannot be undone/);
  assert.equal(existsSync(join(a.root, JOURNAL)), true);
}));

test("a write answers with its undo_id, and undo with that id reverses only that change", () => withBrain(async (a) => {
  const journal = await saveJournal(a);
  await saveIntake(a);

  const undone = await a.call("POST", "/api/undo", { id: journal.data.undo_id });

  assert.equal(undone.status, 200, JSON.stringify(undone.data));
  assert.deepEqual({ journal: existsSync(join(a.root, JOURNAL)), answer: lensText(a).includes(ANSWER) }, { journal: false, answer: true });
}));

test("undo with an id that is undone already refuses and changes nothing", () => withBrain(async (a) => {
  const intake = await saveIntake(a);
  await a.call("POST", "/api/undo", { id: intake.data.undo_id });
  const before = lensText(a);

  const again = await a.call("POST", "/api/undo", { id: intake.data.undo_id });

  assert.equal(again.status, 400);
  assert.match(again.data.error, /undone already/);
  assert.equal(lensText(a), before);
}));

test("undo with an unknown id refuses", () => withBrain(async (a) => {
  const undone = await a.call("POST", "/api/undo", { id: "0badc0de" });

  assert.equal(undone.status, 400);
  assert.match(undone.data.error, /No change with id 0badc0de/);
}));

test("parking an intake question is one undoable change", () => withBrain(async (a) => {
  const skipped = await a.call("POST", "/api/intake/skip", { question: QUESTION });

  await a.call("POST", "/api/undo", { id: skipped.data.undo_id });

  assert.equal(threadStatus(a), "open");
}));
