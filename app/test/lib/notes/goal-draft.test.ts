import { describe, expect, it } from "vitest";
import { areaChoices, goalRequest } from "@/lib/notes/goal-draft.ts";
import { fixture } from "../../helpers.ts";

describe("goalRequest", () => {
  it("makes a Goal with its why as one line and each target as an open checklist line", () => {
    const request = goalRequest({
      title: "  Get   strong ",
      why: "Feel good\non hikes.",
      targets: "Bench 185 lb\n\n- [ ] Bench 205 lb\n  - Bench 225 lb  ",
      areas: ["fitness", "health"],
    });
    expect(request).toEqual({
      type: "Goal",
      title: "Get strong",
      areas: ["fitness", "health"],
      fields: { why: "Feel good on hikes." },
      sections: { "# Targets": ["- [ ] Bench 185 lb", "- [ ] Bench 205 lb", "- [ ] Bench 225 lb"] },
    });
  });

  it("leaves out why and targets when both were skipped", () => {
    const request = goalRequest({
      title: "Run a marathon",
      why: " ",
      targets: "\n",
      areas: ["fitness"],
    });
    expect(request).toEqual({ type: "Goal", title: "Run a marathon", areas: ["fitness"] });
  });
});

describe("areaChoices", () => {
  it("lists each life area note by its slug and title", () => {
    expect(areaChoices(fixture())).toEqual([{ slug: "fitness", title: "Fitness" }]);
  });
});
