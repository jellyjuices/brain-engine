import { describe, expect, it } from "vitest";
import { areaChoices, goalRequest } from "@/lib/notes/goal-draft.ts";
import { fixture } from "../../helpers.ts";

describe("goalRequest", () => {
  it("makes a Goal with its why as one line and each target as an open checklist line", () => {
    const request = goalRequest({
      title: "  Get   strong ",
      why: "Feel good\non hikes.",
      targets: ["First sample target", "  ", "Second  sample target ", "Third sample target"],
      areas: ["fitness", "health"],
    });
    expect(request).toEqual({
      type: "Goal",
      title: "Get strong",
      areas: ["fitness", "health"],
      fields: { why: "Feel good on hikes." },
      sections: {
        "# Targets": [
          "- [ ] First sample target",
          "- [ ] Second sample target",
          "- [ ] Third sample target",
        ],
      },
    });
  });

  it("leaves out why and targets when both were skipped", () => {
    const request = goalRequest({
      title: "Another sample goal",
      why: " ",
      targets: [],
      areas: ["fitness"],
    });
    expect(request).toEqual({ type: "Goal", title: "Another sample goal", areas: ["fitness"] });
  });
});

describe("areaChoices", () => {
  it("lists each life area note by its slug and title", () => {
    expect(areaChoices(fixture())).toEqual([{ slug: "fitness", title: "Fitness" }]);
  });
});
