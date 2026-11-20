import { describe, expect, it } from "vitest";
import {
  fileAsks,
  fileNotes,
  fileOpening,
  fileTodos,
  intakeQuestions,
} from "@/lib/notes/file-results.ts";
import { note } from "../../helpers.ts";

const file = note(
  "resources/workbook-ch2.md",
  "## Small wins\n\nNotice three wins.\n\n# Intake\n\n- What counts as a win?\n- When do you write?\n",
  { title: "workbook-ch2", meta: { asks: ["intake", "split", "made-up"] } },
);
const wellbeing = note(
  "topics/wellbeing.md",
  "# To-dos\n\n- [ ] Write three wins each night · from [workbook-ch2](../resources/workbook-ch2.md)\n- [x] Old win · from [workbook-ch2](../resources/workbook-ch2.md)\n\n# Notes\n\n- Small wins add up · from [workbook-ch2](../resources/workbook-ch2.md)\n",
  { title: "Wellbeing", type: "Topic" },
);
const notes = [file, wellbeing];

describe("file results", () => {
  it("keeps only known asks", () => {
    expect(fileAsks(file)).toEqual(["split", "intake"]);
  });

  it("finds open to-dos that link back to the file", () => {
    expect(fileTodos(notes, file).map((t) => [t.note.title, t.text])).toEqual([
      ["Wellbeing", "Write three wins each night"],
    ]);
  });

  it("counts note lines, not to-dos, that link back", () => {
    expect(fileNotes(notes, file).map((r) => [r.note.title, r.lines])).toEqual([["Wellbeing", 1]]);
  });

  it("reads the intake questions", () => {
    expect(intakeQuestions(file)).toEqual(["What counts as a win?", "When do you write?"]);
  });

  it("cuts a long file at a paragraph and says there is more", () => {
    const long = `${"Small wins matter. ".repeat(20)}\n\n${"Write them down. ".repeat(30)}`;
    expect(fileOpening(long)).toEqual({
      opening: `${"Small wins matter. ".repeat(20).trimEnd()}…`,
      more: true,
    });
  });
});
