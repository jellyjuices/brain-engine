import { describe, expect, it } from "vitest";
import { findIn } from "@/lib/search/device-find.ts";
import { embedQuery } from "@/lib/search/embed-query.ts";
import { findOnDevice } from "@/lib/search/find-on-device.ts";
import type { StoredVector } from "@/lib/search/vectors.ts";
import { createWordIndex } from "@/lib/search/word-index.ts";
import { note } from "../../helpers.ts";

const notes = [
  note("topics/health-log.md", "# Visits\n\nBooked the dentist for a cleaning.", {
    title: "Health log",
  }),
  note("topics/teeth.md", "# Notes\n\nA molar hurts when I chew.", { title: "Teeth" }),
  note("things/car.md", "# Care\n\nChange the oil in spring.", { title: "Car" }),
];

const NEAR: Record<string, number[]> = {
  "topics/health-log.md": [100, 0, 0],
  "topics/teeth.md": [90, 20, 0],
  "things/car.md": [0, 0, 100],
};

function setup() {
  const index = createWordIndex();
  index.sync(notes);
  const vectors = new Map<string, StoredVector>(
    index
      .entries()
      .map((entry) => [
        entry.id,
        { hash: entry.hash, vec: Int8Array.from(NEAR[entry.subject] ?? []) },
      ]),
  );
  return { index, vectors };
}

function paths(found: { notes: { path: string }[] }) {
  return found.notes.map((hit) => hit.path);
}

describe("meaning on the device", () => {
  it("with stored vectors, an entry near the top word hit joins the results", () => {
    const { index, vectors } = setup();
    expect(paths(findIn(index, "dentist", vectors, null))).toEqual([
      "topics/health-log.md",
      "topics/teeth.md",
    ]);
  });

  it("with no vectors, only word hits show", () => {
    const { index } = setup();
    expect(paths(findIn(index, "dentist", new Map(), null))).toEqual(["topics/health-log.md"]);
  });

  it("a query vector finds an entry with no shared word", () => {
    const { index, vectors } = setup();
    const query = Int8Array.from([80, 60, 0]);
    expect(paths(findIn(index, "toothache", vectors, query))).toEqual([
      "topics/teeth.md",
      "topics/health-log.md",
    ]);
  });

  it("embedQuery gives no vector yet, and search still works", async () => {
    expect(await embedQuery("dentist")).toBeNull();
    expect(paths(await findOnDevice("dentist", notes))).toEqual(["topics/health-log.md"]);
  });
});
