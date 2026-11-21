import { test } from "node:test";
import assert from "node:assert/strict";
import { cut, fakeHelper, good, helperOff, helperOn, MODEL, REDIRECT, setHelperLines } from "./helper-fake.ts";
import { helperConfig } from "../src/helper/config.ts";
import { ask, type Ask, HelperError, unload } from "../src/helper/runner.ts";

const schema = {
  type: "object",
  properties: { items: { type: "array", items: { type: "object", properties: { text: { type: "string" }, check: { type: "boolean" } }, required: ["text", "check"], additionalProperties: false } } },
  required: ["items"],
  additionalProperties: false,
};
const split: Ask = { kind: "split", system: "Sort the file.", user: "<file>Buy cedar boards.</file>", schema, maxTokens: 4000, temperature: 0.2 };
const answer = { items: [{ text: "Buy cedar boards", check: false }] };

const configCases: [string, Record<string, string>, boolean][] = [
  ["no lines", {}, false],
  ["a URL with no model", { BRAIN_HELPER_URL: "http://127.0.0.1:5050" }, false],
  ["a model with no URL", { BRAIN_HELPER_MODEL: MODEL }, false],
  ["a URL on another host", { BRAIN_HELPER_URL: "http://192.168.1.20:5050", BRAIN_HELPER_MODEL: MODEL }, false],
  ["a loopback URL and a model", { BRAIN_HELPER_URL: "http://localhost:5050/", BRAIN_HELPER_MODEL: MODEL }, true],
];

for (const [name, lines, on] of configCases) {
  test(`helperConfig with ${name} is ${on ? "on" : "off"}`, () => {
    setHelperLines(lines);
    assert.equal(helperConfig() !== null, on);
  });
}

test("helperConfig reads a change in the config with no restart", () => {
  helperOn("http://127.0.0.1:5050");
  const before = helperConfig();
  helperOff();
  assert.deepEqual([before, helperConfig()], [{ url: "http://127.0.0.1:5050", model: MODEL }, null]);
});

test("ask returns the checked answer and sends the cap, the keep and no thinking", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  fake.replies.push(good(answer));
  const value = await ask(split);
  const sent = fake.seen[0].body;
  assert.deepEqual([value, sent.model, sent.max_tokens, sent.keep_alive, sent.think, sent.response_format.type], [answer, MODEL, 4000, "5m", false, "json_schema"]);
});

test("ask retries once when the first reply ends on length", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  fake.replies.push(cut('{"items": [   '), good(answer));
  assert.deepEqual(await ask(split), answer);
});

test("ask retries once when the first reply fails the guard", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  fake.replies.push(good({ items: [{ text: "Buy cedar boards", check: false, extra: 1 }] }), good(answer));
  assert.deepEqual(await ask(split), answer);
});

test("two bad replies fail with an owner-words reason", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  fake.replies.push(cut("   "), good("not an object"));
  await assert.rejects(ask(split), { message: "The helper's answer could not be read." });
});

test("a refused connection fails at once as not running", async () => {
  const fake = await fakeHelper();
  fake.close();
  helperOn(fake.url);
  await assert.rejects(ask(split), (e: unknown) => e instanceof HelperError && e.message === "The helper is not running on your home server.");
});

test("a redirect from the helper fails the call and is not followed", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  fake.replies.push(REDIRECT);
  await assert.rejects(ask(split), { message: "The helper could not answer." });
});

test("ask with no helper set up fails as off", async () => {
  helperOff();
  await assert.rejects(ask(split), { message: "No helper is set up on your home server." });
});

test("unload asks the helper to drop the model at once", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  await unload();
  assert.deepEqual(fake.seen, [{ path: "/api/generate", body: { model: MODEL, prompt: "", keep_alive: 0 } }]);
});
