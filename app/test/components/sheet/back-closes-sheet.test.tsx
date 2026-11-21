import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openSheet } from "@/components/sheet/open-sheet.tsx";
import { goTab, HOME, startRouter, stopRouter } from "@/lib/platform/router.ts";

function pressBack() {
  const popped = new Promise((resolve) => addEventListener("popstate", resolve, { once: true }));
  history.back();
  return popped;
}

beforeEach(() => {
  history.replaceState(null, "", HOME);
  startRouter();
  goTab("/brain");
});

afterEach(stopRouter);

describe("back with a sheet open", () => {
  it("closes the sheet and stays on the screen", async () => {
    let answer: Promise<string | null> = Promise.resolve(null);
    act(() => {
      answer = openSheet<string>("Fitness", () => <p>Make a sample plan</p>);
    });
    await act(pressBack);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect([await answer, location.pathname]).toEqual([null, "/brain"]);
  });
});
