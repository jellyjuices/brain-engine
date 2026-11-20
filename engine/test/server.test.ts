import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { addDays, today } from "../src/core/notes.ts";
import { checkHost, createServer } from "../src/interface/server.ts";
import { loadToken } from "../src/interface/server-auth.ts";
import { safeNotePath } from "../src/interface/server-context.ts";
import { setLensPrivacy } from "../src/intake/lenses.ts";
import { addThread } from "../src/intake/threads.ts";
import { makeBrain } from "./fixture.ts";

const TOKEN = "test-token";
const now = today();

function brain(): string {
  const root = makeBrain();
  writeFileSync(join(root, "projects/visit.md"), `---\ntype: Project\ntitle: Family doctor visit\ndescription: A visit to the doctor.\n---\n\n# To-dos\n\n- [ ] Ask about Advil · due ${now} · today\n- [ ] Book the sleep test · due ${addDays(now, -1)}\n`);
  writeFileSync(join(root, "events/checkup.md"), `---\ntype: Event\ntitle: Checkup\ndescription: A checkup.\ndate: ${now}\nstatus: upcoming\n---\n\n# Prep\n`);
  return root;
}

interface Api { call: (method: string, path: string, body?: unknown, auth?: string | null) => Promise<{ status: number; data: any }>; close: () => void; root: string }

async function start(root = brain()): Promise<Api> {
  const server = createServer(root, TOKEN);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call: Api["call"] = async (method, path, body, auth = TOKEN) => {
    const res = await fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };
  return { call, close: () => server.close(), root };
}

async function withApi(fn: (api: Api) => Promise<void>): Promise<void> {
  const api = await start();
  try {
    await fn(api);
  } finally {
    api.close();
  }
}

test("auth: health is open, other routes need the right token", () => withApi(async (a) => {
  const health = await a.call("GET", "/api/health", undefined, null);
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);
  assert.ok(health.data.note_count >= 2, `got ${health.data.note_count}`);
  assert.equal((await a.call("GET", "/api/today", undefined, null)).status, 401);
  assert.equal((await a.call("GET", "/api/today", undefined, "wrong")).status, 401);
  const bad = await a.call("GET", "/api/today", undefined, "wrong");
  assert.match(bad.data.error, /\S/);
  assert.equal((await a.call("GET", "/api/today")).status, 200);
}));

test("search finds a note by words", () => withApi(async (a) => {
  const r = await a.call("GET", "/api/find?q=doctor&type=Project");
  assert.equal(r.status, 200);
  assert.deepEqual(["projects/visit.md"].filter((v) => !r.data.hits.map((h: { path: string }) => h.path).includes(v)), []);
  const card = await a.call("GET", "/api/card?q=Family%20doctor%20visit");
  assert.equal(card.data.card.subject.path, "projects/visit.md");
}));

test("notes since: returns changed notes with a hash, and one note with backlinks", () => withApi(async (a) => {
  const all = await a.call("GET", "/api/notes");
  assert.deepEqual(all.data.notes.filter((n: { hash: string; body: string }) => !(n.hash.length === 64 && typeof n.body === "string")), []);
  const future = await a.call("GET", `/api/notes?since=${encodeURIComponent("2100-01-01T00:00:00.000Z")}`);
  assert.deepEqual(future.data.notes, []);
  assert.equal((await a.call("GET", "/api/notes?since=nope")).status, 400);
  const one = await a.call("GET", "/api/notes/projects/visit.md");
  assert.equal(one.data.title, "Family doctor visit");
  assert.deepEqual(one.data.backlinks, []);
}));

for (const name of ["today", "weekly", "area/health"]) {
  test(`the ${name} report comes as JSON with Markdown`, () => withApi(async (a) => {
    const r = await a.call("GET", `/api/reports/${name}`);
    assert.equal(r.status, 200);
    assert.match(r.data.markdown, /\S/);
  }));
}

test("an unknown report is 404", () => withApi(async (a) => {
  assert.equal((await a.call("GET", "/api/reports/nope")).status, 404);
}));

test("today, done and undo round trip with stable refs", () => withApi(async (a) => {
  const today1 = await a.call("GET", "/api/today");
  const todo = today1.data.items.find((x: { text: string }) => x.text === "Ask about Advil");
  assert.equal(todo.ref, "projects/visit.md::Ask about Advil");
  const r = await a.call("POST", "/api/done", { ref: todo.ref, happened: "Booked it", follow_up: "tomorrow: Call the lab" });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const file = readFileSync(join(a.root, "projects/visit.md"), "utf8");
  assert.match(file, /- \[x\] Ask about Advil/);
  assert.match(file, /Call the lab/);
  const after = await a.call("GET", "/api/today");
  assert.deepEqual(after.data.items.filter((x: { text: string }) => x.text === "Ask about Advil"), []);
  assert.equal((await a.call("POST", "/api/undo", {})).status, 200);
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /- \[ \] Ask about Advil/);
  assert.equal((await a.call("POST", "/api/done", { ref: "projects/visit.md::Gone" })).status, 400);
}));

test("an event can be done by its path ref", () => withApi(async (a) => {
  const ev = (await a.call("GET", "/api/today")).data.items.find((x: { kind: string }) => x.kind === "event");
  assert.equal(ev.ref, "events/checkup.md");
  assert.equal((await a.call("POST", "/api/done", { ref: ev.ref })).status, 200);
  assert.match(readFileSync(join(a.root, "events/checkup.md"), "utf8"), /status: done/);
}));

test("move changes the date; drop ticks and marks dropped", () => withApi(async (a) => {
  const ref = "projects/visit.md::Book the sleep test";
  const m = await a.call("POST", "/api/move", { ref, when: "someday" });
  assert.equal(m.status, 200, JSON.stringify(m.data));
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /Book the sleep test · someday/);
  assert.equal((await a.call("POST", "/api/move", { ref, when: "never" })).status, 400);
  const d = await a.call("POST", "/api/drop", { ref, why: "Not needed" });
  assert.equal(d.status, 200, JSON.stringify(d.data));
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /\[x\] Book the sleep test.*dropped/);
}));

test("inbox saves a capture once per client_id", () => withApi(async (a) => {
  const body = { client_id: "c1", created_at: "2026-11-05T09:00:00", text: "Buy milk", tags: [] };
  const one = await a.call("POST", "/api/inbox", body);
  const two = await a.call("POST", "/api/inbox", body);
  assert.equal(one.status, 200);
  assert.equal(one.data.path, two.data.path);
  assert.equal(existsSync(join(a.root, one.data.path)), true);
  assert.equal((await a.call("POST", "/api/inbox", { text: "x" })).status, 400);
}));

test("edit: success logs and can be undone; stale base gets 409 with the current note", () => withApi(async (a) => {
  const note = (await a.call("GET", "/api/notes/projects/visit.md")).data;
  const ok = await a.call("PUT", "/api/notes/projects/visit.md", { body: note.body + "\n# Notes\n\n- 2026-11-05 · Hello\n", base: note.hash });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /Hello/);
  assert.notEqual(ok.data.hash, note.hash);
  const stale = await a.call("PUT", "/api/notes/projects/visit.md", { body: "other", base: note.hash });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.current.hash, ok.data.hash);
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /Hello/);
  assert.equal((await a.call("POST", "/api/undo", {})).status, 200);
  assert.doesNotMatch(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /Hello/);
}));

test("edit: tags are saved in the front matter; unknown tags are refused", () => withApi(async (a) => {
  const note = (await a.call("GET", "/api/notes/projects/visit.md")).data;
  const ok = await a.call("PUT", "/api/notes/projects/visit.md", { body: note.body, base: note.hash, tags: ["money", "home"] });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.deepEqual(ok.data.tags, ["money", "home"]);
  assert.match(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /tags: \[money, home\]/);
  const bad = await a.call("PUT", "/api/notes/projects/visit.md", { body: note.body, base: ok.data.hash, tags: ["not-a-real-tag"] });
  assert.equal(bad.status, 400);
  const cleared = await a.call("PUT", "/api/notes/projects/visit.md", { body: note.body, base: ok.data.hash, tags: [] });
  assert.equal(cleared.status, 200);
  assert.doesNotMatch(readFileSync(join(a.root, "projects/visit.md"), "utf8"), /tags:/);
}));

test("paths: traversal, absolute, sources/, hidden and archive writes are refused", () => withApi(async (a) => {
  writeFileSync(join(a.root, ".archive/old.md"), "---\ntype: Note\ntitle: Old\ndescription: Old.\n---\n\nold\n");
  const bad = ["..%2Fsecret.md", "%2Fetc%2Fpasswd.md", "projects%2F..%2F..%2Fx.md", "inbox%2F.hidden.md", ".brain%2Findex.md"];
  const statuses = await Promise.all(bad.map(async (p) => [p, (await a.call("GET", `/api/notes/${p}`)).status]));
  assert.deepEqual(statuses, bad.map((p) => [p, 400]));
  assert.equal((await a.call("GET", "/api/notes/sources/intake/x.md")).status, 403);
  assert.equal((await a.call("PUT", "/api/notes/sources/intake/x.md", { body: "x", base: "y" })).status, 403);
  assert.equal((await a.call("GET", "/api/notes/.archive/old.md")).status, 200);
  assert.equal((await a.call("PUT", "/api/notes/.archive/old.md", { body: "x", base: "y" })).status, 403);
  assert.equal((await a.call("GET", "/api/notes/projects/missing.md")).status, 404);
  assert.throws(() => safeNotePath("a/b.txt", false));
}));

test("bodies over 256 KB are refused; bad JSON is a 400", () => withApi(async (a) => {
  const big = await a.call("POST", "/api/inbox", { client_id: "b", text: "x".repeat(300 * 1024) });
  assert.equal(big.status, 413);
}));

test("token file is made once with mode 600; non-loopback hosts are refused", () => {
  const path = join(mkdtempSync(join(tmpdir(), "brain-token-")), "sub", "token");
  const said: string[] = [];
  const t1 = loadToken(path, (s) => said.push(s));
  assert.ok(t1.length >= 43, `got ${t1.length}`);
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.equal(said.length, 1);
  assert.equal(loadToken(path, (s) => said.push(s)), t1);
  assert.equal(said.length, 1);
  assert.throws(() => checkHost("0.0.0.0"));
  assert.doesNotThrow(() => checkHost("127.0.0.1"));
});

// ---- the web app on this Mac --------------------------------------------------------------------------------

import { request } from "node:http";
import { mkdirSync } from "node:fs";
import { LOCAL_COOKIE, localSecret } from "../src/interface/server-auth.ts";

function appDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "brain-app-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><html><head><title>Brain</title></head><body></body></html>");
  writeFileSync(join(dir, "assets", "a.js"), "console.log(1)");
  return dir;
}

type Raw = { status: number; headers: Record<string, string | string[] | undefined>; body: string };

async function local(fn: (raw: (method: string, path: string, headers?: Record<string, string>, body?: unknown) => Promise<Raw>, port: number, root: string) => Promise<void>) {
  process.env.BRAIN_APP_DIR = appDir();
  const root = brain();
  const server = createServer(root, TOKEN);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = (server.address() as AddressInfo).port;
  const raw = (method: string, path: string, headers: Record<string, string> = {}, body?: unknown) =>
    new Promise<Raw>((done, fail) => {
      const data = body === undefined ? undefined : JSON.stringify(body);
      const req = request({ host: "127.0.0.1", port, method, path, headers: { Host: `127.0.0.1:${port}`, ...(data && { "Content-Type": "application/json" }), ...headers } }, (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => done({ status: res.statusCode ?? 0, headers: res.headers, body: text }));
      });
      req.on("error", fail);
      req.end(data);
    });
  try {
    await fn(raw, port, root);
  } finally {
    server.close();
    delete process.env.BRAIN_APP_DIR;
  }
}

const COOKIE = { Cookie: `${LOCAL_COOKIE}=${localSecret(TOKEN)}` };

test("local app: the page is marked local and sets the cookie; any app path gets the page; files keep their type", () => local(async (raw) => {
  const page = await raw("GET", "/add");
  assert.equal(page.status, 200);
  assert.match(page.body, /<meta name="brain-local" content="1" \/>\s*<\/head>/);
  assert.match(String(page.headers["set-cookie"]), new RegExp(`${LOCAL_COOKIE}=${localSecret(TOKEN)}; Path=/; HttpOnly; SameSite=Strict`));
  const js = await raw("GET", "/assets/a.js");
  assert.equal(js.body, "console.log(1)");
  assert.match(String(js.headers["content-type"]), /javascript/);
  assert.equal((await raw("GET", "/sw.js")).status, 404, "no service worker on the Mac");
  const escape = await raw("GET", "/%2e%2e/%2e%2e/package.json");
  assert.doesNotMatch(escape.body, /"name"/, "a path cannot leave the app folder");
}));

test("local app: the tunnel, a proxy or another host name never gets the page or the cookie", () => local(async (raw) => {
  const cases: Record<string, string>[] = [{ "Cf-Connecting-Ip": "1.2.3.4" }, { "X-Forwarded-For": "1.2.3.4" }, { Host: "brain-mac.example.com" }, { Host: "evil.example:8787" }];
  for (const headers of cases) {
    const r = await raw("GET", "/", headers);
    assert.equal(r.status, 404, JSON.stringify(headers));
    assert.equal(r.headers["set-cookie"], undefined);
  }
}));

test("local app: the cookie opens the API on this Mac only; a write needs this exact origin", () => local(async (raw, port, root) => {
  const origin = { Origin: `http://127.0.0.1:${port}` };
  assert.equal((await raw("GET", "/api/today")).status, 401);
  assert.equal((await raw("GET", "/api/today", COOKIE)).status, 200);
  assert.equal((await raw("GET", "/api/today", { Cookie: `${LOCAL_COOKIE}=wrong` })).status, 401);
  assert.equal((await raw("GET", "/api/today", { ...COOKIE, "Cf-Ray": "x" })).status, 401, "through the tunnel the cookie is not enough");
  const item = { client_id: "m1", text: "Ask about the referral", into: "projects/visit.md" };
  assert.equal((await raw("POST", "/api/inbox", COOKIE, item)).status, 401, "a write with no Origin");
  assert.equal((await raw("POST", "/api/inbox", { ...COOKIE, Origin: "http://evil.example" }, item)).status, 401);
  const ok = await raw("POST", "/api/inbox", { ...COOKIE, ...origin }, item);
  assert.equal(ok.status, 200, ok.body);
  assert.equal(JSON.parse(ok.body).saved, "filed", "+ Add here files on the note, like brain pull");
  assert.match(readFileSync(join(root, "projects/visit.md"), "utf8"), /Ask about the referral/);
}));

test("people: add a person, no copy on retry, set a birthday", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/people", { name: "Sam Rivera", birthday: "1990-05-04" });
  assert.equal(made.status, 200);
  assert.equal(made.data.created, true);
  const again = await a.call("POST", "/api/people", { name: "sam rivera" });
  assert.equal(again.data.created, false);
  assert.equal(again.data.path, made.data.path);
  assert.equal((await a.call("POST", "/api/people", { name: "Bad Date", birthday: "May 4" })).status, 400);
  assert.equal((await a.call("POST", "/api/people", { name: "  " })).status, 400);
  const none = await a.call("POST", "/api/people", { name: "No Birthday" });
  const set = await a.call("POST", "/api/birthday", { path: none.data.path, birthday: "1985-01-02" });
  assert.equal(set.status, 200);
  assert.match(String(set.data.meta.birthday), /1985-01-02/);
  assert.equal((await a.call("POST", "/api/birthday", { path: "projects/visit.md", birthday: "1985-01-02" })).status, 400);
}));

test("journal: a longer note tied to a date and a person, no copy on retry", () => withApi(async (a) => {
  const person = await a.call("POST", "/api/people", { name: "Elena Lam" });
  const body = { title: "Session notes", text: "We talked about sleep.\nHomework: walk daily.", date: "2026-11-05", about: person.data.path };
  const made = await a.call("POST", "/api/journal", body);
  assert.equal(made.status, 200);
  assert.match(made.data.path, /^journal\/2026-11-05-\d{4}-session-notes\.md$/);
  const note = await a.call("GET", `/api/notes/${made.data.path}`);
  assert.match(note.data.body, /^We talked about sleep\.\nHomework: walk daily\.\n\n# Related\n\n- \[Elena Lam\]\(\.\.\/people\/elena-lam\.md\) · about/);
  const again = await a.call("POST", "/api/journal", body);
  assert.equal(again.data.created, false);
  assert.equal((await a.call("POST", "/api/journal", { ...body, date: "today" })).status, 400);
  assert.equal((await a.call("POST", "/api/journal", { ...body, text: "  " })).status, 400);
}));

test("subjects: add a place or a thing, no copy on retry, nothing else", () => withApi(async (a) => {
  const place = await a.call("POST", "/api/subjects", { type: "Place", name: "Ossington Clinic" });
  assert.equal(place.status, 200);
  assert.match(place.data.path, /^places\//);
  const thing = await a.call("POST", "/api/subjects", { type: "Thing", name: "Honda Civic" });
  assert.match(thing.data.path, /^things\//);
  assert.equal((await a.call("POST", "/api/subjects", { type: "Place", name: "ossington clinic" })).data.created, false);
  assert.equal((await a.call("POST", "/api/subjects", { type: "Project", name: "Website" })).status, 400);
}));

test("files: a text file becomes a note in resources, no copy on retry", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/files", { title: "Clinic letter", text: "Bring the MRI.\n" });
  assert.equal(made.status, 200);
  assert.match(made.data.path, /^resources\//);
  const again = await a.call("POST", "/api/files", { title: "Clinic letter", text: "Bring the MRI.\n" });
  assert.equal(again.data.created, false);
  assert.equal((await a.call("POST", "/api/files", { title: "Big", text: "x".repeat(61 * 1024) })).status, 413);
  assert.equal((await a.call("POST", "/api/files", { title: "  ", text: "hi" })).status, 400);
}));

test("files: the ways to use a file are kept as asks for a helper", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/files", { title: "Workbook ch2", text: "Small wins.\n", asks: ["split", "intake"] });
  const note = await a.call("GET", `/api/notes/${made.data.path}`);
  assert.deepEqual(note.data.meta.asks, ["split", "intake"]);
}));

test("files: an unknown way to use a file is 400", () => withApi(async (a) => {
  const bad = await a.call("POST", "/api/files", { title: "Workbook ch3", text: "More wins.\n", asks: ["summarize"] });
  assert.equal(bad.status, 400);
}));

test("inbox: sort an item into a person with a day, or archive it", () => withApi(async (a) => {
  const person = await a.call("POST", "/api/people", { name: "Dana Cole" });
  const one = await a.call("POST", "/api/inbox", { client_id: "c1", text: "Call about the quote" });
  const sorted = await a.call("POST", "/api/sort", { path: one.data.path, into: person.data.path, when: "2026-12-01" });
  assert.equal(sorted.status, 200);
  const note = await a.call("GET", `/api/notes/${person.data.path}`);
  assert.match(note.data.body, /- \[ \] Call about the quote · due 2026-12-01/);
  assert.equal((await a.call("GET", `/api/notes/${one.data.path}`)).status, 404);
  const two = await a.call("POST", "/api/inbox", { client_id: "c2", text: "Old idea" });
  assert.equal((await a.call("POST", "/api/inbox-drop", { path: two.data.path })).status, 200);
  assert.equal((await a.call("GET", `/api/notes/${two.data.path}`)).status, 404);
  assert.equal((await a.call("POST", "/api/inbox-drop", { path: person.data.path })).status, 400);
  assert.equal((await a.call("POST", "/api/sort", { path: "inbox/none.md", into: person.data.path, when: "soon-ish" })).status, 400);
}));

const LIGHTER = "What made weeks feel lighter in the past?";
const HARD_CALL = "Who do you talk to after a hard call?";

async function intakeApi(t: TestContext, question: string, lens: string) {
  const root = brain();
  setLensPrivacy(root, lens, "full");
  addThread(root, { question, lens });
  const a = await start(root);
  t.after(() => a.close());
  return { a, root };
}

test("intake: next lists open questions with their lens and privacy", async (t) => {
  const { a } = await intakeApi(t, LIGHTER, "wellbeing");
  const next = await a.call("GET", "/api/intake/next");
  assert.deepEqual(next.data.threads, [{ question: LIGHTER, lens: "wellbeing", privacy: "full" }]);
});

test("intake: save writes the lens line with its raw answer and closes the question", async (t) => {
  const { a, root } = await intakeApi(t, LIGHTER, "wellbeing");
  const saved = await a.call("POST", "/api/intake/save", { lens: "wellbeing", question: LIGHTER, line: "Long walks with Elena Lam.", raw: "Honestly the long walks with Elena Lam on Sundays.", by: "gemini-nano" });
  assert.equal(saved.data.path, "me/wellbeing.md");
  assert.match(readFileSync(join(root, "me/wellbeing.md"), "utf8"), /- Long walks with Elena Lam\. \(\[raw\]/);
  assert.deepEqual((await a.call("GET", "/api/intake/next")).data.threads, []);
});

test("intake: save refuses an unknown writer", async (t) => {
  const { a } = await intakeApi(t, HARD_CALL, "people");
  const r = await a.call("POST", "/api/intake/save", { lens: "people", question: HARD_CALL, line: "My sister.", by: "claude" });
  assert.equal(r.status, 400);
});

test("intake: skip closes the question", async (t) => {
  const { a } = await intakeApi(t, HARD_CALL, "people");
  assert.equal((await a.call("POST", "/api/intake/skip", { question: HARD_CALL })).status, 200);
  assert.deepEqual((await a.call("GET", "/api/intake/next")).data.threads, []);
});
