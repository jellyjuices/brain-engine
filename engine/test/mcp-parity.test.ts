import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { addThread } from "../src/intake/threads.ts";
import { issueAgentToken } from "../src/interface/server-agent.ts";
import { HttpError } from "../src/interface/server-auth.ts";
import { TextBody } from "../src/interface/server-send.ts";
import { findTool, runTool, TOOLS } from "../src/interface/mcp/tools.ts";
import { apiBrain, now, startApi } from "./api-helpers.ts";

type Seen = Record<string, any>;
type Step = [tool: string, args: (seen: Seen) => Record<string, unknown>];
const SHED = "projects/garden-shed.md";
const refOf = (s: Seen, words: string) => s.todos.items.find((t: { text: string }) => t.text.includes(words)).ref as string;

const STEPS: Step[] = [
  ["find", () => ({ q: "cedar" })],
  ["todos", () => ({ view: "all" })],
  ["today", () => ({})],
  ["read_note", () => ({ path: SHED })],
  ["edit_note", (s) => ({ path: SHED, body: `${s.read_note.body}\nA made-up line.\n`, base: s.read_note.hash })],
  ["unsorted", () => ({})],
  ["relations", () => ({ path: "people/alex-sample.md" })],
  ["intake_next", () => ({})],
  ["goals", () => ({})],
  ["goal", () => ({ path: "goals/run-far.md" })],
  ["decision", () => ({ path: "decisions/pick-shoes.md" })],
  ["add", () => ({ client_id: "c1", text: "call the roofer about tiles" })],
  ["sort", (s) => ({ path: s.add.path, into: SHED, when: "tomorrow" })],
  ["sorted", () => ({})],
  ["move_line", (s) => ({ path: SHED, line: s.sorted.subjects[0].lines[0].line, into: "people/alex-sample.md" })],
  ["done", (s) => ({ ref: refOf(s, "cedar"), happened: "Got them cheap." })],
  ["move", (s) => ({ ref: refOf(s, "roof"), when: "someday" })],
  ["skip", (s) => ({ ref: refOf(s, "Oil the shed hinges") })],
  ["edit_todo", (s) => ({ ref: refOf(s, "roof"), text: "Fix the roof before the rain" })],
  ["delete_todo", (s) => ({ ref: refOf(s, "base") })],
  ["undo", () => ({})],
  ["log", () => ({ n: 5 })],
  ["make_note", () => ({ type: "Goal", title: "Run a made-up 10k" })],
  ["add_relation", () => ({ from: "people/alex-sample.md", to: SHED, role: "helper" })],
  ["intake_save", () => ({ lens: "now", question: "What fills your week?", line: "Building a shed." })],
  ["intake_skip", () => ({ question: "What made-up place calms you?" })],
];

const normal = (x: unknown) =>
  JSON.stringify(x)
    .replace(/"undo_id":"[0-9a-f]{8}"/g, '"undo_id":"<id>"')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?/g, "<time>")
    .replace(/\b[0-9a-f]{64}\b/g, "<hash>")
    .replace(/\d{8}T\d{6}Z?/g, "<stamp>")
    .replace(/\d{4}-\d{2}-\d{2}-\d{4}-/g, "<day>-")
    .replace(/"id":"[0-9a-f]{8}"/g, `"id":"<id>"`);

async function viaTool(name: string, args: Record<string, unknown>, root: string, agentFile: string) {
  try {
    const result = await runTool(findTool(name)!, args, root, agentFile);
    return { status: 200, data: result instanceof TextBody ? result.text : JSON.parse(JSON.stringify(result)) };
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
    return { status: e.status, data: { error: e.message, ...e.extra } };
  }
}

function seedGoals(root: string) {
  mkdirSync(join(root, "goals"), { recursive: true });
  mkdirSync(join(root, "decisions"), { recursive: true });
  writeFileSync(join(root, "projects/shed-upkeep.md"), `---\ntype: Project\ntitle: Shed upkeep\ndescription: Keep the shed in shape.\n---\n\n# To-dos\n\n- [ ] Oil the shed hinges · due ${now} · every month\n\n# Notes\n`);
  writeFileSync(join(root, "goals/run-far.md"), "---\ntype: Goal\ntitle: Run far\nstatus: active\nareas: [health]\n---\n\n# Why\n\n# Targets\n\n- [x] Run 5 km · done 2026-03-05\n- [ ] Run 10 km\n\n# Wins\n\n# Notes\n");
  writeFileSync(join(root, "decisions/pick-shoes.md"), `---\ntype: Decision\ntitle: Pick shoes?\nstatus: open\ndecide_by: ${now}\nareas: [health]\n---\n\n# Rants\n\n# Buckets\n\n# Options\n\n# Decided\n\n# Goals\n\n- [Run far](../goals/run-far.md)\n`);
}

test("T4: the steps cover every tool once", () => {
  assert.deepEqual(STEPS.map(([n]) => n).sort(), TOOLS.map((t) => t.def.name).sort());
});

test("T4: each tool gives the same result as its route", async (t) => {
  const api = await startApi({ agentRate: 10_000 });
  t.after(() => api.close());
  const agent = issueAgentToken(api.agentFile);
  const root = apiBrain();
  for (const r of [api.root, root]) for (const question of ["What fills your week?", "What made-up place calms you?"]) addThread(r, { question, lens: "now" });
  for (const r of [api.root, root]) seedGoals(r);
  const toolAgentFile = join(mkdtempSync(join(tmpdir(), "brain-agent-")), "agent-token");
  const seenHttp: Seen = {};
  const seenTool: Seen = {};
  const failed: string[] = [];
  for (const [name, argsOf] of STEPS) {
    const { route } = findTool(name)!;
    const httpArgs = argsOf(seenHttp);
    const tool = await viaTool(name, argsOf(seenTool), root, toolAgentFile);
    const http = await callRoute(api.base, agent, route.method, route.path, route.prefix, httpArgs);
    assert.equal(tool.status, http.status, `${name}: status`);
    assert.equal(normal(tool.data), normal(http.data), `${name}: result`);
    if (http.status !== 200) failed.push(name);
    seenHttp[name] = http.data;
    seenTool[name] = tool.data;
  }
  assert.deepEqual(failed, []);
});

const REST: Record<string, string> = { "/api/notes/": "path", "/api/drafts/": "id", "/api/reports/": "name", "/api/goals/": "path", "/api/decisions/": "path" };

async function callRoute(base: string, token: string, method: string, path: string, prefix: boolean | undefined, args: Record<string, unknown>) {
  const fields = { ...args };
  let url = base + path;
  if (prefix) {
    url += String(fields[REST[path]]);
    delete fields[REST[path]];
  }
  const get = method === "GET";
  if (get) url += "?" + new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, String(v)])).toString();
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: get || method === "DELETE" ? undefined : JSON.stringify(fields) });
  const text = await res.text();
  return { status: res.status, data: (res.headers.get("content-type") ?? "").includes("json") ? JSON.parse(text) : text };
}
