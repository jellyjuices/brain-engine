import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openLayer } from "@/lib/platform/back-stack.ts";
import { back, go, goTab, HOME, startRouter, stopRouter } from "@/lib/platform/router.ts";

function here() {
  return location.pathname + location.search;
}

async function pressBack() {
  const popped = new Promise((resolve) => addEventListener("popstate", resolve, { once: true }));
  history.back();
  await popped;
}

function start(url: string) {
  history.replaceState(null, "", url);
  startRouter();
}

beforeEach(() => history.replaceState(null, "", "/"));
afterEach(stopRouter);

describe("router start", () => {
  it("puts To-dos under a shared link, so back lands on To-dos", async () => {
    start("/add?text=Call%20the%20dentist");
    await pressBack();
    expect(here()).toBe(HOME);
  });

  it("opens on To-dos when the app starts at the root", () => {
    start("/");
    expect(here()).toBe("/");
  });
});

describe("back", () => {
  it("goes back one screen from a note", async () => {
    start(HOME);
    go("/brain");
    go("/note/areas/fitness.md");
    back();
    await vi.waitFor(() => expect(here()).toBe("/brain"));
  });

  it("goes to To-dos when there is nothing to go back to", () => {
    start("/brain");
    history.replaceState(null, "", "/brain");
    back();
    expect(here()).toBe(HOME);
  });

  it("from a main tab lands on To-dos", async () => {
    start(HOME);
    goTab("/find");
    await pressBack();
    expect(here()).toBe(HOME);
  });

  it("from a tab reached after a note still lands on To-dos", async () => {
    start(HOME);
    goTab("/brain");
    go("/note/areas/fitness.md");
    goTab("/find");
    await vi.waitFor(() => expect(here()).toBe("/find"));
    await pressBack();
    expect(here()).toBe(HOME);
  });

  it("closes an open layer before it leaves the screen", async () => {
    start(HOME);
    goTab("/find");
    const close = vi.fn();
    openLayer(close);
    await pressBack();
    expect([here(), close.mock.calls.length]).toEqual(["/find", 1]);
  });

  it("waits for a closed layer before it moves to a new screen", async () => {
    start(HOME);
    const release = openLayer(() => undefined);
    release();
    go("/note/areas/fitness.md");
    await vi.waitFor(() => expect(here()).toBe("/note/areas/fitness.md"));
    await pressBack();
    expect(here()).toBe(HOME);
  });
});
