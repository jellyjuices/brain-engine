import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { applyChange, resetChanges, undoChange } from "@/lib/sync/changes.ts";
import { getConflict, keepMacCopy, keepMine, listConflicts } from "@/lib/sync/conflict.ts";
import { flush, list, remove } from "@/lib/sync/outbox.ts";
import { clearStore, getNote, putNotes } from "@/lib/storage/store.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import {
  hasPendingEdit,
  queueDecision,
  queueEdit,
  queueInbox,
  queueUndo,
  registerWrites,
} from "@/lib/sync/writes.ts";
import type { EditPayload } from "@/lib/sync/write-payloads.ts";
import { fixture, NOW, unlockTestVault } from "../../helpers.ts";

function reply(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}
function calls() {
  return (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
}
function bodyOf(i: number) {
  return JSON.parse(String(calls()[i]![1].body));
}

beforeAll(unlockTestVault);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
  await clearStore();
  resetSyncState();
  resetChanges();
  registerWrites();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
});

describe("outbox kinds", () => {
  it("an add sends into only when a note was named", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, {})),
    );
    await queueInbox("plain");
    await queueInbox("tomorrow: ask", "people/alex.md");
    expect((await flush()).sent).toHaveLength(2);
    expect(calls().map((c) => c[0])).toEqual(["/api/inbox", "/api/inbox"]);
    expect(bodyOf(0)).not.toHaveProperty("into");
    expect(bodyOf(1)).toMatchObject({ text: "tomorrow: ask", into: "people/alex.md" });
  });

  it("done, move and drop post to their routes with the stable ref and the answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, {})),
    );
    await queueDecision("areas/fitness.md::Sample to-do", {
      kind: "done",
      happened: " Sent it ",
      follow_up: "tomorrow: print",
    });
    await queueDecision("areas/fitness.md::Mat", { kind: "move", when: "2026-11-20" });
    await queueDecision("areas/fitness.md::Pool", { kind: "drop", why: "No time" });
    await queueDecision("areas/fitness.md::Bare", { kind: "done", happened: "", follow_up: "  " });
    const res = await flush();
    expect(res.sent).toHaveLength(4);
    expect(calls().map((c) => [c[0], c[1].method])).toEqual([
      ["/api/done", "POST"],
      ["/api/move", "POST"],
      ["/api/drop", "POST"],
      ["/api/done", "POST"],
    ]);
    expect(bodyOf(0)).toEqual({
      ref: "areas/fitness.md::Sample to-do",
      happened: "Sent it",
      follow_up: "tomorrow: print",
    });
    expect(bodyOf(1)).toEqual({ ref: "areas/fitness.md::Mat", when: "2026-11-20" });
    expect(bodyOf(2)).toEqual({ ref: "areas/fitness.md::Pool", why: "No time" });
    expect(bodyOf(3)).toEqual({ ref: "areas/fitness.md::Bare" });
  });

  it("reopen and edit post to their routes with the stable ref", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, {})),
    );
    await queueDecision("areas/fitness.md::Sample to-do", { kind: "reopen" });
    await queueDecision("areas/fitness.md::Mat", { kind: "edit", text: " Buy a new mat " });
    await flush();
    expect(calls().map((c) => c[0])).toEqual(["/api/reopen", "/api/edit-todo"]);
    expect([bodyOf(0), bodyOf(1)]).toEqual([
      { ref: "areas/fitness.md::Sample to-do" },
      { ref: "areas/fitness.md::Mat", text: "Buy a new mat" },
    ]);
  });

  it("waits offline and lands, in order, once the Mac answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await queueDecision("a.md::One", { kind: "done" });
    await queueDecision("a.md::Two", { kind: "move", when: "someday" });
    await queueUndo("ab12cd34");
    expect((await flush()).left).toBe(3);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200)),
    );
    const res = await flush();
    expect(res).toMatchObject({ left: 0 });
    expect(calls().map((c) => c[0])).toEqual(["/api/done", "/api/move", "/api/undo"]);
    expect(bodyOf(2)).toEqual({ id: "ab12cd34" });
  });

  it("a locked 401 keeps the write; a refused 400 drops it so the queue never jams", async () => {
    const locked = vi.fn();
    window.addEventListener("brain:locked", locked);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(401, { error: "locked" })),
    );
    await queueDecision("a.md::One", { kind: "done" });
    expect((await flush()).left).toBe(1);
    expect(locked).toHaveBeenCalled();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(400, { error: "That to-do is gone" })),
    );
    expect(await flush()).toMatchObject({ left: 0, dropped: [expect.any(String)] });
    window.removeEventListener("brain:locked", locked);
  });
});

describe("edit", () => {
  function edit(path = "areas/fitness.md") {
    return list().then((l) =>
      l.filter((i) => i.kind === "edit" && (i.payload as EditPayload).path === path),
    );
  }

  it("sends PUT with the body and the base hash, and stores the new copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(async () =>
          reply(200, { ...fixture()[0], body: "new", hash: "h2", backlinks: [] }),
        ),
    );
    await queueEdit("areas/fitness.md", "new", "h1");
    await flush();
    expect(calls()[0]![0]).toBe("/api/notes/areas/fitness.md");
    expect(calls()[0]![1].method).toBe("PUT");
    expect(bodyOf(0)).toEqual({ body: "new", base: "h1" });
    expect(await getNote("areas/fitness.md")).toMatchObject({ body: "new", hash: "h2" });
  });

  it("two waiting edits to one note become one: newest text, oldest base", async () => {
    await queueEdit("areas/fitness.md", "first", "h1");
    await queueEdit("areas/fitness.md", "second", "h-local");
    await queueEdit("people/sam.md", "other", "e1");
    const waiting = await edit();
    expect(waiting).toHaveLength(1);
    expect(waiting[0]!.payload).toEqual({ path: "areas/fitness.md", body: "second", base: "h1" });
    expect(await hasPendingEdit("areas/fitness.md")).toBe(true);
    expect(await hasPendingEdit("areas/none.md")).toBe(false);
  });
});

describe("a 409: changed on the Mac", () => {
  const mac = { ...fixture()[0]!, body: "Mac text", hash: "mac2", backlinks: [] };
  function clash() {
    return vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(async () =>
          reply(409, { error: "This note changed since you read it.", current: mac }),
        ),
    );
  }

  it("keeps both versions and removes the item, so the queue moves on", async () => {
    clash();
    await putNotes([{ ...fixture()[0]!, body: "my text" }]);
    await queueEdit("areas/fitness.md", "my text", "h1");
    const res = await flush();
    expect(res).toMatchObject({ left: 0 });
    const c = await getConflict("areas/fitness.md");
    expect(c).toMatchObject({ mine: "my text", current: { body: "Mac text", hash: "mac2" } });
    expect(await listConflicts()).toHaveLength(1);
  });

  it("Keep the Mac copy: the Mac's text becomes the local copy, nothing is sent", async () => {
    clash();
    await queueEdit("areas/fitness.md", "my text", "h1");
    await flush();
    vi.stubGlobal("fetch", vi.fn());
    await keepMacCopy("areas/fitness.md");
    expect(await getConflict("areas/fitness.md")).toBeUndefined();
    expect((await getNote("areas/fitness.md"))?.body).toBe("Mac text");
    expect(fetch).not.toHaveBeenCalled();
    expect(await list()).toHaveLength(0);
  });

  it("Keep mine: sends our text again on the Mac's new hash", async () => {
    clash();
    await queueEdit("areas/fitness.md", "my text", "h1");
    await flush();
    const again = await keepMine("areas/fitness.md");
    expect(again).toEqual({ body: "my text", base: "mac2" });
    expect(await getConflict("areas/fitness.md")).toBeUndefined();
    await queueEdit("areas/fitness.md", again!.body, again!.base);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, { ...mac, body: "my text", hash: "mac3" })),
    );
    await flush();
    expect(bodyOf(0)).toEqual({ body: "my text", base: "mac2" });
    expect(await getNote("areas/fitness.md")).toMatchObject({ body: "my text", hash: "mac3" });
  });
});

describe("a change, its Undo and the local copy", () => {
  const todo = {
    text: "Make a sample plan",
    path: "areas/fitness.md",
    subject: "Fitness",
    kind: "todo" as const,
    ref: "areas/fitness.md::Make a sample plan",
  };

  it("shows at once, queues the write, and Undo before it is sent just pulls it back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await putNotes(fixture());
    const change = await applyChange(todo, { kind: "done" }, NOW);
    expect(change.label).toBe("Done");
    expect((await getNote(todo.path))!.body).toContain("- [x] Make a sample plan");
    expect(await list()).toHaveLength(1);
    expect(await undoChange(change)).toBe(true);
    expect(await list()).toHaveLength(0);
    expect((await getNote(todo.path))!.body).toContain("- [ ] Make a sample plan");
  });

  it.each([
    [{ kind: "done" as const }, "Done. Back Thu", "done"],
    [{ kind: "skip" as const }, "Skipped. Back Thu", "skip"],
  ])("a repeating to-do: %o says when it comes back", async (decision, label, queued) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const hinges = { ...todo, text: "Oil the shed hinges", due: NOW, every: "week" };
    const change = await applyChange(hinges, decision, NOW);
    expect([change.label, change.next, (await list()).map((i) => i.kind)]).toEqual([
      label,
      "2026-11-12",
      [queued],
    ]);
  });

  it("Undo after it landed queues /api/undo with the id of that change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, { undo_id: "5e1f0a7c", notes: [] })),
    );
    await putNotes(fixture());
    const change = await applyChange(todo, { kind: "move", when: "2026-11-20" }, NOW);
    await flush();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await undoChange(change)).toBe(true);
    expect((await list()).map((i) => [i.kind, i.payload])).toEqual([["undo", { id: "5e1f0a7c" }]]);
    expect((await getNote(todo.path))!.body).toContain("due 2026-11-05 · today");
  });

  it("Undo after a landed write with no undo id is too late and queues nothing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => reply(200, { notes: [] })),
    );
    await putNotes(fixture());
    const change = await applyChange(todo, { kind: "move", when: "2026-11-20" }, NOW);
    await flush();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await undoChange(change)).toBe(false);
    expect(await list()).toEqual([]);
  });

  it("only the last change can be undone", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await putNotes(fixture());
    const first = await applyChange(todo, { kind: "done" }, NOW);
    await applyChange(
      { ...todo, text: "Buy a sample item", ref: "areas/fitness.md::Buy a sample item" },
      { kind: "drop" },
      NOW,
    );
    expect(await undoChange(first)).toBe(false);
  });
});
