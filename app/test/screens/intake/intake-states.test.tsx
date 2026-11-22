import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { IntakeScreen } from "@/screens/intake/intake.tsx";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

const QUESTION = "What made weeks feel lighter in the past?";

beforeAll(unlockTestVault);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Intake states", () => {
  it("a server error then Try again asks the home server again and shows the question", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(500, { error: "Boom" }))
      .mockResolvedValue(
        reply(200, { threads: [{ question: QUESTION, lens: "wellbeing", privacy: "full" }] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<IntakeScreen />);
    await user.click(await screen.findByRole("button", { name: copy.states.tryAgain }));
    expect(await screen.findByText(QUESTION)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("no connection says the home server is out of reach", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<IntakeScreen />);
    expect(await screen.findByText(copy.intake.offlineTitle)).toBeInTheDocument();
  });
});
