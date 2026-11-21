import { describe, expect, it } from "vitest";
import { applyDecision } from "@/lib/sync/local-edit.ts";
import { note } from "../../helpers.ts";

const PATH = "projects/garden-shed.md";
const shed = note(
  PATH,
  "# To-dos\n\n- [x] Order cedar boards · due 2026-11-02 · done 2026-11-04\n- 2026-11-04 · Got them cheap.\n- [ ] Call the roofer · with [Dana Cole](../people/dana-cole.md) · due 2026-11-20\n",
);
function todo(text: string) {
  return {
    text,
    path: PATH,
    subject: "Garden shed",
    kind: "todo" as const,
    ref: `${PATH}::${text}`,
  };
}

describe("reopen and edit on the local copy", () => {
  it("reopen puts a done to-do back as open and takes off its done note", () => {
    const out = applyDecision(shed, todo("Order cedar boards"), { kind: "reopen" }, "2026-11-05")!;
    expect(out.body).toBe(
      "# To-dos\n\n- [ ] Order cedar boards · due 2026-11-02\n- [ ] Call the roofer · with [Dana Cole](../people/dana-cole.md) · due 2026-11-20\n",
    );
  });

  it("edit changes the words and keeps the person and the due date", () => {
    const out = applyDecision(
      shed,
      todo("Call the roofer"),
      { kind: "edit", text: "Call the roofer about tiles" },
      "2026-11-05",
    )!;
    expect(out.body).toContain(
      "- [ ] Call the roofer about tiles · with [Dana Cole](../people/dana-cole.md) · due 2026-11-20\n",
    );
  });

  it.each([
    [
      "done moves the date and adds one Done line",
      { kind: "done" as const },
      "- [ ] Oil the hinges · due 2026-12-01 · every month\n- 2026-11-05 · Done: Oil the hinges\n\n",
    ],
    [
      "skip moves the date with no Done line",
      { kind: "skip" as const },
      "- [ ] Oil the hinges · due 2026-12-01 · every month\n\n",
    ],
    [
      "stop repeat keeps the date and drops the repeat",
      { kind: "stopRepeat" as const },
      "- [ ] Oil the hinges · due 2026-11-01\n\n",
    ],
  ])("a repeating to-do: %s", (_name, decision, lines) => {
    const upkeep = note(
      PATH,
      "# To-dos\n\n- [ ] Oil the hinges · due 2026-11-01 · every month\n\n# Notes\n",
    );
    const out = applyDecision(upkeep, todo("Oil the hinges"), decision, "2026-11-05")!;
    expect(out.body).toBe(`# To-dos\n\n${lines}# Notes\n`);
  });

  it("reopen on an event changes nothing", () => {
    const event = { ...todo("A sample event"), kind: "event" as const, ref: "events/checkup.md" };
    expect(applyDecision(shed, event, { kind: "reopen" }, "2026-11-05")).toBeNull();
  });
});
