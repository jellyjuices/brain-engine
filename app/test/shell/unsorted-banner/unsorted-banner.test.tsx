import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/content/index.ts";
import { renderShell, resetShell, stubUnsorted } from "../shell-setup.tsx";

afterEach(() => {
  cleanup();
  resetShell();
});

describe("UnsortedBanner", () => {
  it("shows the count from /api/unsorted on To-dos", async () => {
    stubUnsorted(3);
    renderShell("phone");
    expect(await screen.findByRole("status")).toHaveTextContent(copy.nav.toSort(3));
  });

  it("its Sort button opens the sort screen", async () => {
    const user = userEvent.setup();
    stubUnsorted(2);
    renderShell("phone");
    await user.click(await screen.findByRole("button", { name: copy.nav.sort }));
    expect(location.pathname).toBe("/inbox");
  });

  it("stays hidden when nothing waits", async () => {
    stubUnsorted(0);
    renderShell("phone");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/unsorted", expect.anything()));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("stays hidden offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderShell("phone");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not ask the server away from To-dos", () => {
    stubUnsorted(4);
    renderShell("phone", "/find");
    expect(fetch).not.toHaveBeenCalled();
  });
});
