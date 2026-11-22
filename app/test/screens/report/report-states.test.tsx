import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportScreen } from "@/screens/report/report.tsx";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

beforeAll(unlockTestVault);

beforeEach(() => go("/report/today"));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Report states", () => {
  it("says it is loading while the report is on its way", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<ReportScreen />);
    expect(screen.getByRole("status")).toHaveTextContent(copy.states.loading(copy.report.what));
  });

  it("says the home server is out of reach when offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<ReportScreen />);
    expect(await screen.findByText(copy.report.offlineTitle)).toBeInTheDocument();
  });

  it("offers Try again after a server error and shows the report on the next try", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(reply(500, { error: "Boom" }))
        .mockResolvedValue(reply(200, { markdown: "# Today\n\nTwo to-dos are due." })),
    );
    render(<ReportScreen />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.states.errorTitle(copy.report.what),
    );
    await user.click(screen.getByRole("button", { name: copy.states.tryAgain }));
    expect(await screen.findByText("Two to-dos are due.")).toBeInTheDocument();
  });
});
