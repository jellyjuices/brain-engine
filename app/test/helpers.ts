import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { StoredNote } from "@/lib/notes/model.ts";

export function note(
  path: string,
  body: string,
  o: Partial<StoredNote> & { meta?: Record<string, unknown> } = {},
): StoredNote {
  const title = o.title ?? path.slice(path.lastIndexOf("/") + 1, -3);
  return {
    path,
    title,
    description: "",
    tags: [],
    status: "stable",
    modified: "2026-11-01",
    hash: `h-${path}`,
    type: undefined,
    meta: {},
    body,
    ...o,
  } as StoredNote;
}

export const NOW = "2026-11-05";

export function fixture(): StoredNote[] {
  return [
    note(
      "areas/fitness.md",
      "# To-dos\n\n- [ ] Make a sample plan · due 2026-11-05 · today\n- [ ] Buy a sample item · due 2026-11-09\n- [x] Book a sample visit · done 2026-11-05\n- [x] Skip a sample step · done 2026-11-05 · dropped\n\n# Notes\n\n- 2026-11-01 · Sample note.\n",
      { type: "Area", title: "Fitness", description: "Sample area." },
    ),
    note(
      "people/alex.md",
      "# To-dos\n\n- [ ] Follow up on the report · due 2026-11-03\n- [ ] Hear back about the quote · waiting\n- [ ] Call back · today · with [Alex](alex.md)\n\n# People\n\n- [Sam](sam.md) · sample role · since 2020\n",
      {
        type: "Person",
        title: "Alex",
        description: "Sample description.",
        meta: { type: "Person" },
      },
    ),
    note("people/sam.md", "# Notes\n\n- 2026-11-02 · Sample fact.\n", {
      type: "Person",
      title: "Sam",
      description: "Sample relation.",
    }),
    note("events/checkup.md", "# Prep\n", {
      type: "Event",
      title: "A sample event",
      status: "upcoming",
      meta: { type: "Event", date: "2026-11-05", status: "upcoming" },
    }),
    note("events/old-visit.md", "# Prep\n", {
      type: "Event",
      title: "Old visit",
      status: "done",
      meta: { type: "Event", date: "2026-11-05", status: "done" },
    }),
    note(".archive/old.md", "- [ ] Ghost · due 2026-11-01\n", { title: "Old" }),
  ];
}

const FAST_ITERATIONS = 1000;

export function fastPasswordKeys() {
  const derive = crypto.subtle.deriveKey.bind(crypto.subtle);
  return vi
    .spyOn(crypto.subtle, "deriveKey")
    .mockImplementation((algorithm, ...rest) =>
      derive(
        typeof algorithm === "object" && "iterations" in algorithm
          ? { ...algorithm, iterations: FAST_ITERATIONS }
          : algorithm,
        ...rest,
      ),
    );
}

export async function unlockTestVault(): Promise<void> {
  const { unlockWithPassword } = await import("@/lib/lock/vault.ts");
  const derive = fastPasswordKeys();
  await unlockWithPassword("test password");
  derive.mockRestore();
}

export function fakeTimeouts() {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}
