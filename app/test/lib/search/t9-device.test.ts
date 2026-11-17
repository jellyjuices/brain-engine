import { describe, expect, it } from "vitest";
import { findIn } from "@/lib/search/device-find.ts";
import { createWordIndex } from "@/lib/search/word-index.ts";
import { note } from "../../helpers.ts";
import { questions, t9Notes } from "./t9-notes.ts";

const TOP = 5;
const WORD_GROUPS = ["words", "typo", "part", "spanish", "japanese"];

function topPaths(q: string): string[] {
  const index = createWordIndex();
  index.sync(t9Notes());
  return findIn(index, q, new Map(), null)
    .notes.slice(0, TOP)
    .map((hit) => hit.path);
}

describe("T9 on the device", () => {
  const asked = questions.filter((question) => WORD_GROUPS.includes(question.group));

  it.each(asked.map((question) => [question.group, question.q, question.want] as const))(
    "%s: %s is found in the top 5",
    (_group, q, want) => {
      expect(topPaths(q)).toEqual(expect.arrayContaining(want));
    },
  );

  it("finds a 2-character Japanese word inside a longer run", () => {
    const index = createWordIndex();
    index.sync([
      note("people/sora.md", "# Notes\n\n来月は大阪へ行く予定です。", { title: "Sora" }),
      note("places/park.md", "# Notes\n\nA quiet park by the river.", { title: "Park" }),
    ]);
    expect(findIn(index, "大阪", new Map(), null).notes.map((hit) => hit.path)).toEqual([
      "people/sora.md",
    ]);
  });

  it("shows the top line as the answer, with its note path and date", () => {
    const index = createWordIndex();
    index.sync(t9Notes());
    const answer = findIn(index, "cedar boards", new Map(), null).answer;
    expect(answer).toMatchObject({
      path: "projects/garden-shed.md",
      text: "Buy cedar boards at the yard",
    });
  });
});
