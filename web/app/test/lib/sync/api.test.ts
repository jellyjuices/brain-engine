import { afterEach, describe, expect, it, vi } from "vitest";
import { api, LOCKED_EVENT } from "@/lib/sync/api.ts";

function reply(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}
afterEach(() => vi.unstubAllGlobals());

describe("api", () => {
  it("fires the lock event on a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(401, { error: "This brain is locked" })),
    );
    const locked = vi.fn();
    window.addEventListener(LOCKED_EVENT, locked);
    const res = await api("/api/inbox", { body: { text: "x" } });
    window.removeEventListener(LOCKED_EVENT, locked);
    expect(locked).toHaveBeenCalledOnce();
    expect(res).toMatchObject({ ok: false, status: 401 });
  });

  it("does not fire the lock event for a wrong password (quiet401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(401, { error: "That password is not right" })),
    );
    const locked = vi.fn();
    window.addEventListener(LOCKED_EVENT, locked);
    await api("/api/unlock", { body: { password: "no" }, quiet401: true });
    window.removeEventListener(LOCKED_EVENT, locked);
    expect(locked).not.toHaveBeenCalled();
  });

  it("returns a typed offline result when the network is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect(await api("/api/x")).toEqual({ ok: false, offline: true });
  });

  it("returns offline for a 503 from the Mac proxy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(503, { error: "The Mac is offline", offline: true })),
    );
    expect(await api("/api/today")).toEqual({ ok: false, offline: true });
  });

  it("sends JSON with the same-origin cookie and parses the reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await api("/api/inbox", { body: { text: "hi" } });
    expect(res).toMatchObject({ ok: true, data: { ok: true } });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      body: '{"text":"hi"}',
    });
  });

  it("passes Retry-After on a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply(429, { error: "Too many" }, { "Retry-After": "120" })),
    );
    expect(await api("/api/unlock", { body: {}, quiet401: true })).toMatchObject({
      ok: false,
      status: 429,
      retryAfter: 120,
    });
  });
});
